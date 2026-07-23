import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { checkTrackRateLimit, hashIp } from "@/lib/ratelimit";
import { classifyUa, refererHost } from "@/lib/track";
import { parseTrackEvent } from "@/lib/trackEvent";

export const runtime = "nodejs";

// Client-side conversion events (card CTA / command copy / preview click).
// PII-free by construction: no IP is stored (the daily hash is computed
// transiently only to rate-limit), referer is host-only, UA is a coarse
// class. See lib/trackEvent.ts for the validation contract (strict kind,
// normalized slug).
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkTrackRateLimit(hashIp(ip)))) {
    return new NextResponse(null, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const event = parseTrackEvent(body);
  if (!event) {
    return new NextResponse(null, { status: 400 });
  }

  const store = await getStore();
  await store.recordEvent({
    slug: event.slug,
    surface: event.kind,
    refererHost: refererHost(req.headers.get("referer")),
    uaClass: classifyUa(req.headers.get("user-agent")),
  });

  return new NextResponse(null, { status: 204 });
}
