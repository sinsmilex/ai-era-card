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

// A comparison below this value would render as a false "~ 0 …" (fmtQuantity's
// one decimal bottoms out at 0.1), so we drop it from the rotation instead.
const MIN_LEGIBLE_QUANTITY = 0.1;

// ASCII "~" (not "≈"): Satori's default monospace for OG/download PNGs has no
// ≈ glyph and draws an empty tofu box instead.
const APPROX = "~";

export function scaleEquivalents(tokens: number): ScaleEquivalent[] {
  if (!Number.isFinite(tokens) || tokens <= 0) return [];

  const wordCount = Math.round(tokens * ENGLISH_WORDS_PER_TOKEN);
  const warAndPeaceCopies = warAndPeaceEquivalent(tokens);
  const referencePrompts = tokens / REPORTED_TOKENS_PER_REFERENCE_PROMPT;
  const waterLiters = (referencePrompts * REFERENCE_PROMPT_WATER_ML) / 1_000;
  const energyKwh = (referencePrompts * REFERENCE_PROMPT_ENERGY_WH) / 1_000;
  const averageHomePowerDays = energyKwh / AVERAGE_HOME_KWH_PER_DAY;

  const out: ScaleEquivalent[] = [
    {
      id: "war-and-peace",
      text: `${APPROX} ${fmtQuantity(warAndPeaceCopies)} ${
        warAndPeaceCopies === 1 ? "copy" : "copies"
      } of War and Peace`,
    },
    {
      id: "english-words",
      text: `${APPROX} ${fmtTokens(wordCount)} English ${wordCount === 1 ? "word" : "words"}`,
    },
  ];
  if (waterLiters >= MIN_LEGIBLE_QUANTITY)
    out.push({
      id: "ai-serving-water",
      text: `${APPROX} ${fmtQuantity(waterLiters)} liters of AI-serving water`,
    });
  if (energyKwh >= MIN_LEGIBLE_QUANTITY)
    out.push({
      id: "ai-serving-energy",
      text: `${APPROX} ${fmtQuantity(energyKwh)} kWh of AI-serving electricity`,
    });
  if (averageHomePowerDays >= MIN_LEGIBLE_QUANTITY)
    out.push({
      id: "average-home-power",
      text: `${APPROX} ${fmtQuantity(averageHomePowerDays)} days of power for an average home`,
    });
  return out;
}
