import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { presentSources, sourceView, tokenShares } from "./sourceStats";

const base: SnapshotPayload = {
  schemaVersion: 1,
  generatedAt: "2026-07-24",
  cliVersion: "0.1.4",
  sources: {
    claudeCode: {
      tokensIn: 1000,
      tokensOut: 2000,
      cacheReadTokens: 5000,
      cacheCreationTokens: 1000,
      totalTokens: 9000,
      estimatedCostUsd: 12.5,
      costConfidence: "estimated",
      sessionCount: 4,
      projectCount: 2,
      activeDays: 7,
      longestStreakDays: 3,
      firstActivityDate: "2026-07-01",
      lastActivityDate: "2026-07-20",
      models: ["claude-opus-4-8"],
    },
    cursor: {
      totalTokens: 1000,
      totalCostUsd: 3.5,
      requestCount: 42,
      activeDays: 5,
      dateRange: { from: "2026-06-01", to: "2026-07-15" },
      models: ["gpt-5", "claude-4-sonnet"],
    },
  },
  aggregate: {
    totalTokens: 10000,
    totalCostUsd: 16,
    totalActiveDays: 9,
    longestStreakDays: 3,
    distinctModels: ["claude-opus-4-8", "gpt-5", "claude-4-sonnet"],
    sourceCount: 2,
    firstActivityDate: "2026-06-01",
    lastActivityDate: "2026-07-20",
  },
  display: { handle: null },
};

describe("sourceView", () => {
  it("maps Claude Code fields including streak and dates", () => {
    const v = sourceView(base, "claudeCode")!;
    expect(v).toMatchObject({
      label: "Claude Code",
      tokens: 9000,
      costUsd: 12.5,
      streak: 3,
      requests: null,
      firstDate: "2026-07-01",
    });
  });

  it("maps Cursor with null streak and requestCount", () => {
    const v = sourceView(base, "cursor")!;
    expect(v).toMatchObject({
      tokens: 1000,
      costUsd: 3.5,
      streak: null,
      requests: 42,
      firstDate: "2026-06-01",
      lastDate: "2026-07-15",
    });
  });

  it("returns null for absent sources", () => {
    expect(sourceView(base, "codex")).toBeNull();
    expect(sourceView(base, "openrouter")).toBeNull();
  });

  it("flags partial cost confidence", () => {
    const p = structuredClone(base);
    p.sources.claudeCode!.costConfidence = "partial";
    expect(sourceView(p, "claudeCode")!.note).toMatch(/partial/);
  });
});

describe("presentSources / tokenShares", () => {
  it("lists only present sources, in stable order", () => {
    expect(presentSources(base).map((v) => v.key)).toEqual([
      "claudeCode",
      "cursor",
    ]);
  });

  it("computes shares over known tokens summing to 1", () => {
    const shares = tokenShares(base);
    expect(shares.map((s) => s.share)).toEqual([0.9, 0.1]);
  });

  it("treats null Cursor tokens as 0 share without crashing", () => {
    const p = structuredClone(base);
    p.sources.cursor!.totalTokens = null;
    const shares = tokenShares(p);
    expect(shares.find((s) => s.key === "cursor")!.share).toBe(0);
    expect(shares.find((s) => s.key === "claudeCode")!.share).toBe(1);
  });
});
