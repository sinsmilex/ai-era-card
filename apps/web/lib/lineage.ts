import type { SnapshotPayload } from "@aieracard/schema";
import { eraRank } from "./eraRank";

// Card lineage: a card may self-link its author's previous card via
// display.previousSlug. The link is self-reported (no accounts), so we
// render it only when the slug resolves, never as verified continuity,
// and we only claim a numeric delta when both snapshots cover the exact
// same source set — mixed windows would make the number a lie.

export interface LineageInfo {
  slug: string;
  title: string; // previous card's tier title, e.g. "TIER2 · STUDIO"
  tokens: number;
  date: string; // previous card's generatedAt
  /** Token delta current-vs-previous; null when source sets differ. */
  deltaTokens: number | null;
}

function sourceKeySet(p: SnapshotPayload): string[] {
  return Object.keys(p.sources).sort();
}

export function lineageInfo(
  current: SnapshotPayload,
  previous: SnapshotPayload,
  previousSlug: string
): LineageInfo {
  const a = sourceKeySet(current);
  const b = sourceKeySet(previous);
  const comparable = a.length === b.length && a.every((k, i) => k === b[i]);
  return {
    slug: previousSlug,
    title: eraRank(previous).title,
    tokens: previous.aggregate.totalTokens,
    date: previous.generatedAt,
    deltaTokens: comparable
      ? current.aggregate.totalTokens - previous.aggregate.totalTokens
      : null,
  };
}
