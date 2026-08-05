import { describe, expect, it } from "vitest";
import { snapshotPayloadSchema, SCHEMA_VERSION } from "./index.js";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: "2026-07-18",
    cliVersion: "0.1.0",
    sources: {
      claudeCode: {
        tokensIn: 1000,
        tokensOut: 500,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: 1500,
        estimatedCostUsd: 1.25,
        costConfidence: "estimated",
        sessionCount: 3,
        projectCount: 1,
        activeDays: 2,
        longestStreakDays: 2,
        firstActivityDate: "2026-07-01",
        lastActivityDate: "2026-07-02",
        models: ["claude-sonnet-4"],
      },
    },
    aggregate: {
      totalTokens: 1500,
      totalCostUsd: 1.25,
      totalActiveDays: 2,
      longestStreakDays: 2,
      distinctModels: ["claude-sonnet-4"],
      sourceCount: 1,
      firstActivityDate: "2026-07-01",
      lastActivityDate: "2026-07-02",
    },
    display: { handle: "sinsmile" },
    ...overrides,
  };
}

describe("snapshotPayloadSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = snapshotPayloadSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("accepts null cost (unknown) on aggregate and Claude Code", () => {
    const result = snapshotPayloadSchema.safeParse(
      validPayload({
        sources: {
          claudeCode: {
            tokensIn: 100,
            tokensOut: 50,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            totalTokens: 150,
            estimatedCostUsd: null,
            costConfidence: "partial",
            sessionCount: 1,
            projectCount: 1,
            activeDays: 1,
            longestStreakDays: 1,
            firstActivityDate: "2026-07-01",
            lastActivityDate: "2026-07-01",
            models: ["claude-opus-4"],
          },
        },
        aggregate: {
          totalTokens: 150,
          totalCostUsd: null,
          totalActiveDays: 1,
          longestStreakDays: 1,
          distinctModels: ["claude-opus-4"],
          sourceCount: 1,
          firstActivityDate: "2026-07-01",
          lastActivityDate: "2026-07-01",
        },
      })
    );
    expect(result.success).toBe(true);
  });

  it("rejects payloads with no sources", () => {
    const result = snapshotPayloadSchema.safeParse(
      validPayload({ sources: {} })
    );
    expect(result.success).toBe(false);
  });

  it("rejects unknown top-level fields (privacy contract is closed)", () => {
    const result = snapshotPayloadSchema.safeParse(
      validPayload({
        prompt: "write me a function",
        filePath: "/Users/me/secret/project/app.ts",
        projectName: "my-startup",
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects invalid handle characters", () => {
    const result = snapshotPayloadSchema.safeParse(
      validPayload({ display: { handle: "bad\nhandle<script>" } })
    );
    expect(result.success).toBe(false);
  });

  it("rejects dates before the minimum", () => {
    const result = snapshotPayloadSchema.safeParse(
      validPayload({ generatedAt: "2020-01-01" })
    );
    expect(result.success).toBe(false);
  });
});
