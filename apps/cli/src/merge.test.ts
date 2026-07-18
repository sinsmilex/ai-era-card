import { describe, expect, it } from "vitest";
import { snapshotPayloadSchema } from "@aieracard/schema";
import type { ClaudeCodeResult } from "./collectors/claudeCode.js";
import type { CursorResult } from "./collectors/cursorCsv.js";
import type { OpenRouterResult } from "./collectors/openrouter.js";
import { buildPayload } from "./merge.js";

function claude(opts: {
  totalTokens: number;
  estimatedCostUsd: number | null;
  models?: string[];
  dates?: string[];
}): ClaudeCodeResult {
  const dates = opts.dates ?? ["2026-07-01", "2026-07-02"];
  return {
    filesParsed: 1,
    activeDates: new Set(dates),
    source: {
      tokensIn: opts.totalTokens,
      tokensOut: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      totalTokens: opts.totalTokens,
      estimatedCostUsd: opts.estimatedCostUsd,
      costConfidence: opts.estimatedCostUsd == null ? "partial" : "estimated",
      sessionCount: 1,
      projectCount: 1,
      activeDays: dates.length,
      longestStreakDays: dates.length,
      firstActivityDate: dates[0],
      lastActivityDate: dates[dates.length - 1],
      models: opts.models ?? ["claude-sonnet-4"],
    },
  };
}

function cursor(opts: {
  totalTokens: number | null;
  totalCostUsd: number | null;
  models?: string[];
  dates?: string[];
}): CursorResult {
  const dates = opts.dates ?? ["2026-07-02", "2026-07-03"];
  return {
    warnings: [],
    activeDates: new Set(dates),
    source: {
      totalTokens: opts.totalTokens,
      totalCostUsd: opts.totalCostUsd,
      requestCount: 10,
      activeDays: dates.length,
      dateRange: { from: dates[0], to: dates[dates.length - 1] },
      models: opts.models ?? ["gpt-5"],
    },
  };
}

function openrouter(opts: {
  totalTokens: number;
  totalCostUsd: number | null;
  models?: string[];
  dates?: string[];
}): OpenRouterResult {
  const dates = opts.dates ?? ["2026-07-03"];
  return {
    warnings: [],
    activeDates: new Set(dates),
    source: {
      totalTokens: opts.totalTokens,
      totalCostUsd: opts.totalCostUsd,
      requestCount: 5,
      activeDays: dates.length,
      windowDays: 30,
      models: opts.models ?? ["deepseek/deepseek-chat"],
    },
  };
}

describe("buildPayload", () => {
  it("keeps aggregate cost null when every source cost is unknown", () => {
    const payload = buildPayload({
      claudeCode: claude({ totalTokens: 1000, estimatedCostUsd: null }),
      openrouter: null,
      cursor: cursor({ totalTokens: 500, totalCostUsd: null }),
      handle: null,
    });

    expect(payload.aggregate.totalCostUsd).toBeNull();
    expect(payload.aggregate.totalTokens).toBe(1500);
    expect(snapshotPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("sums Claude/Cursor costs, ignores nulls, excludes OpenRouter all-time spend", () => {
    const payload = buildPayload({
      claudeCode: claude({ totalTokens: 1000, estimatedCostUsd: null }),
      openrouter: openrouter({ totalTokens: 200, totalCostUsd: 3.5 }),
      cursor: cursor({ totalTokens: 100, totalCostUsd: 1.25 }),
      handle: "sinsmile",
    });

    // OpenRouter $3.5 is all-time — kept on the source, not in aggregate.
    expect(payload.aggregate.totalCostUsd).toBe(1.25);
    expect(payload.sources.openrouter?.totalCostUsd).toBe(3.5);
    expect(payload.aggregate.totalTokens).toBe(1300);
    expect(payload.aggregate.sourceCount).toBe(3);
    expect(payload.display.handle).toBe("sinsmile");
    expect(snapshotPayloadSchema.safeParse(payload).success).toBe(true);
  });

  it("merges distinct models and active days across sources", () => {
    const payload = buildPayload({
      claudeCode: claude({
        totalTokens: 10,
        estimatedCostUsd: 0.1,
        models: ["claude-sonnet-4"],
        dates: ["2026-07-01", "2026-07-02"],
      }),
      openrouter: openrouter({
        totalTokens: 20,
        totalCostUsd: 0.2,
        models: ["claude-sonnet-4", "deepseek/deepseek-chat"],
        dates: ["2026-07-02"],
      }),
      cursor: null,
      handle: null,
    });

    expect(payload.aggregate.distinctModels).toEqual([
      "claude-sonnet-4",
      "deepseek/deepseek-chat",
    ]);
    expect(payload.aggregate.totalActiveDays).toBe(2);
    expect(payload.aggregate.longestStreakDays).toBe(2);
    expect(snapshotPayloadSchema.safeParse(payload).success).toBe(true);
  });
});
