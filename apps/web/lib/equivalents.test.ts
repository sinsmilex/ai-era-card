import { describe, expect, it } from "vitest";
import { scaleEquivalents } from "./equivalents";

describe("scaleEquivalents", () => {
  it("returns a stable, documented set of English-text comparisons", () => {
    expect(scaleEquivalents(587_000)).toEqual([
      { id: "war-and-peace", text: "≈ 1 copy of War and Peace" },
      { id: "english-words", text: "≈ 440,250 words of English text" },
      { id: "paperback-pages", text: "≈ 1,761 paperback pages" },
      { id: "reading-hours", text: "≈ 31 hours of human reading" },
      {
        id: "shakespeare",
        text: "≈ 0.5× Shakespeare's complete works",
      },
    ]);
  });

  it("does not invent a scale comparison for absent token data", () => {
    expect(scaleEquivalents(0)).toEqual([]);
    expect(scaleEquivalents(Number.NaN)).toEqual([]);
  });
});
