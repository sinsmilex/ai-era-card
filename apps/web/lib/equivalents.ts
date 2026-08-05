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
// - A 70B model on an H100 runs at roughly 85 output tokens/second in a
//   representative benchmark. This is a throughput comparison, not a claim
//   about the hardware that served the snapshot.
//   https://www.gmicloud.ai/en/blog/llm-inference-cost-per-million-tokens
const ENGLISH_WORDS_PER_TOKEN = 0.75;
const REPORTED_TOKENS_PER_REFERENCE_PROMPT = 1_000;
const REFERENCE_PROMPT_WATER_ML = 0.12;
const REFERENCE_PROMPT_ENERGY_WH = 0.1;
const H100_70B_TOKENS_PER_SECOND = 85;

function englishWords(tokens: number): number {
  return tokens * ENGLISH_WORDS_PER_TOKEN;
}

export function scaleEquivalents(tokens: number): ScaleEquivalent[] {
  if (!Number.isFinite(tokens) || tokens <= 0) return [];

  const words = englishWords(tokens);
  const warAndPeaceCopies = warAndPeaceEquivalent(tokens);
  const referencePrompts = tokens / REPORTED_TOKENS_PER_REFERENCE_PROMPT;
  const waterLiters = (referencePrompts * REFERENCE_PROMPT_WATER_ML) / 1_000;
  const energyKwh = (referencePrompts * REFERENCE_PROMPT_ENERGY_WH) / 1_000;
  const h100GpuHours = tokens / H100_70B_TOKENS_PER_SECOND / 3_600;

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
      id: "h100-gpu-hours",
      text: `≈ ${fmtQuantity(
        h100GpuHours
      )} H100 GPU-hours at 70B-model speed`,
    },
  ];
}
