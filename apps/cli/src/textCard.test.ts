import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { renderTerminalMosaic, renderTextCard } from "./textCard.js";

const payload: SnapshotPayload = {
  schemaVersion: 1,
  generatedAt: "2026-07-23",
  cliVersion: "0.1.7",
  sources: {
    claudeCode: {
      tokensIn: 900_000_000,
      tokensOut: 300_000_000,
      cacheReadTokens: 500_000_000,
      cacheCreationTokens: 100_000_000,
      totalTokens: 1_800_000_000,
      estimatedCostUsd: 420,
      costConfidence: "estimated",
      sessionCount: 12,
      projectCount: 2,
      activeDays: 38,
      longestStreakDays: 9,
      firstActivityDate: "2026-06-01",
      lastActivityDate: "2026-07-23",
      models: ["claude-sonnet-4"],
    },
  },
  aggregate: {
    totalTokens: 1_800_000_000,
    totalCostUsd: 420,
    totalActiveDays: 38,
    longestStreakDays: 9,
    distinctModels: ["claude-sonnet-4", "gpt-5"],
    sourceCount: 1,
    firstActivityDate: "2026-06-01",
    lastActivityDate: "2026-07-23",
  },
  display: { handle: "SinSmile" },
};

describe("renderTextCard", () => {
  it("renders a deterministic 10-by-7 ASCII building in the top-right", () => {
    const mosaic = renderTerminalMosaic(payload);

    expect(mosaic).toHaveLength(7);
    expect(mosaic.every((row) => row.length === 10)).toBe(true);
    expect(mosaic.some((row) => /[.+#@]/.test(row))).toBe(true);
    expect(renderTerminalMosaic(payload)).toEqual(mosaic);
  });

  it("keeps every boxed line at a stable terminal width", () => {
    const card = renderTextCard(payload);
    const lines = card.split("\n");

    expect(lines).toHaveLength(10);
    expect(lines.every((line) => line.length === 66)).toBe(true);
    expect(card).toContain("AI ERA CARD · SinSmile");
    expect(card).toContain("@");
  });
});
