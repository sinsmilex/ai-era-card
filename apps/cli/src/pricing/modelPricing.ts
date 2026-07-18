// Static pricing table, USD per 1M tokens. Cache read ≈ 0.1x input,
// cache write ≈ 1.25x input (5m TTL) — folded into explicit rates below.
// Unknown models still count tokens; their cost contribution is skipped and
// the payload is marked costConfidence: "partial".

export interface ModelRates {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

function rates(input: number, output: number): ModelRates {
  return {
    input,
    output,
    cacheRead: input * 0.1,
    cacheWrite: input * 1.25,
  };
}

// Keys are matched as prefixes against the model id from the logs, so date
// suffixes and provider prefixes still resolve (longest prefix wins).
export const MODEL_PRICING: Record<string, ModelRates> = {
  "claude-fable-5": rates(10, 50),
  "claude-mythos-5": rates(10, 50),
  "claude-opus-4-8": rates(5, 25),
  "claude-opus-4-7": rates(5, 25),
  "claude-opus-4-6": rates(5, 25),
  "claude-opus-4-5": rates(5, 25),
  "claude-opus-4-1": rates(15, 75),
  "claude-opus-4": rates(15, 75),
  "claude-sonnet-5": rates(3, 15),
  "claude-sonnet-4-6": rates(3, 15),
  "claude-sonnet-4-5": rates(3, 15),
  "claude-sonnet-4": rates(3, 15),
  "claude-3-7-sonnet": rates(3, 15),
  "claude-3-5-sonnet": rates(3, 15),
  "claude-haiku-4-5": rates(1, 5),
  "claude-3-5-haiku": rates(0.8, 4),
  "claude-3-haiku": rates(0.25, 1.25),
};

const sortedKeys = Object.keys(MODEL_PRICING).sort((a, b) => b.length - a.length);

export function ratesFor(modelId: string): ModelRates | null {
  const normalized = modelId.replace(/^(anthropic\.|us\.anthropic\.)/, "");
  for (const key of sortedKeys) {
    if (normalized.startsWith(key)) return MODEL_PRICING[key];
  }
  return null;
}
