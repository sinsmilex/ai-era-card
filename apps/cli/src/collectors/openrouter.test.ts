import { afterEach, describe, expect, it, vi } from "vitest";
import { collectOpenRouter } from "./openrouter.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(handlers: Record<string, unknown | Error>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      const path = Object.keys(handlers).find((p) => url.endsWith(p));
      if (!path) throw new Error(`unexpected fetch ${url}`);
      const body = handlers[path];
      if (body instanceof Error) throw body;
      return {
        ok: true,
        status: 200,
        json: async () => body,
      };
    })
  );
}

describe("collectOpenRouter", () => {
  it("parses credits + activity and prefers model over permaslug", async () => {
    stubFetch({
      "/credits": { data: { total_credits: 100, total_usage: 12.345 } },
      "/activity": {
        data: [
          {
            date: "2026-07-01T00:00:00Z",
            prompt_tokens: 100,
            completion_tokens: 50,
            reasoning_tokens: 0,
            requests: 2,
            model: "openai/gpt-4.1",
            model_permaslug: "openai/gpt-4.1-2025-04-14",
          },
        ],
      },
    });

    const result = await collectOpenRouter("sk-or-test");
    expect(result).not.toBeNull();
    expect(result!.source.totalTokens).toBe(150);
    expect(result!.source.totalCostUsd).toBe(12.35);
    expect(result!.source.windowDays).toBe(30);
    expect(result!.source.models).toEqual(["openai/gpt-4.1"]);
    expect(result!.warnings).toEqual([]);
  });

  it("keeps cost null when /credits fails but /activity works", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith("/credits")) {
          return { ok: false, status: 403, json: async () => ({}) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                date: "2026-07-02",
                prompt_tokens: 10,
                completion_tokens: 5,
                requests: 1,
                model: "deepseek/deepseek-chat",
              },
            ],
          }),
        };
      })
    );

    const result = await collectOpenRouter("sk-or-test");
    expect(result!.source.totalTokens).toBe(15);
    expect(result!.source.totalCostUsd).toBeNull();
    expect(result!.warnings.length).toBeGreaterThan(0);
  });

  it("throws when /activity fails", async () => {
    stubFetch({
      "/credits": { data: { total_usage: 1 } },
      "/activity": new Error("network"),
    });
    // activity path uses !res.ok — stub a 500 instead
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith("/credits")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: { total_usage: 1 } }),
          };
        }
        return { ok: false, status: 500, json: async () => ({}) };
      })
    );

    await expect(collectOpenRouter("sk-or-test")).rejects.toThrow(/activity/);
  });
});
