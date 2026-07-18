import { open } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { CursorSource } from "@aieracard/schema";
import { toDateOnly } from "../dates.js";

// All-time Cursor usage via the dashboard's own API (cursor.com/api/*).
// Auth is the WorkosCursorSessionToken web-session cookie ("<id>::<jwt>").
// The token is resolved locally (flag → env → Cursor's state.vscdb, reading
// ONLY the auth token — never chat content) and is sent ONLY to cursor.com.
// These endpoints are undocumented and may change.

const BASE = "https://cursor.com";

export interface CursorApiResult {
  source: CursorSource;
  activeDates: Set<string>;
  email: string | null;
  warnings: string[];
}

interface CursorWindow {
  startMs: number;
  endMs: number;
}

interface FilteredWindowResult {
  requestCount: number;
  activeDates: Set<string>;
  firstMs: number | null;
  lastMs: number | null;
}

class CursorApiError extends Error {
  constructor(
    readonly status: number | null,
    message: string
  ) {
    super(message);
  }
}

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);
const MAX_API_ATTEMPTS = 3;

function windowLabel({ startMs, endMs }: CursorWindow): string {
  return `${new Date(startMs).toISOString().slice(0, 10)} to ${new Date(endMs)
    .toISOString()
    .slice(0, 10)}`;
}

function splitWindow(window: CursorWindow): [CursorWindow, CursorWindow] | null {
  const midpoint = Math.floor((window.startMs + window.endMs) / 2);
  if (midpoint <= window.startMs || midpoint >= window.endMs) return null;
  return [
    { startMs: window.startMs, endMs: midpoint },
    { startMs: midpoint, endMs: window.endMs },
  ];
}

function jwtClaims(token: string): any {
  try {
    const payload = token.split(".")[1];
    const pad = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(pad, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}

function cookieFromJwt(jwt: string): string | null {
  const sub: string | undefined = jwtClaims(jwt).sub;
  if (!sub) return null;
  const id = sub.split("|").pop();
  return id ? `${id}::${jwt}` : null;
}

function stateDbCandidates(): string[] {
  const appData =
    process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
  const base =
    process.platform === "darwin"
      ? join(homedir(), "Library", "Application Support")
      : process.platform === "win32"
        ? appData
        : (process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"));
  return ["Cursor", "Cursor Nightly"].map((app) =>
    join(base, app, "User", "globalStorage", "state.vscdb")
  );
}

// Scan the SQLite file's bytes for JWTs and pick a web-session token.
// Avoids a native sqlite dependency. The DB can be hundreds of MB, so read
// in chunks with an overlap large enough to catch a JWT spanning a boundary.
async function tokenFromStateDb(): Promise<string | null> {
  const CHUNK = 16 * 1024 * 1024;
  const OVERLAP = 16 * 1024;
  for (const path of stateDbCandidates()) {
    let handle;
    try {
      handle = await open(path, "r");
    } catch {
      continue;
    }
    // Prefer an explicit web-session token (type === "session"); other
    // long-lived tokens in the DB (refresh/legacy) get 401 from the dashboard.
    let best: { jwt: string; exp: number; isSession: boolean } | null = null;
    try {
      const size = (await handle.stat()).size;
      const buf = Buffer.alloc(Math.min(CHUNK + OVERLAP, size));
      for (let pos = 0; pos < size; pos += CHUNK) {
        const len = Math.min(CHUNK + OVERLAP, size - pos);
        await handle.read(buf, 0, len, pos);
        const text = buf.subarray(0, len).toString("latin1");
        const jwts =
          text.match(/eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g) ?? [];
        for (const jwt of new Set(jwts)) {
          const claims = jwtClaims(jwt);
          if (!claims.sub) continue;
          if (claims.type === "api_key_token") continue; // Agent key ≠ web session
          const exp = claims.exp ?? 0;
          if (exp * 1000 < Date.now()) continue;
          const isSession = claims.type === "session";
          if (
            !best ||
            (isSession && !best.isSession) ||
            (isSession === best.isSession && exp > best.exp)
          ) {
            best = { jwt, exp, isSession };
          }
        }
      }
    } catch {
      // fall through to next candidate
    } finally {
      await handle.close();
    }
    if (best) return best.jwt;
  }
  return null;
}

export async function resolveCursorCookie(
  explicit?: string
): Promise<string | null> {
  const raw = (explicit ?? process.env.CURSOR_SESSION_TOKEN ?? "").trim();
  if (raw) {
    const v = raw.replace(/%3A%3A/gi, "::");
    return v.includes("::") ? v : cookieFromJwt(v);
  }
  const jwt = await tokenFromStateDb();
  return jwt ? cookieFromJwt(jwt) : null;
}

async function api(
  cookie: string,
  path: string,
  body?: unknown
): Promise<any> {
  const headers: Record<string, string> = {
    Cookie: "WorkosCursorSessionToken=" + cookie.replace("::", "%3A%3A"),
    Accept: "application/json",
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers["Origin"] = BASE; // dashboard CSRF check
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(BASE + path, {
        method: body !== undefined ? "POST" : "GET",
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        throw new CursorApiError(
          res.status,
          `cursor.com ${path} returned ${res.status}`
        );
      }
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch (error) {
      lastError = error;
      const status = error instanceof CursorApiError ? error.status : null;
      const retryable = status === null || RETRYABLE_STATUSES.has(status);
      if (!retryable || attempt === MAX_API_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

function aggregateInto(
  agg: any,
  totals: { tokens: number; cents: number; models: Set<string> }
) {
  for (const r of agg?.aggregations ?? []) {
    totals.tokens +=
      Number(r.inputTokens ?? 0) +
      Number(r.outputTokens ?? 0) +
      Number(r.cacheReadTokens ?? 0) +
      Number(r.cacheWriteTokens ?? 0);
    totals.cents += Number(r.totalCents ?? 0);
    const m = String(r.modelIntent ?? r.model ?? "");
    // Skip Cursor's service labels that aren't actual models.
    if (m && !["unknown", "default", "premium", "agent_review"].includes(m))
      totals.models.add(m);
  }
}

async function collectAggregatedWindow(
  cookie: string,
  window: CursorWindow,
  totals: { tokens: number; cents: number; models: Set<string> },
  warnings: string[],
  depth = 0
): Promise<void> {
  try {
    const agg = await api(cookie, "/api/dashboard/get-aggregated-usage-events", {
      teamId: 0,
      startDate: String(window.startMs),
      endDate: String(window.endMs),
    });
    aggregateInto(agg, totals);
  } catch (error: any) {
    const halves = depth === 0 ? splitWindow(window) : null;
    if (halves) {
      warnings.push(
        `aggregated usage failed for ${windowLabel(window)}; retrying its two halves`
      );
      await collectAggregatedWindow(cookie, halves[0], totals, warnings, depth + 1);
      await collectAggregatedWindow(cookie, halves[1], totals, warnings, depth + 1);
      return;
    }
    warnings.push(
      `aggregated usage unavailable for ${windowLabel(window)}: ${error.message}`
    );
  }
}

async function collectFilteredWindow(
  cookie: string,
  window: CursorWindow,
  onProgress: ((fetched: number, total: number) => void) | undefined,
  warnings: string[],
  depth = 0
): Promise<FilteredWindowResult> {
  try {
    const result: FilteredWindowResult = {
      requestCount: 0,
      activeDates: new Set<string>(),
      firstMs: null,
      lastMs: null,
    };
    const pageSize = 1000;
    let total = 0;
    for (let page = 1; page <= 300; page++) {
      const chunk = await api(cookie, "/api/dashboard/get-filtered-usage-events", {
        teamId: 0,
        startDate: String(window.startMs),
        endDate: String(window.endMs),
        page,
        pageSize,
      });
      if (page === 1) total = Number(chunk?.totalUsageEventsCount ?? 0);
      const events: any[] = chunk?.usageEventsDisplay ?? [];
      if (events.length === 0) break;
      result.requestCount += events.length;
      for (const ev of events) {
        const ts = Number(ev.timestamp ?? 0);
        if (ts <= 0) continue;
        if (result.firstMs == null || ts < result.firstMs) result.firstMs = ts;
        if (result.lastMs == null || ts > result.lastMs) result.lastMs = ts;
        const d = toDateOnly(new Date(ts).toISOString());
        if (d) result.activeDates.add(d);
      }
      onProgress?.(result.requestCount, total);
      if (result.requestCount >= total) break;
    }
    return result;
  } catch (error: any) {
    const halves = depth === 0 ? splitWindow(window) : null;
    if (halves) {
      warnings.push(
        `usage events failed for ${windowLabel(window)}; retrying its two halves`
      );
      const [left, right] = await Promise.all([
        collectFilteredWindow(cookie, halves[0], onProgress, warnings, depth + 1),
        collectFilteredWindow(cookie, halves[1], onProgress, warnings, depth + 1),
      ]);
      return {
        requestCount: left.requestCount + right.requestCount,
        activeDates: new Set([...left.activeDates, ...right.activeDates]),
        firstMs:
          left.firstMs == null
            ? right.firstMs
            : right.firstMs == null
              ? left.firstMs
              : Math.min(left.firstMs, right.firstMs),
        lastMs:
          left.lastMs == null
            ? right.lastMs
            : right.lastMs == null
              ? left.lastMs
              : Math.max(left.lastMs, right.lastMs),
      };
    }
    warnings.push(`usage events unavailable for ${windowLabel(window)}: ${error.message}`);
    return {
      requestCount: 0,
      activeDates: new Set<string>(),
      firstMs: null,
      lastMs: null,
    };
  }
}

export async function collectCursorApi(
  cookie: string,
  onProgress?: (fetched: number, total: number) => void
): Promise<CursorApiResult | null> {
  const warnings: string[] = [];
  let email: string | null = null;
  try {
    const me = await api(cookie, "/api/auth/me");
    email = me?.email ?? null;
  } catch (error: any) {
    warnings.push(`could not fetch account details: ${error.message}`);
  }

  const startMs = Date.UTC(2023, 0, 1); // Cursor launched in 2023
  const endMs = Date.now();

  // Cursor's backends can't serve one query spanning both their legacy and
  // current storage — the API asks to split at these dates.
  const SPLIT_1 = Date.UTC(2025, 7, 1); // 2025-08-01
  const SPLIT_2 = Date.UTC(2026, 4, 14); // 2026-05-14
  const bounds = [startMs, SPLIT_1, SPLIT_2, endMs]
    .filter((t) => t >= startMs && t <= endMs)
    .sort((a, b) => a - b);

  // Aggregated: per-model tokens + cents, summed across the sub-windows.
  const totals = { tokens: 0, cents: 0, models: new Set<string>() };
  for (let i = 0; i < bounds.length - 1; i++) {
    if (bounds[i] >= bounds[i + 1]) continue;
    await collectAggregatedWindow(
      cookie,
      { startMs: bounds[i], endMs: bounds[i + 1] },
      totals,
      warnings
    );
  }

  // Events: Cursor also rejects the all-time request intermittently, so fetch
  // the same storage-safe windows independently. A bad window must not erase
  // events gathered from the rest of the user's history.
  const eventTotals: FilteredWindowResult = {
    requestCount: 0,
    activeDates: new Set<string>(),
    firstMs: null,
    lastMs: null,
  };
  for (let i = 0; i < bounds.length - 1; i++) {
    if (bounds[i] >= bounds[i + 1]) continue;
    const chunk = await collectFilteredWindow(
      cookie,
      { startMs: bounds[i], endMs: bounds[i + 1] },
      onProgress,
      warnings
    );
    eventTotals.requestCount += chunk.requestCount;
    for (const date of chunk.activeDates) eventTotals.activeDates.add(date);
    if (chunk.firstMs != null && (eventTotals.firstMs == null || chunk.firstMs < eventTotals.firstMs))
      eventTotals.firstMs = chunk.firstMs;
    if (chunk.lastMs != null && (eventTotals.lastMs == null || chunk.lastMs > eventTotals.lastMs))
      eventTotals.lastMs = chunk.lastMs;
  }

  if (totals.tokens === 0 && eventTotals.requestCount === 0) {
    if (warnings.length > 0) {
      throw new Error(`Cursor API returned no usable data: ${warnings.join("; ")}`);
    }
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const msToDate = (ms: number | null) =>
    ms ? new Date(ms).toISOString().slice(0, 10) : today;

  return {
    source: {
      totalTokens: Math.round(totals.tokens),
      totalCostUsd: Math.round(totals.cents) / 100,
      requestCount: eventTotals.requestCount,
      activeDays: eventTotals.activeDates.size,
      dateRange: { from: msToDate(eventTotals.firstMs), to: msToDate(eventTotals.lastMs) },
      models: [...totals.models].sort().slice(0, 50),
    },
    activeDates: eventTotals.activeDates,
    email,
    warnings,
  };
}
