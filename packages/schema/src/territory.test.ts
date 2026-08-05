import { describe, expect, it } from "vitest";
import { composeTerritory, type SnapshotPayload } from "./index.js";

function payload(tokens = 1_500_000_000): SnapshotPayload {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-05",
    cliVersion: "0.1.13",
    sources: {
      claudeCode: {
        tokensIn: 1,
        tokensOut: 1,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: tokens,
        estimatedCostUsd: null,
        costConfidence: "estimated",
        sessionCount: 1,
        projectCount: 1,
        activeDays: 1,
        longestStreakDays: 1,
        firstActivityDate: "2026-01-01",
        lastActivityDate: "2026-08-05",
        models: ["claude-sonnet-5"],
      },
    },
    aggregate: {
      totalTokens: tokens,
      totalCostUsd: null,
      totalActiveDays: 50,
      longestStreakDays: 5,
      distinctModels: ["claude-sonnet-5"],
      sourceCount: 1,
      firstActivityDate: "2026-01-01",
      lastActivityDate: "2026-08-05",
    },
    display: { handle: null },
  };
}

function height(tiles: ReturnType<typeof composeTerritory>["tiles"]) {
  return Math.max(...tiles.map((tile) => tile.y)) - Math.min(...tiles.map((tile) => tile.y)) + 1;
}

describe("composeTerritory", () => {
  it("is deterministic for the same aggregate payload and rank", () => {
    expect(composeTerritory(payload(), 4)).toEqual(composeTerritory(payload(), 4));
  });

  it("builds a coherent Tower that is taller than a Foundation", () => {
    const foundation = composeTerritory(payload(1_000_000), 1);
    const tower = composeTerritory(payload(), 4);
    expect(height(tower.tiles)).toBeGreaterThan(height(foundation.tiles));
    expect(tower.tiles.filter((tile) => tile.role === "spire").length).toBeGreaterThan(0);
    expect(tower.tiles.filter((tile) => tile.role === "foundation").length).toBe(8);
  });

  it("adds structured voids only to the higher-density territories", () => {
    const tower = composeTerritory(payload(), 4);
    const apex = composeTerritory(payload(100_000_000_000), 8);
    expect(tower.tiles.some((tile) => tile.role === "void")).toBe(false);
    expect(apex.tiles.some((tile) => tile.role === "void")).toBe(true);
  });
});
