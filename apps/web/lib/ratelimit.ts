import { createHash } from "node:crypto";

// Upstash-backed rate limiting when configured; otherwise an in-memory
// fallback (fine for local dev, resets on cold start in serverless).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const memory = new Map<string, number[]>();

let upstash: import("@upstash/ratelimit").Ratelimit | null | undefined;

async function getUpstash() {
  if (upstash !== undefined) return upstash;
  // Vercel Marketplace Upstash sets KV_REST_API_*; self-serve Upstash
  // dashboards usually set UPSTASH_REDIS_REST_*. Accept either.
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    upstash = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(MAX_PER_WINDOW, "1 h"),
      prefix: "aieracard",
    });
  } else {
    upstash = null;
  }
  return upstash;
}

export function hashIp(ip: string): string {
  const salt = process.env.SNAPSHOT_IP_SALT ?? "dev-salt";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}:${salt}:${day}`).digest("hex");
}

export async function checkRateLimit(ipHash: string): Promise<boolean> {
  const limiter = await getUpstash();
  if (limiter) {
    const { success } = await limiter.limit(ipHash);
    return success;
  }
  const now = Date.now();
  const hits = (memory.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return false;
  hits.push(now);
  memory.set(ipHash, hits);
  return true;
}
