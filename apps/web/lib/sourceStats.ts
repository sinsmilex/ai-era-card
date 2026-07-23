import type { SnapshotPayload } from "@aieracard/schema";

// Normalized per-source view for the card's interactive source filter.
// Pure + unit-tested: each source schema differs (Cursor has no streak,
// OpenRouter tokens are a 30-day window, Codex has reasoning tokens), so
// the card renders through this common shape instead of per-source JSX.

export type SourceKey = "claudeCode" | "codex" | "cursor" | "openrouter";

export interface SourceView {
  key: SourceKey;
  label: string;
  tokens: number | null;
  costUsd: number | null;
  activeDays: number;
  streak: number | null; // null where the source can't know (Cursor, OpenRouter)
  requests: number | null;
  models: string[];
  firstDate: string | null;
  lastDate: string | null;
  note: string | null; // honest caveats (e.g. OpenRouter 30d window)
}

export const SOURCE_LABELS: Record<SourceKey, string> = {
  claudeCode: "Claude Code",
  codex: "Codex",
  cursor: "Cursor",
  openrouter: "OpenRouter",
};

export function sourceView(
  payload: SnapshotPayload,
  key: SourceKey
): SourceView | null {
  const s = payload.sources[key];
  if (!s) return null;
  switch (key) {
    case "claudeCode": {
      const src = payload.sources.claudeCode!;
      return {
        key,
        label: SOURCE_LABELS[key],
        tokens: src.totalTokens,
        costUsd: src.estimatedCostUsd,
        activeDays: src.activeDays,
        streak: src.longestStreakDays,
        requests: null,
        models: src.models,
        firstDate: src.firstActivityDate,
        lastDate: src.lastActivityDate,
        note:
          src.costConfidence === "partial"
            ? "Cost estimate is partial (some models unpriced)."
            : null,
      };
    }
    case "codex": {
      const src = payload.sources.codex!;
      return {
        key,
        label: SOURCE_LABELS[key],
        tokens: src.totalTokens,
        costUsd: src.estimatedCostUsd,
        activeDays: src.activeDays,
        streak: src.longestStreakDays,
        requests: null,
        models: src.models,
        firstDate: src.firstActivityDate,
        lastDate: src.lastActivityDate,
        note:
          src.costConfidence === "partial"
            ? "Cost estimate is partial (some models unpriced)."
            : null,
      };
    }
    case "cursor": {
      const src = payload.sources.cursor!;
      return {
        key,
        label: SOURCE_LABELS[key],
        tokens: src.totalTokens,
        costUsd: src.totalCostUsd,
        activeDays: src.activeDays,
        streak: null,
        requests: src.requestCount,
        models: src.models,
        firstDate: src.dateRange.from,
        lastDate: src.dateRange.to,
        note: null,
      };
    }
    case "openrouter": {
      const src = payload.sources.openrouter!;
      return {
        key,
        label: SOURCE_LABELS[key],
        tokens: src.totalTokens,
        costUsd: src.totalCostUsd,
        activeDays: src.activeDays,
        streak: null,
        requests: src.requestCount,
        models: src.models,
        firstDate: null,
        lastDate: null,
        note: "Tokens/activity are the last 30 days; spend is all-time.",
      };
    }
  }
}

// Server-safe (used by generateMetadata); lives here, not in the client
// StatsCard module, so server code can import it.
export function sourceLabels(payload: SnapshotPayload): string[] {
  return presentSources(payload).map((v) => v.label);
}

export function presentSources(payload: SnapshotPayload): SourceView[] {
  return (["claudeCode", "codex", "cursor", "openrouter"] as SourceKey[])
    .map((k) => sourceView(payload, k))
    .filter((v): v is SourceView => v !== null);
}

// Token share per source for the in-card breakdown bar. Sources with
// unknown tokens (Cursor may be null) contribute 0 to the bar but are
// still listed. Share denominators use the sum of known source tokens —
// not aggregate.totalTokens — so the bar always sums to 100%.
export function tokenShares(
  payload: SnapshotPayload
): Array<{ key: SourceKey; label: string; tokens: number; share: number }> {
  const views = presentSources(payload);
  const known = views.map((v) => ({
    key: v.key,
    label: v.label,
    tokens: v.tokens ?? 0,
  }));
  const total = known.reduce((a, b) => a + b.tokens, 0);
  return known.map((k) => ({
    ...k,
    share: total > 0 ? k.tokens / total : 0,
  }));
}
