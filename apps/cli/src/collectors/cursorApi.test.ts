import { afterEach, describe, expect, it, vi } from "vitest";
import { collectCursorApi } from "./cursorApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe("collectCursorApi", () => {
  it("retries an intermittent aggregated-window failure", async () => {
    let aggregateCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const path = new URL(String(input)).pathname;
        if (path === "/api/auth/me") return response({ email: "test@example.com" });
        if (path === "/api/dashboard/get-aggregated-usage-events") {
          aggregateCalls++;
          if (aggregateCalls <= 2) return response({}, 500);
          return response({
            aggregations: [{ inputTokens: 100, outputTokens: 50, totalCents: 25 }],
          });
        }
        if (path === "/api/dashboard/get-filtered-usage-events") {
          return response({ totalUsageEventsCount: 0, usageEventsDisplay: [] });
        }
        throw new Error(`unexpected path ${path}`);
      })
    );

    const result = await collectCursorApi("user::token");

    expect(result?.source.totalTokens).toBe(450);
    expect(result?.source.totalCostUsd).toBe(0.75);
    expect(aggregateCalls).toBe(5);
    expect(result?.warnings).toEqual([]);
  });

  it("keeps successful windows when one aggregated window stays unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        if (path === "/api/auth/me") return response({});
        if (path === "/api/dashboard/get-aggregated-usage-events") {
          const body = JSON.parse(String(init?.body));
          if (body.startDate === String(Date.UTC(2023, 0, 1))) {
            return response({}, 500);
          }
          return response({
            aggregations: [{ inputTokens: 10, outputTokens: 5, totalCents: 1 }],
          });
        }
        if (path === "/api/dashboard/get-filtered-usage-events") {
          return response({ totalUsageEventsCount: 0, usageEventsDisplay: [] });
        }
        throw new Error(`unexpected path ${path}`);
      })
    );

    const result = await collectCursorApi("user::token");

    expect(result?.source.totalTokens).toBe(45);
    expect(result?.source.totalCostUsd).toBe(0.03);
    expect(result?.warnings).toContainEqual(
      expect.stringContaining("aggregated usage unavailable")
    );
  });
});
