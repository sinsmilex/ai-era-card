import { describe, expect, it } from "vitest";
import { scaleEquivalents } from "./equivalents";

describe("scaleEquivalents", () => {
  it("returns a stable, documented set of AI-era scale comparisons", () => {
    // Water (0.07 L), energy (0.06 kWh), and home-power fall below the 0.1
    // legibility threshold at this size and are dropped, not shown as ~ 0.
    expect(scaleEquivalents(587_000)).toEqual([
      { id: "war-and-peace", text: "~ 1 copy of War and Peace" },
      { id: "english-words", text: "~ 440.3K English words" },
    ]);
  });

  it("drops comparisons that would read as a false zero", () => {
    const texts = scaleEquivalents(100_000).map(({ text }) => text);
    expect(texts).toEqual([
      "~ 1 copy of War and Peace",
      "~ 75.0K English words",
    ]);
    expect(texts.join(" ")).not.toMatch(/ 0 /);
  });

  it("never renders a raw float for the words line", () => {
    // 951 tokens × 0.75 = 713.25 — must round, not print the float.
    expect(scaleEquivalents(951).map(({ text }) => text)).toContain(
      "~ 713 English words"
    );
  });

  it("does not invent a scale comparison for absent token data", () => {
    expect(scaleEquivalents(0)).toEqual([]);
    expect(scaleEquivalents(Number.NaN)).toEqual([]);
  });

  it("keeps large scale comparisons shareable instead of falsely precise", () => {
    expect(scaleEquivalents(1_900_000_000).map(({ text }) => text)).toEqual([
      "~ 3,237 copies of War and Peace",
      "~ 1.4B English words",
      "~ 228 liters of AI-serving water",
      "~ 190 kWh of AI-serving electricity",
      "~ 6.4 days of power for an average home",
    ]);
  });
});
