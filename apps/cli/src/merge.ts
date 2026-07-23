import type { SnapshotPayload } from "@aieracard/schema";
import { SCHEMA_VERSION } from "@aieracard/schema";
import { longestStreak, maxDate, minDate, todayDateOnly } from "./dates.js";
import type { ClaudeCodeResult } from "./collectors/claudeCode.js";
import type { OpenRouterResult } from "./collectors/openrouter.js";
import type { CursorResult } from "./collectors/cursorCsv.js";
import type { CodexResult } from "./collectors/codex.js";

export const CLI_VERSION = "0.1.9";

export function buildPayload(opts: {
  claudeCode: ClaudeCodeResult | null;
  openrouter: OpenRouterResult | null;
  cursor: CursorResult | null;
  codex: CodexResult | null;
  handle: string | null;
}): SnapshotPayload {
  const { claudeCode, openrouter, cursor, codex, handle } = opts;

  const allDates = new Set<string>();
  for (const r of [claudeCode, openrouter, cursor, codex]) {
    if (r) for (const d of r.activeDates) allDates.add(d);
  }

  const totalTokens =
    (claudeCode?.source.totalTokens ?? 0) +
    (openrouter?.source.totalTokens ?? 0) +
    (cursor?.source.totalTokens ?? 0) +
    (codex?.source.totalTokens ?? 0);

  // null (unknown) stays null — never coerced to $0.
  // OpenRouter spend is all-time (/credits) while its tokens are last-30-day
  // (/activity); mixing that cost into aggregate "compute spent" would lie.
  // It remains on sources.openrouter.totalCostUsd for the JSON preview.
  const costs = [
    claudeCode?.source.estimatedCostUsd,
    cursor?.source.totalCostUsd,
    codex?.source.estimatedCostUsd,
  ].filter((c): c is number => typeof c === "number");
  const totalCostUsd =
    costs.length > 0
      ? Math.round(costs.reduce((a, b) => a + b, 0) * 100) / 100
      : null;

  const distinctModels = new Set<string>([
    ...(claudeCode?.source.models ?? []),
    ...(openrouter?.source.models ?? []),
    ...(cursor?.source.models ?? []),
    ...(codex?.source.models ?? []),
  ]);

  let first: string | null = null;
  let last: string | null = null;
  if (claudeCode) {
    first = minDate(first, claudeCode.source.firstActivityDate);
    last = maxDate(last, claudeCode.source.lastActivityDate);
  }
  if (codex) {
    first = minDate(first, codex.source.firstActivityDate);
    last = maxDate(last, codex.source.lastActivityDate);
  }
  if (cursor) {
    first = minDate(first, cursor.source.dateRange.from);
    last = maxDate(last, cursor.source.dateRange.to);
  }
  for (const d of openrouter?.activeDates ?? []) {
    first = minDate(first, d);
    last = maxDate(last, d);
  }
  const today = todayDateOnly();

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: today,
    cliVersion: CLI_VERSION,
    sources: {
      ...(claudeCode ? { claudeCode: claudeCode.source } : {}),
      ...(openrouter ? { openrouter: openrouter.source } : {}),
      ...(cursor ? { cursor: cursor.source } : {}),
      ...(codex ? { codex: codex.source } : {}),
    },
    aggregate: {
      totalTokens,
      totalCostUsd,
      totalActiveDays: allDates.size,
      longestStreakDays: longestStreak(allDates),
      distinctModels: [...distinctModels].sort().slice(0, 50),
      sourceCount: [claudeCode, openrouter, cursor, codex].filter(Boolean)
        .length,
      firstActivityDate: first ?? today,
      lastActivityDate: last ?? today,
    },
    display: { handle },
  };
}
