import { describe, expect, it } from "vitest";
import type { SnapshotPayload } from "@aieracard/schema";
import { eraMilestones, eraPalette, eraRank, linkedInShareLine } from "./eraRank";
import { buildingBounds, buildBuilding } from "./mosaic";

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
    expect(r.title).toBe("TIER4 · TOWER");
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
    const tower = buildBuilding(payload(1_500_000_000));
    const apex = buildBuilding(payload(100_000_000_000));
    expect(buildBuilding(payload(1_000_000))).toEqual(foundation);
    const foundationBounds = buildingBounds(foundation);
    const towerBounds = buildingBounds(tower);
    expect(towerBounds.maxY - towerBounds.minY).toBeGreaterThan(
      foundationBounds.maxY - foundationBounds.minY
    );
    expect(tower.filter((block) => block.role === "spire").length).toBeGreaterThan(0);
    expect(apex.length).toBeGreaterThan(foundation.length);
  });

  it("builds a calm LinkedIn summary with known compute", () => {
    const line = linkedInShareLine(payload(1_500_000_000), "https://example.com/s/test");
    expect(line).toContain("TIER4 · TOWER");
    expect(line).toContain("1.5B tokens");
    expect(line).toContain("50 active days");
    expect(line).toContain("$100 compute");
    expect(line).toContain("Self-reported aggregate data, not a game score.");
    expect(line).toContain("https://example.com/s/test");
  });

  it("orders badges rarest-first and no longer caps at four", () => {
    const p = payload(1_200_000_000, {
      totalActiveDays: 220,
      longestStreakDays: 100,
      firstActivityDate: "2023-05-01",
      totalCostUsd: 6000,
    });
    const m = eraMilestones(p);
    expect(m.length).toBeGreaterThan(4);
    expect(m[0].id).toBe("1b"); // token tier leads
    expect(m.map((x) => x.id)).toContain("streak100");
    expect(m.map((x) => x.id)).toContain("spend5k");
  });

  it("has no tenure badge — the card's own 'since' line covers it", () => {
    const m = eraMilestones(
      payload(50_000_000, { firstActivityDate: "2023-05-01" })
    );
    expect(m.some((x) => x.id.startsWith("era"))).toBe(false);
  });

  it("awards daily density only with a 10-day baseline", () => {
    const dense = eraMilestones(payload(1_000_000_000, { totalActiveDays: 40 }));
    expect(dense.some((x) => x.id === "daily20m")).toBe(true);
    const oneWeek = eraMilestones(payload(1_000_000_000, { totalActiveDays: 5 }));
    expect(oneWeek.some((x) => x.id.startsWith("daily"))).toBe(false);
  });

  it("awards consistency for 80%+ active days over 60+ day spans", () => {
    // 2026-01-01 → 2026-07-18 is a 199-day span; 160 active days ≈ 80.4%.
    const m = eraMilestones(payload(50_000_000, { totalActiveDays: 160 }));
    expect(m.some((x) => x.id === "consistent80")).toBe(true);
    const sparse = eraMilestones(payload(50_000_000, { totalActiveDays: 50 }));
    expect(sparse.some((x) => x.id === "consistent80")).toBe(false);
  });

  it("awards cache efficiency from local-log sources", () => {
    const p = payload(200_000_000);
    p.sources.claudeCode!.totalTokens = 200_000_000;
    p.sources.claudeCode!.cacheReadTokens = 190_000_000;
    expect(eraMilestones(p).some((x) => x.id === "cache90")).toBe(true);
  });

  it("awards session volume across claudeCode and codex", () => {
    const p = payload(50_000_000);
    p.sources.claudeCode!.sessionCount = 1_500;
    expect(eraMilestones(p).some((x) => x.id === "sessions1k")).toBe(true);
  });

  it("awards cross-provider for mixed model families", () => {
    const m = eraMilestones(
      payload(50_000_000, { distinctModels: ["claude-sonnet-5", "gpt-4.1"] })
    );
    expect(m.some((x) => x.id === "xprovider")).toBe(true);
    const single = eraMilestones(
      payload(50_000_000, { distinctModels: ["claude-sonnet-5"] })
    );
    expect(single.some((x) => x.id === "xprovider")).toBe(false);
  });

  it("keeps a 10M entry tier and only the highest token tier", () => {
    const m = eraMilestones(payload(15_000_000));
    expect(m.some((x) => x.id === "10m")).toBe(true);
    const big = eraMilestones(payload(1_200_000_000));
    expect(big.filter((x) => ["10m", "100m", "1b"].includes(x.id))).toHaveLength(1);
  });

  it("does not invent compute in a LinkedIn summary", () => {
    const line = linkedInShareLine(
      payload(1_500_000_000, { totalCostUsd: null }),
      "https://example.com/s/test"
    );
    expect(line).not.toContain("compute");
  });
});
