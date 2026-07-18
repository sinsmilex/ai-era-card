import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { eraMilestones, eraPalette, eraRank } from "./eraRank";

function payload(tokens: number, extras: Partial<SnapshotPayload["aggregate"]> = {}): SnapshotPayload {
  return {
    schemaVersion: 1,
    generatedAt: "2026-07-18",
    cliVersion: "0.1.2",
    sources: {
      claudeCode: {
        tokensIn: 1,
        tokensOut: 1,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: tokens,
        estimatedCostUsd: 1,
        costConfidence: "estimated",
        sessionCount: 1,
        projectCount: 1,
        activeDays: 1,
        longestStreakDays: 1,
        firstActivityDate: "2026-01-01",
        lastActivityDate: "2026-07-18",
        models: ["claude-sonnet-5"],
      },
    },
    aggregate: {
      totalTokens: tokens,
      totalCostUsd: 100,
      totalActiveDays: 50,
      longestStreakDays: 5,
      distinctModels: ["claude-sonnet-5"],
      sourceCount: 1,
      firstActivityDate: "2026-01-01",
      lastActivityDate: "2026-07-18",
      ...extras,
    },
    display: { handle: "SinSmile" },
  };
}

describe("eraRank", () => {
  it("assigns Epoch at 1B+ tokens", () => {
    const r = eraRank(payload(1_500_000_000));
    expect(r.level).toBe(5);
    expect(r.name).toBe("Epoch");
    expect(r.title).toBe("L5 · EPOCH");
    expect(r.nextLabel).toBeNull();
  });

  it("assigns Foundry in the 100M band", () => {
    const r = eraRank(payload(120_000_000));
    expect(r.level).toBe(3);
    expect(r.name).toBe("Foundry");
    expect(r.nextLabel).toContain("Citadel");
  });

  it("lists 1B club milestone", () => {
    const m = eraMilestones(payload(1_200_000_000, { totalActiveDays: 220 }));
    expect(m.some((x) => x.id === "1b")).toBe(true);
    expect(m.some((x) => x.id === "100d")).toBe(true);
  });

  it("picks a deterministic palette", () => {
    const a = eraPalette(payload(1_500_000_000));
    const b = eraPalette(payload(1_500_000_000));
    expect(a.id).toBe(b.id);
  });
});
