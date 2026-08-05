import { fmtQuantity, fmtTokens, warAndPeaceEquivalent } from "./format";

export type ScaleEquivalent = {
  id: string;
  text: string;
};

// These are intentionally rough scale comparisons, not a measurement of this
// user's environmental impact: a snapshot has tokens, not models, requests,
// hardware, or data-centre locations.
//
// Text assumptions:
// - OpenAI's tokenizer guide: ~1 token is ~¾ of an English word.
//   https://platform.openai.com/tokenizer
//
// Serving assumptions (deliberately conservative):
// - Google's May 2025 existing-boundary estimate for a median Gemini text
//   prompt: 0.10 Wh and 0.12 mL water. We use one such prompt per 1,000
//   reported tokens as a coarse, non-personalized scaling convention.
//   https://services.google.com/fh/files/misc/measuring_the_environmental_impact_of_delivering_ai_at_google_scale.pdf
// - The U.S. Energy Information Administration reports average annual
//   residential electricity use of 10,791 kWh, or about 29.6 kWh per day.
//   https://www.eia.gov/tools/faqs/faq.php?id=97&t=3
const ENGLISH_WORDS_PER_TOKEN = 0.75;
const REPORTED_TOKENS_PER_REFERENCE_PROMPT = 1_000;
const REFERENCE_PROMPT_WATER_ML = 0.12;
const REFERENCE_PROMPT_ENERGY_WH = 0.1;
const AVERAGE_HOME_KWH_PER_DAY = 29.6;

function englishWords(tokens: number): number {
  return tokens * ENGLISH_WORDS_PER_TOKEN;
}

function averageHomePowerText(days: number): string {
  if (days < 0.1) return "less than 0.1 days of power for an average home";
  return `${fmtQuantity(days)} days of power for an average home`;
}

export function scaleEquivalents(tokens: number): ScaleEquivalent[] {
  if (!Number.isFinite(tokens) || tokens <= 0) return [];

  const words = englishWords(tokens);
  const warAndPeaceCopies = warAndPeaceEquivalent(tokens);
  const referencePrompts = tokens / REPORTED_TOKENS_PER_REFERENCE_PROMPT;
  const waterLiters = (referencePrompts * REFERENCE_PROMPT_WATER_ML) / 1_000;
  const energyKwh = (referencePrompts * REFERENCE_PROMPT_ENERGY_WH) / 1_000;
  const averageHomePowerDays = energyKwh / AVERAGE_HOME_KWH_PER_DAY;

  return [
    {
      id: "war-and-peace",
      text: `≈ ${fmtQuantity(warAndPeaceCopies)} ${
        warAndPeaceCopies === 1 ? "copy" : "copies"
      } of War and Peace`,
    },
    {
      id: "english-words",
      text: `≈ ${fmtTokens(words)} English words`,
    },
    {
      id: "ai-serving-water",
      text: `≈ ${fmtQuantity(waterLiters)} liters of AI-serving water`,
    },
    {
      id: "ai-serving-energy",
      text: `≈ ${fmtQuantity(energyKwh)} kWh of AI-serving electricity`,
    },
    {
      id: "average-home-power",
      text: `≈ ${averageHomePowerText(averageHomePowerDays)}`,
    },
  ];
}
