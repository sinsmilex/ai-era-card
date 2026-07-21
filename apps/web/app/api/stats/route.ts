import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";

// Internal launch metrics (Gate 0 in docs/ROADMAP.md). Not a product
// dashboard — a founder-only endpoint.
// Auth: Bearer STATS_SECRET (falls back to SNAPSHOT_IP_SALT so no new env
// var is required to ship; set a dedicated STATS_SECRET when convenient).
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret =
    process.env.STATS_SECRET ??
    process.env.SNAPSHOT_IP_SALT ??
    (process.env.NODE_ENV !== "production" ? "dev-salt" : undefined);
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const store = await getStore();
  return NextResponse.json(await store.getStats());
}
