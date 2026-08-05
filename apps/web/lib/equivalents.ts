import { fmtQuantity, warAndPeaceEquivalent } from "./format";

export type ScaleEquivalent = {
  id: string;
  text: string;
};

// Token-to-text comparisons are deliberately limited to English-text
// equivalents. We do not infer energy or water use: those depend heavily on
// model, hardware, data centre, and request shape, none of which a snapshot
// contains.
//
// Assumptions:
// - OpenAI's tokenizer guide: ~1 token is ~¾ of an English word.
//   https://platform.openai.com/tokenizer
// - Brysbaert (2019): silent English reading averages 238 words/minute.
//   https://doi.org/10.3758/s13428-019-01250-1
// - Open Source Shakespeare counts 884,647 words across the complete works.
//   https://www.opensourceshakespeare.org/
// Paperback-page density (250 words) is an explicit editorial convention,
// not a physical-paper claim.
const ENGLISH_WORDS_PER_TOKEN = 0.75;
const WORDS_PER_PAPERBACK_PAGE = 250;
const WORDS_PER_READING_MINUTE = 238;
const SHAKESPEARE_COMPLETE_WORKS_WORDS = 884_647;

function englishWords(tokens: number): number {
  return tokens * ENGLISH_WORDS_PER_TOKEN;
}

export function scaleEquivalents(tokens: number): ScaleEquivalent[] {
  if (!Number.isFinite(tokens) || tokens <= 0) return [];

  const words = englishWords(tokens);
  const warAndPeaceCopies = warAndPeaceEquivalent(tokens);

  return [
    {
      id: "war-and-peace",
      text: `≈ ${fmtQuantity(warAndPeaceCopies)} ${
        warAndPeaceCopies === 1 ? "copy" : "copies"
      } of War and Peace`,
    },
    {
      id: "english-words",
      text: `≈ ${fmtQuantity(words)} words of English text`,
    },
    {
      id: "paperback-pages",
      text: `≈ ${fmtQuantity(words / WORDS_PER_PAPERBACK_PAGE)} paperback pages`,
    },
    {
      id: "reading-hours",
      text: `≈ ${fmtQuantity(
        words / WORDS_PER_READING_MINUTE / 60
      )} hours of human reading`,
    },
    {
      id: "shakespeare",
      text: `≈ ${fmtQuantity(
        words / SHAKESPEARE_COMPLETE_WORKS_WORDS
      )}× Shakespeare's complete works`,
    },
  ];
}
