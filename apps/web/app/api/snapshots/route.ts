import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { snapshotPayloadSchema } from "@aieracard/schema";
import { getStore } from "@/lib/db";
import { checkRateLimit, hashIp } from "@/lib/ratelimit";
import { appUrl } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = hashIp(ip);

  if (!(await checkRateLimit(ipHash))) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = snapshotPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload failed validation", details: parsed.error.issues.slice(0, 5) },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (payload.aggregate.firstActivityDate > today) {
    return NextResponse.json(
      { error: "Activity dates cannot be in the future" },
      { status: 400 }
    );
  }

  const store = await getStore();
  let slug = nanoid(10);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await store.insert({
        slug,
        createdAt: new Date().toISOString(),
        payload,
        ipHash,
      });
      break;
    } catch (e) {
      if (attempt === 2) throw e;
      slug = nanoid(10); // unique-constraint collision — retry with a new slug
    }
  }

  return NextResponse.json(
    { slug, url: `${appUrl()}/s/${slug}` },
    { status: 201 }
  );
}
