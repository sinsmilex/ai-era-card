import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { buildMosaic } from "@/lib/mosaic";
import { cardTheme as t } from "@/components/cardTheme";
import {
  appUrl,
  fmtMonthYear,
  fmtTokens,
  fmtUsd,
  warAndPeaceEquivalent,
} from "@/lib/format";

// Vertical 1080×1920 export for Instagram/TikTok Stories — platforms with
// no link unfurl at all, where a story-sized image is the only way in.
// Wrapped-style content is natively a Stories format.
export const runtime = "nodejs";

const SIZE = { width: 1080, height: 1920 };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) {
    return new Response("Not found", { status: 404 });
  }

  const p = rec.payload;
  const a = p.aggregate;
  const mosaic = buildMosaic(p, 48);
  const host = appUrl().replace(/^https?:\/\//, "");

  const metrics = [
    ...(a.totalCostUsd != null
      ? [{ v: fmtUsd(a.totalCostUsd), l: "compute spent" }]
      : []),
    { v: String(a.totalActiveDays), l: "active days" },
    { v: String(a.longestStreakDays), l: "day streak" },
    { v: String(a.distinctModels.length), l: "models used" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: t.bg,
          padding: "120px 88px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            letterSpacing: 6,
            color: t.muted,
          }}
        >
          AI ERA CARD{p.display.handle ? ` · ${p.display.handle}` : ""}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: 8 * 54,
            gap: 10,
            marginTop: 80,
          }}
        >
          {mosaic.map((c, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: c.color,
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 150,
            fontWeight: 700,
            color: t.text,
            lineHeight: 1,
            marginTop: 90,
          }}
        >
          {fmtTokens(a.totalTokens)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 42,
            color: t.muted,
            marginTop: 20,
          }}
        >
          tokens processed
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: t.muted,
            marginTop: 10,
          }}
        >
          since {fmtMonthYear(a.firstActivityDate)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: t.accent,
            marginTop: 24,
          }}
        >
          ~{warAndPeaceEquivalent(a.totalTokens)} copies of War and Peace
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 26,
            marginTop: 90,
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.l}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                background: t.panel,
                borderRadius: 20,
                padding: "34px 44px",
              }}
            >
              <div style={{ display: "flex", fontSize: 64, color: t.text }}>
                {m.v}
              </div>
              <div style={{ display: "flex", fontSize: 32, color: t.muted }}>
                {m.l}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
            fontSize: 36,
            color: t.link,
          }}
        >
          {host}
        </div>
      </div>
    ),
    SIZE
  );
}
