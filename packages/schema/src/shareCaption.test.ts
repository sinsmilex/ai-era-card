import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "./index.js";
import { buildShareCaption } from "./shareCaption.js";

function payload(handle: string | null): SnapshotPayload {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-18",
    cliVersion: "0.1.11",
    sources: {
      claudeCode: {
        tokensIn: 1,
        tokensOut: 1,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: 400_000_000,
        estimatedCostUsd: null,
        costConfidence: "estimated",
        sessionCount: 1,
        projectCount: 1,
        activeDays: 1,
        longestStreakDays: 1,
        firstActivityDate: "2026-07-01",
        lastActivityDate: "2026-07-01",
        models: ["claude-sonnet-5"],
      },
      cursor: {
        totalTokens: 1_500_000_000,
        totalCostUsd: null,
        requestCount: 1,
        activeDays: 1,
        dateRange: { from: "2026-07-01", to: "2026-07-01" },
        models: ["gpt-5"],
      },
    },
    aggregate: {
      totalTokens: 1_900_000_000,
      totalCostUsd: null,
      totalActiveDays: 1,
      longestStreakDays: 1,
      distinctModels: ["claude-sonnet-5", "gpt-5"],
      sourceCount: 2,
      firstActivityDate: "2026-07-01",
      lastActivityDate: "2026-07-01",
    },
    display: { handle },
  };
}

describe("buildShareCaption", () => {
  it("builds a compact two-line caption with tier, tokens, sources, and URL", () => {
    expect(
      buildShareCaption(payload("sinsmile"), "https://example.com/s/card", (n) => `${n / 1e9}B`)
    ).toBe(
      "sinsmile's AI coding card: TIER4 · TOWER · 1.9B tokens · Cursor + Claude Code\nhttps://example.com/s/card"
    );
  });

  it("uses a neutral default when no handle is supplied", () => {
    expect(buildShareCaption(payload(null), "https://example.com/s/card", String)).toContain(
      "My AI coding card:"
    );
  });
});
