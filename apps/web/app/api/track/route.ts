import { NextRequest, NextResponse } from "next/server";
import { getStore, type ClientEventKind } from "@/lib/db";
import { checkTrackRateLimit, hashIp } from "@/lib/ratelimit";
import { classifyUa, refererHost } from "@/lib/track";

export const runtime = "nodejs";

// Client-side conversion events (homepage CTA / command copy / preview
// click). PII-free by construction: no IP is stored (the daily hash is
// computed transiently only to rate-limit), referer is host-only, UA is a
// coarse class. Strictly validated: only the three literal kinds, and a
// slug only for preview_click, constrained to the fixed example.
const KINDS: ClientEventKind[] = ["card_cta", "command_copy", "preview_click"];
const EXAMPLE_SLUG = "mmi5GrqvJt";

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

  const kind = (body as { kind?: unknown })?.kind;
  if (typeof kind !== "string" || !KINDS.includes(kind as ClientEventKind)) {
    return new NextResponse(null, { status: 400 });
  }

  // Only preview_click may carry a slug, and only the fixed example one.
  const rawSlug = (body as { slug?: unknown })?.slug;
  const slug =
    kind === "preview_click" && rawSlug === EXAMPLE_SLUG ? EXAMPLE_SLUG : null;

  const store = await getStore();
  await store.recordEvent({
    slug,
    surface: kind as ClientEventKind,
    refererHost: refererHost(req.headers.get("referer")),
    uaClass: classifyUa(req.headers.get("user-agent")),
  });

  return new NextResponse(null, { status: 204 });
}
