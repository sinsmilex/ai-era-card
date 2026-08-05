import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { SnapshotPayload } from "@aieracard/schema";

// Local-only baseline so a re-run can say "+240M since your last card"
// without accounts, email, or any server-side identity. The file contains
// aggregate numbers, the date, the schema version, and the enabled-source
// set. Never paths, prompts, raw logs, card URLs, or slugs. Delete it (or pass
// --no-baseline) to opt out at any time.

export interface BaselineState {
  stateVersion: 1;
  schemaVersion: number;
  savedAt: string; // the previous card's generatedAt (YYYY-MM-DD)
  sources: string[]; // sorted source keys enabled on the previous card
  aggregate: SnapshotPayload["aggregate"];
}

export type BaselineDelta =
  | {
      comparable: true;
      sinceDate: string;
      tokensDelta: number;
      activeDaysDelta: number;
      /** Rank name newly reached since the baseline, if any. */
      crossedRank: string | null;
    }
  | {
      comparable: false;
      reason: "sources-changed" | "schema-changed";
      sinceDate: string;
      previousSources: string[];
      currentSources: string[];
    };

export function baselineDir(): string {
  return process.env.AIERACARD_HOME || join(homedir(), ".aieracard");
}

export function baselinePath(): string {
  return join(baselineDir(), "state.json");
}

export function sourceKeys(payload: SnapshotPayload): string[] {
  return Object.keys(payload.sources).sort();
}

export async function readBaseline(): Promise<BaselineState | null> {
  try {
    const raw = await readFile(baselinePath(), "utf8");
    const data = JSON.parse(raw) as Partial<BaselineState>;
    if (
      data?.stateVersion !== 1 ||
      typeof data.schemaVersion !== "number" ||
      typeof data.savedAt !== "string" ||
      !Array.isArray(data.sources) ||
      typeof data.aggregate?.totalTokens !== "number"
    ) {
      return null; // corrupt or from an incompatible future version
    }
    return data as BaselineState;
  } catch {
    return null;
  }
}

export async function writeBaseline(state: BaselineState): Promise<void> {
  await mkdir(baselineDir(), { recursive: true });
  await writeFile(baselinePath(), JSON.stringify(state, null, 2), "utf8");
}

export function baselineFromPayload(payload: SnapshotPayload): BaselineState {
  return {
    stateVersion: 1,
    schemaVersion: payload.schemaVersion,
    savedAt: payload.generatedAt,
    sources: sourceKeys(payload),
    aggregate: payload.aggregate,
  };
}

// A delta is only honest when both measurements cover the same thing:
// same schema semantics and the exact same source set. Otherwise we say
// so instead of showing a misleading combined number.
export function compareBaseline(
  baseline: BaselineState,
  payload: SnapshotPayload,
  rankNameFor: (tokens: number) => string
): BaselineDelta {
  const previousSources = [...baseline.sources].sort();
  const currentSources = sourceKeys(payload);
  if (baseline.schemaVersion !== payload.schemaVersion) {
    return {
      comparable: false,
      reason: "schema-changed",
      sinceDate: baseline.savedAt,
      previousSources,
      currentSources,
    };
  }
  if (
    previousSources.length !== currentSources.length ||
    previousSources.some((s, i) => s !== currentSources[i])
  ) {
    return {
      comparable: false,
      reason: "sources-changed",
      sinceDate: baseline.savedAt,
      previousSources,
      currentSources,
    };
  }
  const before = baseline.aggregate;
  const after = payload.aggregate;
  const rankBefore = rankNameFor(before.totalTokens);
  const rankAfter = rankNameFor(after.totalTokens);
  return {
    comparable: true,
    sinceDate: baseline.savedAt,
    tokensDelta: after.totalTokens - before.totalTokens,
    activeDaysDelta: after.totalActiveDays - before.totalActiveDays,
    crossedRank: rankAfter !== rankBefore ? rankAfter : null,
  };
}
