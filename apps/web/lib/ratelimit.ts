import { createHash } from "node:crypto";
import type { Ratelimit } from "@upstash/ratelimit";

// Upstash-backed rate limiting when configured; otherwise an in-memory
// fallback (fine for local dev, resets on cold start in serverless).
// Two independent namespaces: snapshot minting (tight) and click tracking
// (generous) — so ordinary clicks can never consume a visitor's ability to
// mint a card.
const WINDOW_MS = 60 * 60 * 1000;
const SNAPSHOT_MAX = 5; // cards per IP-hash per hour
const TRACK_MAX = 120; // click events per IP-hash per hour

interface Namespace {
  prefix: string;
  max: number;
  memory: Map<string, number[]>;
  limiter?: Ratelimit | null;
}

const snapshotNs: Namespace = {
  prefix: "aieracard",
  max: SNAPSHOT_MAX,
  memory: new Map(),
};
const trackNs: Namespace = {
  prefix: "aieracard-track",
  max: TRACK_MAX,
  memory: new Map(),
};

async function getLimiter(ns: Namespace): Promise<Ratelimit | null> {
  if (ns.limiter !== undefined) return ns.limiter;
  // Vercel Marketplace Upstash sets KV_REST_API_*; self-serve Upstash
  // dashboards usually set UPSTASH_REDIS_REST_*. Accept either.
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    ns.limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(ns.max, "1 h"),
      prefix: ns.prefix,
    });
  } else {
    ns.limiter = null;
  }
  return ns.limiter;
}

export function hashIp(ip: string): string {
  const salt = process.env.SNAPSHOT_IP_SALT ?? "dev-salt";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}:${salt}:${day}`).digest("hex");
}

async function check(ns: Namespace, ipHash: string): Promise<boolean> {
  const limiter = await getLimiter(ns);
  if (limiter) {
    const { success } = await limiter.limit(ipHash);
    return success;
  }
  const now = Date.now();
  const hits = (ns.memory.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= ns.max) return false;
  hits.push(now);
  ns.memory.set(ipHash, hits);
  return true;
}

export function checkRateLimit(ipHash: string): Promise<boolean> {
  return check(snapshotNs, ipHash);
}

export function checkTrackRateLimit(ipHash: string): Promise<boolean> {
  return check(trackNs, ipHash);
}
