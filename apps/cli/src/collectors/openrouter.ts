import type { OpenRouterSource } from "@aieracard/schema";

const BASE = "https://openrouter.ai/api/v1";

export interface OpenRouterResult {
  source: OpenRouterSource;
  activeDates: Set<string>;
  /** Non-fatal notes for the CLI (e.g. credits unavailable). */
  warnings: string[];
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

function parseCostUsd(credits: unknown): number | null {
  if (!credits || typeof credits !== "object") return null;
  const data = (credits as { data?: { total_usage?: unknown } }).data;
  const raw = data?.total_usage;
  return typeof raw === "number" && Number.isFinite(raw) && raw >= 0
    ? Math.round(raw * 100) / 100
    : null;
}

function parseActivityRows(activity: unknown): any[] {
  if (!activity || typeof activity !== "object") return [];
  const data = (activity as { data?: unknown }).data;
  return Array.isArray(data) ? data : [];
}

/**
 * /credits → all-time spend (total_usage).
 * /activity → last 30 completed UTC days of tokens/models.
 * Activity failure is fatal for this source (no token story without it).
 * Credits failure is a warning; cost stays null and is never coerced to $0.
 */
export async function collectOpenRouter(
  key: string
): Promise<OpenRouterResult | null> {
  const warnings: string[] = [];

  let credits: unknown = null;
  try {
    credits = await get("/credits", key);
  } catch (e: any) {
    warnings.push(
      `/credits failed (${e.message}) — all-time spend unknown; tokens still from last 30 days`
    );
  }

  let activity: unknown;
  try {
    activity = await get("/activity", key);
  } catch (e: any) {
    throw new Error(
      `OpenRouter /activity failed (${e.message}). Need a management API key with activity access.`
    );
  }

  const totalCostUsd = parseCostUsd(credits);
  if (credits != null && totalCostUsd == null) {
    warnings.push("/credits returned an unexpected shape — spend left unknown");
  }

  const rows = parseActivityRows(activity);
  let totalTokens = 0;
  let requestCount = 0;
  const activeDates = new Set<string>();
  const models = new Set<string>();

  for (const row of rows) {
    totalTokens +=
      (Number(row.prompt_tokens) || 0) +
      (Number(row.completion_tokens) || 0) +
      (Number(row.reasoning_tokens) || 0);
    requestCount += Number(row.requests) || 0;
    if (typeof row.date === "string") {
      const d = row.date.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) activeDates.add(d);
    }
    // Prefer canonical model id; fall back to permaslug — never both.
    if (typeof row.model === "string" && row.model) models.add(row.model);
    else if (typeof row.model_permaslug === "string" && row.model_permaslug)
      models.add(row.model_permaslug);
  }

  if (totalTokens === 0 && requestCount === 0 && totalCostUsd == null) {
    return null;
  }

  return {
    source: {
      totalTokens: Math.round(totalTokens),
      totalCostUsd,
      requestCount,
      activeDays: activeDates.size,
      windowDays: 30,
      models: [...models].sort().slice(0, 50),
    },
    activeDates,
    warnings,
  };
}
