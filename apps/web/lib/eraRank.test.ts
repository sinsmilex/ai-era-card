import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { eraMilestones, eraPalette, eraRank, linkedInShareLine } from "./eraRank";
import { buildBuilding } from "./mosaic";

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
  it("keeps 1.5B in the mid-ladder Tower band", () => {
    const r = eraRank(payload(1_500_000_000));
    expect(r.level).toBe(4);
    expect(r.name).toBe("Tower");
    expect(r.title).toBe("L4 · TOWER");
    expect(r.nextLabel).toContain("Citadel");
  });

  it("assigns Foundry in the 150M–750M band", () => {
    const r = eraRank(payload(200_000_000));
    expect(r.level).toBe(3);
    expect(r.name).toBe("Foundry");
    expect(r.nextLabel).toContain("Tower");
  });

  it("reserves Apex for 100B+ token usage", () => {
    const r = eraRank(payload(100_000_000_000));
    expect(r.level).toBe(8);
    expect(r.name).toBe("Apex");
    expect(r.nextLabel).toBeNull();
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

  it("grows a deterministic territory silhouette with rank", () => {
    const foundation = buildBuilding(payload(1_000_000));
    const apex = buildBuilding(payload(100_000_000_000));
    expect(buildBuilding(payload(1_000_000))).toEqual(foundation);
    expect(apex.length).toBeGreaterThan(foundation.length);
  });

  it("builds a calm LinkedIn summary with known compute", () => {
    const line = linkedInShareLine(payload(1_500_000_000), "https://example.com/s/test");
    expect(line).toContain("L4 · TOWER");
    expect(line).toContain("1.5B tokens");
    expect(line).toContain("50 active days");
    expect(line).toContain("$100 compute");
    expect(line).toContain("Self-reported aggregate data, not a game score.");
    expect(line).toContain("https://example.com/s/test");
  });

  it("does not invent compute in a LinkedIn summary", () => {
    const line = linkedInShareLine(
      payload(1_500_000_000, { totalCostUsd: null }),
      "https://example.com/s/test"
    );
    expect(line).not.toContain("compute");
  });
});
