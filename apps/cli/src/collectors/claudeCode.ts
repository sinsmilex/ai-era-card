import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ClaudeCodeSource } from "@aieracard/schema";
import { ratesFor } from "../pricing/modelPricing.js";
import { longestStreak, toDateOnly } from "../dates.js";

export interface ClaudeCodeResult {
  source: ClaudeCodeSource;
  activeDates: Set<string>;
  filesParsed: number;
}

export function claudeCodeProjectsDir(): string {
  return join(homedir(), ".claude", "projects");
}

export async function collectClaudeCode(
  projectsDir = claudeCodeProjectsDir()
): Promise<ClaudeCodeResult | null> {
  let projectDirs: string[];
  try {
    const entries = await readdir(projectsDir, { withFileTypes: true });
    projectDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return null;
  }
  if (projectDirs.length === 0) return null;

  let tokensIn = 0;
  let tokensOut = 0;
  let cacheRead = 0;
  let cacheCreation = 0;
  let costUsd = 0;
  let hasUnpricedModel = false;
  const sessions = new Set<string>();
  const activeDates = new Set<string>();
  const models = new Set<string>();
  const seenMessages = new Set<string>();
  const touchedProjects = new Set<string>();
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  let filesParsed = 0;

  for (const dir of projectDirs) {
    const dirPath = join(projectsDir, dir);
    let files: string[];
    try {
      files = (await readdir(dirPath)).filter((f) => f.endsWith(".jsonl"));
    } catch {
      continue;
    }

    for (const file of files) {
      filesParsed++;
      const rl = createInterface({
        input: createReadStream(join(dirPath, file)),
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.includes('"usage"')) continue;
        let entry: any;
        try {
          entry = JSON.parse(line);
        } catch {
          continue; // JSONL can be appended concurrently; skip torn lines
        }
        const usage = entry?.message?.usage;
        if (!usage || typeof usage !== "object") continue;

        // Streaming rewrites the same message across lines — dedupe.
        const msgId = entry.message.id ?? "";
        const reqId = entry.requestId ?? "";
        if (msgId || reqId) {
          const key = `${msgId}:${reqId}`;
          if (seenMessages.has(key)) continue;
          seenMessages.add(key);
        }

        const inTok = usage.input_tokens ?? 0;
        const outTok = usage.output_tokens ?? 0;
        const cr = usage.cache_read_input_tokens ?? 0;
        const cc = usage.cache_creation_input_tokens ?? 0;
        tokensIn += inTok;
        tokensOut += outTok;
        cacheRead += cr;
        cacheCreation += cc;

        const model: string | undefined = entry.message.model;
        if (model && model !== "<synthetic>") {
          models.add(model);
          const r = ratesFor(model);
          if (r) {
            costUsd +=
              (inTok * r.input +
                outTok * r.output +
                cr * r.cacheRead +
                cc * r.cacheWrite) /
              1_000_000;
          } else {
            hasUnpricedModel = true;
          }
        }

        if (entry.sessionId) sessions.add(entry.sessionId);
        touchedProjects.add(dir);
        if (typeof entry.timestamp === "string") {
          const d = toDateOnly(entry.timestamp);
          if (d) {
            activeDates.add(d);
            if (!firstDate || d < firstDate) firstDate = d;
            if (!lastDate || d > lastDate) lastDate = d;
          }
        }
      }
    }
  }

  const totalTokens = tokensIn + tokensOut + cacheRead + cacheCreation;
  if (totalTokens === 0 || !firstDate || !lastDate) return null;

  return {
    source: {
      tokensIn,
      tokensOut,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheCreation,
      totalTokens,
      estimatedCostUsd: Math.round(costUsd * 100) / 100,
      costConfidence: hasUnpricedModel ? "partial" : "estimated",
      sessionCount: sessions.size,
      projectCount: touchedProjects.size,
      activeDays: activeDates.size,
      longestStreakDays: longestStreak(activeDates),
      firstActivityDate: firstDate,
      lastActivityDate: lastDate,
      models: [...models].sort(),
    },
    activeDates,
    filesParsed,
  };
}
