import { describe, expect, it } from "vitest";
import { scaleEquivalents } from "./equivalents";

describe("scaleEquivalents", () => {
  it("returns a stable, documented set of AI-era scale comparisons", () => {
    expect(scaleEquivalents(587_000)).toEqual([
      { id: "war-and-peace", text: "≈ 1 copy of War and Peace" },
      { id: "english-words", text: "≈ 440.3K English words" },
      {
        id: "ai-serving-water",
        text: "≈ 0.1 liters of AI-serving water",
      },
      {
        id: "ai-serving-energy",
        text: "≈ 0.1 kWh of AI-serving electricity",
      },
      {
        id: "average-home-power",
        text: "≈ less than 0.1 days of power for an average home",
      },
    ]);
  });

  it("does not invent a scale comparison for absent token data", () => {
    expect(scaleEquivalents(0)).toEqual([]);
    expect(scaleEquivalents(Number.NaN)).toEqual([]);
  });

  it("keeps large scale comparisons shareable instead of falsely precise", () => {
    expect(scaleEquivalents(1_900_000_000).map(({ text }) => text)).toEqual([
      "≈ 3,237 copies of War and Peace",
      "≈ 1.4B English words",
      "≈ 228 liters of AI-serving water",
      "≈ 190 kWh of AI-serving electricity",
      "≈ 6.4 days of power for an average home",
    ]);
  });
});
