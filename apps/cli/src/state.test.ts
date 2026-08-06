import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SnapshotPayload } from "@aieracard/schema";
import {
  baselineFromPayload,
  baselinePath,
  compareBaseline,
  readBaseline,
  writeBaseline,
} from "./state.js";
import { rankTitleFor } from "./textCard.js";

function payload(
  tokens: number,
  overrides: Partial<SnapshotPayload["aggregate"]> = {},
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
    activeDays: 10,
    longestStreakDays: 2,
    firstActivityDate: "2026-01-01",
    lastActivityDate: "2026-08-01",
    models: ["claude-sonnet-5"],
  };
  const cursor = {
    totalTokens: 0,
    totalCostUsd: null,
    requestCount: 1,
    activeDays: 1,
    dateRange: { from: "2026-01-01", to: "2026-08-01" },
    models: [],
  };
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-05",
    cliVersion: "0.0.0",
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
      lastActivityDate: "2026-08-01",
      ...overrides,
    },
    display: { handle: null },
  };
}

describe("compareBaseline", () => {
  it("reports a signed token and active-day delta when comparable", () => {
    const base = baselineFromPayload(payload(100_000_000));
    const delta = compareBaseline(
      base,
      payload(340_000_000, { totalActiveDays: 25 }),
      rankTitleFor
    );
    expect(delta.comparable).toBe(true);
    if (delta.comparable) {
      expect(delta.tokensDelta).toBe(240_000_000);
      expect(delta.activeDaysDelta).toBe(15);
      expect(delta.sinceDate).toBe("2026-08-05");
    }
  });

  it("announces a crossed tier only when the tier changed", () => {
    const base = baselineFromPayload(payload(100_000_000));
    const crossed = compareBaseline(base, payload(800_000_000), rankTitleFor);
    expect(crossed.comparable && crossed.crossedRank).toBe("TIER4 · TOWER");
    const same = compareBaseline(base, payload(120_000_000), rankTitleFor);
    expect(same.comparable && same.crossedRank).toBeNull();
  });

  it("refuses a delta when the source set changed", () => {
    const base = baselineFromPayload(payload(100_000_000));
    const delta = compareBaseline(
      base,
      payload(340_000_000, {}, ["claudeCode", "cursor"]),
      rankTitleFor
    );
    expect(delta.comparable).toBe(false);
    if (!delta.comparable) {
      expect(delta.reason).toBe("sources-changed");
      expect(delta.previousSources).toEqual(["claudeCode"]);
      expect(delta.currentSources).toEqual(["claudeCode", "cursor"]);
    }
  });

  it("refuses a delta when the schema version changed", () => {
    const base = {
      ...baselineFromPayload(payload(100_000_000)),
      schemaVersion: 0,
    };
    const delta = compareBaseline(base, payload(340_000_000), rankTitleFor);
    expect(delta.comparable).toBe(false);
    if (!delta.comparable) expect(delta.reason).toBe("schema-changed");
  });

  it("shows an honest negative delta when logs shrank", () => {
    const base = baselineFromPayload(payload(340_000_000));
    const delta = compareBaseline(base, payload(100_000_000), rankTitleFor);
    expect(delta.comparable && delta.tokensDelta).toBe(-240_000_000);
    // A tier drop must never be announced as "You crossed into …".
    expect(delta.comparable && delta.crossedRank).toBeNull();
  });
});

describe("baseline file io", () => {
  let dir: string | null = null;
  afterEach(async () => {
    delete process.env.AIERACARD_HOME;
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = null;
  });

  it("round-trips state through AIERACARD_HOME and keeps only aggregates", async () => {
    dir = await mkdtemp(join(tmpdir(), "aieracard-test-"));
    process.env.AIERACARD_HOME = dir;
    const state = baselineFromPayload(payload(100_000_000));
    await writeBaseline(state);
    expect(await readBaseline()).toEqual(state);
    const raw = await readFile(baselinePath(), "utf8");
    // The privacy promise for the local file: aggregate-shaped data only.
    expect(raw).not.toMatch(/prompt|path|project/i);
  });

  it("returns null for a corrupt or foreign state file", async () => {
    dir = await mkdtemp(join(tmpdir(), "aieracard-test-"));
    process.env.AIERACARD_HOME = dir;
    await writeBaseline(baselineFromPayload(payload(1)));
    await writeFile(baselinePath(), "{not json", "utf8");
    expect(await readBaseline()).toBeNull();
    await writeFile(baselinePath(), JSON.stringify({ stateVersion: 99 }), "utf8");
    expect(await readBaseline()).toBeNull();
  });

  it("returns null when no state file exists", async () => {
    dir = await mkdtemp(join(tmpdir(), "aieracard-test-"));
    process.env.AIERACARD_HOME = dir;
    expect(await readBaseline()).toBeNull();
  });
});
