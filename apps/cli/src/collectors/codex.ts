import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import type { CodexSource } from "@aieracard/schema";
import { ratesFor } from "../pricing/modelPricing.js";
import { longestStreak, toDateOnly } from "../dates.js";

export interface CodexResult {
  source: CodexSource;
  activeDates: Set<string>;
  filesParsed: number;
}

interface TokenBucket {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  reasoning_output_tokens: number;
  total_tokens: number;
}

function codexHome(): string {
  return process.env.CODEX_HOME?.split(",")[0]?.trim() || join(homedir(), ".codex");
}

export function codexSessionsRoots(home = codexHome()): string[] {
  return [join(home, "sessions"), join(home, "archived_sessions")];
}

function asBucket(v: unknown): TokenBucket | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const n = (k: string) =>
    typeof o[k] === "number" && Number.isFinite(o[k]) ? (o[k] as number) : 0;
  return {
    input_tokens: n("input_tokens"),
    cached_input_tokens: n("cached_input_tokens"),
    output_tokens: n("output_tokens"),
    reasoning_output_tokens: n("reasoning_output_tokens"),
    total_tokens: n("total_tokens"),
  };
}

function delta(cur: TokenBucket, prev: TokenBucket | null): TokenBucket {
  if (!prev) return cur;
  return {
    input_tokens: Math.max(0, cur.input_tokens - prev.input_tokens),
    cached_input_tokens: Math.max(
      0,
      cur.cached_input_tokens - prev.cached_input_tokens
    ),
    output_tokens: Math.max(0, cur.output_tokens - prev.output_tokens),
    reasoning_output_tokens: Math.max(
      0,
      cur.reasoning_output_tokens - prev.reasoning_output_tokens
    ),
    total_tokens: Math.max(0, cur.total_tokens - prev.total_tokens),
  };
}

function isZero(b: TokenBucket): boolean {
  return (
    b.input_tokens === 0 &&
    b.cached_input_tokens === 0 &&
    b.output_tokens === 0 &&
    b.reasoning_output_tokens === 0 &&
    b.total_tokens === 0
  );
}

async function listJsonlFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && e.name.endsWith(".jsonl")) out.push(p);
    }
  }
  await walk(root);
  return out;
}

/**
 * Parse OpenAI Codex CLI session JSONL under ~/.codex/sessions
 * (and archived_sessions). Token events are cumulative — we diff
 * total_token_usage (not last_token_usage) to avoid double-counting
 * duplicate snapshots (ccusage issue #884).
 */
export async function collectCodex(
  home = codexHome()
): Promise<CodexResult | null> {
  const sessionRoot = join(home, "sessions");
  const archivedRoot = join(home, "archived_sessions");

  const activeFiles = await listJsonlFiles(sessionRoot);
  const archivedFiles = await listJsonlFiles(archivedRoot);
  const seenRel = new Set(
    activeFiles.map((f) => relative(sessionRoot, f).replace(/\\/g, "/"))
  );
  const files = [
    ...activeFiles,
    ...archivedFiles.filter((f) => {
      const rel = relative(archivedRoot, f).replace(/\\/g, "/");
      return !seenRel.has(rel);
    }),
  ];
  if (files.length === 0) return null;

  let tokensIn = 0;
  let tokensOut = 0;
  let cacheRead = 0;
  let reasoning = 0;
  let costUsd = 0;
  let hasUnpricedModel = false;
  const sessions = new Set<string>();
  const activeDates = new Set<string>();
  const models = new Set<string>();
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  let filesParsed = 0;

  for (const file of files) {
    filesParsed++;
    sessions.add(file);
    let prevTotals: TokenBucket | null = null;
    let currentModel: string | null = null;

    const rl = createInterface({
      input: createReadStream(file),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (
        !line.includes("token_count") &&
        !line.includes("turn_context") &&
        !line.includes("session_meta")
      ) {
        continue;
      }
      let entry: any;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      const ts =
        typeof entry.timestamp === "string"
          ? toDateOnly(entry.timestamp)
          : null;

      if (entry.type === "turn_context") {
        const model =
          entry.payload?.model ??
          entry.payload?.info?.model ??
          entry.model;
        if (typeof model === "string" && model) currentModel = model;
        continue;
      }

      if (entry.type === "session_meta") {
        const id = entry.payload?.id ?? entry.payload?.session_id;
        if (typeof id === "string" && id) {
          sessions.delete(file);
          sessions.add(id);
        }
        continue;
      }

      if (entry.type !== "event_msg") continue;
      if (entry.payload?.type !== "token_count") continue;

      const total = asBucket(entry.payload?.info?.total_token_usage);
      if (!total) continue;

      const d = delta(total, prevTotals);
      prevTotals = total;
      if (isZero(d)) continue;

      // Codex reports cached_input as a subset of input_tokens (see totals).
      const cached = d.cached_input_tokens;
      const nonCachedIn = Math.max(0, d.input_tokens - cached);
      const outTok = d.output_tokens;
      const reasonTok = d.reasoning_output_tokens;

      tokensIn += d.input_tokens;
      cacheRead += cached;
      tokensOut += outTok;
      reasoning += reasonTok;

      if (currentModel) {
        models.add(currentModel);
        const r = ratesFor(currentModel);
        if (r) {
          // Reasoning is part of the output charge, not billed separately.
          costUsd +=
            (nonCachedIn * r.input +
              cached * r.cacheRead +
              outTok * r.output) /
            1_000_000;
        } else {
          hasUnpricedModel = true;
        }
      } else {
        hasUnpricedModel = true;
      }

      if (ts) {
        activeDates.add(ts);
        if (!firstDate || ts < firstDate) firstDate = ts;
        if (!lastDate || ts > lastDate) lastDate = ts;
      }
    }
  }

  const totalTokens = tokensIn + tokensOut;
  if (totalTokens === 0 || !firstDate || !lastDate) return null;

  return {
    source: {
      tokensIn,
      tokensOut,
      cacheReadTokens: cacheRead,
      reasoningTokens: reasoning,
      totalTokens,
      estimatedCostUsd: Math.round(costUsd * 100) / 100,
      costConfidence: hasUnpricedModel ? "partial" : "estimated",
      sessionCount: sessions.size,
      activeDays: activeDates.size,
      longestStreakDays: longestStreak(activeDates),
      firstActivityDate: firstDate,
      lastActivityDate: lastDate,
      models: [...models].sort().slice(0, 50),
    },
    activeDates,
    filesParsed,
  };
}
