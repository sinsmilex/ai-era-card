import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectCodex } from "./codex.js";

let tmp: string | null = null;

afterEach(async () => {
  if (tmp) await rm(tmp, { recursive: true, force: true });
  tmp = null;
});

async function writeSession(home: string, lines: unknown[]) {
  const dir = join(home, "sessions", "2026", "07", "18");
  await mkdir(dir, { recursive: true });
  const file = join(dir, "rollout-test.jsonl");
  await writeFile(file, lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
}

describe("collectCodex", () => {
  it("diffs cumulative total_token_usage and ignores duplicate snapshots", async () => {
    tmp = await mkdtemp(join(tmpdir(), "aieracard-codex-"));
    await writeSession(tmp, [
      {
        timestamp: "2026-07-18T10:00:00Z",
        type: "turn_context",
        payload: { model: "gpt-5.1" },
      },
      {
        timestamp: "2026-07-18T10:00:01Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 100,
              cached_input_tokens: 20,
              output_tokens: 30,
              reasoning_output_tokens: 5,
              total_tokens: 130,
            },
            last_token_usage: {
              input_tokens: 100,
              cached_input_tokens: 20,
              output_tokens: 30,
              reasoning_output_tokens: 5,
              total_tokens: 130,
            },
          },
        },
      },
      // Duplicate cumulative — must not double-count
      {
        timestamp: "2026-07-18T10:00:02Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 100,
              cached_input_tokens: 20,
              output_tokens: 30,
              reasoning_output_tokens: 5,
              total_tokens: 130,
            },
            last_token_usage: {
              input_tokens: 100,
              cached_input_tokens: 20,
              output_tokens: 30,
              reasoning_output_tokens: 5,
              total_tokens: 130,
            },
          },
        },
      },
      {
        timestamp: "2026-07-18T10:00:03Z",
        type: "event_msg",
        payload: {
          type: "token_count",
          info: {
            total_token_usage: {
              input_tokens: 150,
              cached_input_tokens: 40,
              output_tokens: 50,
              reasoning_output_tokens: 5,
              total_tokens: 200,
            },
          },
        },
      },
    ]);

    const result = await collectCodex(tmp);
    expect(result).not.toBeNull();
    expect(result!.source.totalTokens).toBe(200);
    expect(result!.source.tokensIn).toBe(150);
    expect(result!.source.tokensOut).toBe(50);
    expect(result!.source.cacheReadTokens).toBe(40);
    expect(result!.source.models).toEqual(["gpt-5.1"]);
    expect(result!.source.estimatedCostUsd).not.toBeNull();
    expect(result!.source.costConfidence).toBe("estimated");
  });

  it("returns null when no token_count events exist", async () => {
    tmp = await mkdtemp(join(tmpdir(), "aieracard-codex-"));
    await writeSession(tmp, [
      { timestamp: "2026-07-18T10:00:00Z", type: "session_meta", payload: {} },
    ]);
    expect(await collectCodex(tmp)).toBeNull();
  });
});
