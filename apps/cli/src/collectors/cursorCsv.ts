import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import type { CursorSource } from "@aieracard/schema";
import { toDateOnly } from "../dates.js";

export interface CursorResult {
  source: CursorSource;
  activeDates: Set<string>;
  warnings: string[];
}

// Header-based, tolerant parser for the personal usage CSV exported from
// cursor.com/dashboard. Column names have drifted across export versions,
// so match case-insensitively against a list of candidates and null out
// stats whose column is missing instead of failing the whole source.

function findColumn(headers: string[], candidates: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.findIndex((h) => h === c || h.includes(c));
    if (i >= 0) return headers[i];
  }
  return null;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function collectCursorCsv(path: string): Promise<CursorResult> {
  const raw = await readFile(path, "utf8");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });
  if (records.length === 0) {
    throw new Error("CSV file contains no data rows");
  }

  const headers = Object.keys(records[0]);
  const warnings: string[] = [];

  const dateCol = findColumn(headers, ["date", "timestamp", "time"]);
  const modelCol = findColumn(headers, ["model"]);
  const costCol = findColumn(headers, ["cost", "amount", "price", "spend"]);
  const tokensCol = findColumn(headers, [
    "total tokens",
    "tokens",
    "token count",
  ]);

  if (!dateCol) warnings.push("no date column found — activeDays will be 0");
  if (!costCol) warnings.push("no cost column found — cost will be omitted");
  if (!tokensCol)
    warnings.push("no token column found — tokens will be omitted");

  let totalTokens: number | null = tokensCol ? 0 : null;
  let totalCostUsd: number | null = costCol ? 0 : null;
  const activeDates = new Set<string>();
  const models = new Set<string>();
  let from: string | null = null;
  let to: string | null = null;

  for (const row of records) {
    if (tokensCol) {
      const t = toNumber(row[tokensCol]);
      if (t != null) totalTokens = (totalTokens ?? 0) + t;
    }
    if (costCol) {
      const c = toNumber(row[costCol]);
      if (c != null) totalCostUsd = (totalCostUsd ?? 0) + c;
    }
    if (dateCol && row[dateCol]) {
      const d =
        toDateOnly(String(row[dateCol])) ??
        toDateOnly(new Date(String(row[dateCol])).toISOString?.() ?? "");
      if (d) {
        activeDates.add(d);
        if (!from || d < from) from = d;
        if (!to || d > to) to = d;
      }
    }
    if (modelCol && row[modelCol]) models.add(String(row[modelCol]).trim());
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    source: {
      totalTokens: totalTokens != null ? Math.round(totalTokens) : null,
      totalCostUsd:
        totalCostUsd != null ? Math.round(totalCostUsd * 100) / 100 : null,
      requestCount: records.length,
      activeDays: activeDates.size,
      dateRange: { from: from ?? today, to: to ?? today },
      models: [...models].sort().slice(0, 50),
    },
    activeDates,
    warnings,
  };
}
