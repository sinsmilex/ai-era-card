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
  const res = await fetch(BASE + path, {
    method: body !== undefined ? "POST" : "GET",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`cursor.com ${path} returned ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export async function collectCursorApi(
  cookie: string,
  onProgress?: (fetched: number, total: number) => void
): Promise<CursorApiResult | null> {
  const me = await api(cookie, "/api/auth/me");
  const email: string | null = me?.email ?? null;

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
  let tokens = 0;
  let cents = 0;
  const models = new Set<string>();
  for (let i = 0; i < bounds.length - 1; i++) {
    if (bounds[i] >= bounds[i + 1]) continue;
    const agg = await api(cookie, "/api/dashboard/get-aggregated-usage-events", {
      teamId: 0,
      startDate: String(bounds[i]),
      endDate: String(bounds[i + 1]),
    });
    for (const r of agg?.aggregations ?? []) {
      tokens +=
        Number(r.inputTokens ?? 0) +
        Number(r.outputTokens ?? 0) +
        Number(r.cacheReadTokens ?? 0) +
        Number(r.cacheWriteTokens ?? 0);
      cents += Number(r.totalCents ?? 0);
      const m = String(r.modelIntent ?? r.model ?? "");
      // Skip Cursor's service labels that aren't actual models.
      if (m && !["unknown", "default", "premium", "agent_review"].includes(m))
        models.add(m);
    }
  }
  const window = {
    teamId: 0,
    startDate: String(startMs),
    endDate: String(endMs),
  };

  // Events: paginate for request count + active-day set.
  const activeDates = new Set<string>();
  let requestCount = 0;
  let firstMs: number | null = null;
  let lastMs: number | null = null;
  const pageSize = 1000;
  let page = 1;
  let total = 0;
  for (; page <= 300; page++) {
    const chunk = await api(
      cookie,
      "/api/dashboard/get-filtered-usage-events",
      { ...window, page, pageSize }
    );
    if (page === 1) total = Number(chunk?.totalUsageEventsCount ?? 0);
    const events: any[] = chunk?.usageEventsDisplay ?? [];
    if (events.length === 0) break;
    requestCount += events.length;
    for (const ev of events) {
      const ts = Number(ev.timestamp ?? 0);
      if (ts > 0) {
        if (firstMs == null || ts < firstMs) firstMs = ts;
        if (lastMs == null || ts > lastMs) lastMs = ts;
        const d = toDateOnly(new Date(ts).toISOString());
        if (d) activeDates.add(d);
      }
    }
    onProgress?.(requestCount, total);
    if (requestCount >= total) break;
  }

  if (tokens === 0 && requestCount === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const msToDate = (ms: number | null) =>
    ms ? new Date(ms).toISOString().slice(0, 10) : today;

  return {
    source: {
      totalTokens: Math.round(tokens),
      totalCostUsd: Math.round(cents) / 100,
      requestCount,
      activeDays: activeDates.size,
      dateRange: { from: msToDate(firstMs), to: msToDate(lastMs) },
      models: [...models].sort().slice(0, 50),
    },
    activeDates,
    email,
  };
}
