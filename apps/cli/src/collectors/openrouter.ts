import type { OpenRouterSource } from "@aieracard/schema";

const BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterResult {
  source: OpenRouterSource;
  activeDates: Set<string>;
}

async function get(path: string, key: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter ${path} returned ${res.status}`);
  }
  return res.json();
}

export async function validateOpenRouterKey(key: string): Promise<boolean> {
  try {
    await get("/key", key);
    return true;
  } catch {
    return false;
  }
}

export async function collectOpenRouter(
  key: string
): Promise<OpenRouterResult | null> {
  // /credits → all-time spend; /activity → last-30-day per-model breakdown.
  const [credits, activity] = await Promise.all([
    get("/credits", key).catch(() => null),
    get("/activity", key).catch(() => null),
  ]);

  const totalCostUsd: number =
    credits?.data?.total_usage ?? credits?.data?.usage ?? 0;

  const rows: any[] = activity?.data ?? [];
  let totalTokens = 0;
  let requestCount = 0;
  const activeDates = new Set<string>();
  const models = new Set<string>();

  for (const row of rows) {
    totalTokens +=
      (row.prompt_tokens ?? 0) +
      (row.completion_tokens ?? 0) +
      (row.reasoning_tokens ?? 0);
    requestCount += row.requests ?? 0;
    if (typeof row.date === "string") {
      const d = row.date.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) activeDates.add(d);
    }
    if (typeof row.model === "string" && row.model) models.add(row.model);
    if (typeof row.model_permaslug === "string" && row.model_permaslug)
      models.add(row.model_permaslug);
  }

  if (totalTokens === 0 && totalCostUsd === 0 && requestCount === 0) {
    return null;
  }

  return {
    source: {
      totalTokens: Math.round(totalTokens),
      totalCostUsd: Math.round(totalCostUsd * 100) / 100,
      requestCount,
      activeDays: activeDates.size,
      windowDays: 30,
      models: [...models].sort().slice(0, 50),
    },
    activeDates,
  };
}
