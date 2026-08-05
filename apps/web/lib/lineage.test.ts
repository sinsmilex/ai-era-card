import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { lineageInfo } from "./lineage";

function payload(
  tokens: number,
  sources: Array<"claudeCode" | "cursor"> = ["claudeCode"]
): SnapshotPayload {
  const claudeCode = {
    tokensIn: 1,
    tokensOut: 1,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: tokens,
    estimatedCostUsd: 1,
    costConfidence: "estimated" as const,
    sessionCount: 1,
    projectCount: 1,
    activeDays: 1,
    longestStreakDays: 1,
    firstActivityDate: "2026-01-01",
    lastActivityDate: "2026-07-18",
    models: ["claude-sonnet-5"],
  };
  const cursor = {
    totalTokens: 0,
    totalCostUsd: null,
    requestCount: 1,
    activeDays: 1,
    dateRange: { from: "2026-01-01", to: "2026-07-18" },
    models: [],
  };
  return {
    schemaVersion: 1,
    generatedAt: "2026-05-01",
    cliVersion: "0.1.2",
    sources: {
      ...(sources.includes("claudeCode") ? { claudeCode } : {}),
      ...(sources.includes("cursor") ? { cursor } : {}),
    },
    aggregate: {
      totalTokens: tokens,
      totalCostUsd: 1,
      totalActiveDays: 10,
      longestStreakDays: 2,
      distinctModels: ["claude-sonnet-5"],
      sourceCount: sources.length,
      firstActivityDate: "2026-01-01",
      lastActivityDate: "2026-07-18",
    },
    display: { handle: null },
  };
}

describe("lineageInfo", () => {
  it("describes the previous card and a delta for matching source sets", () => {
    const info = lineageInfo(payload(340_000_000), payload(100_000_000), "prevSlug01");
    expect(info.slug).toBe("prevSlug01");
    expect(info.title).toBe("TIER2 · STUDIO");
    expect(info.tokens).toBe(100_000_000);
    expect(info.date).toBe("2026-05-01");
    expect(info.deltaTokens).toBe(240_000_000);
  });

  it("withholds the delta when source sets differ", () => {
    const info = lineageInfo(
      payload(340_000_000, ["claudeCode", "cursor"]),
      payload(100_000_000, ["claudeCode"]),
      "prevSlug01"
    );
    expect(info.deltaTokens).toBeNull();
    expect(info.title).toBe("TIER2 · STUDIO");
  });

  it("keeps an honest negative delta", () => {
    const info = lineageInfo(payload(50_000_000), payload(100_000_000), "prevSlug01");
    expect(info.deltaTokens).toBe(-50_000_000);
  });
});
