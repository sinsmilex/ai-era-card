import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { buildBuilding, buildingBounds } from "@/lib/mosaic";
import { eraMilestones, eraPalette, eraRank } from "@/lib/eraRank";
import {
  appUrl,
  fmtMonthYear,
  fmtTokens,
  fmtUsd,
  warAndPeaceEquivalent,
} from "@/lib/format";

// Vertical 1080×1920 export for Instagram/TikTok Stories — platforms with
// no link unfurl at all, where a story-sized image is the only way in.
// Shares rank/palette/territory building with the card and OG image.
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
  const palette = eraPalette(p);
  const rank = eraRank(p);
  const milestones = eraMilestones(p);
  const blocks = buildBuilding(p);
  const bounds = buildingBounds(blocks);
  const host = appUrl().replace(/^https?:\/\//, "");

  const CELL = 52;
  const buildingW = (bounds.maxX - bounds.minX + 1) * CELL;
  const buildingH = (bounds.maxY - bounds.minY + 1) * CELL;

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
          background: palette.bg,
          padding: "110px 88px 90px",
          fontFamily: "monospace",
          color: palette.ink,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 32,
              letterSpacing: 6,
              color: palette.muted,
            }}
          >
            AI ERA CARD{p.display.handle ? ` · ${p.display.handle}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 2,
              color: palette.bg,
              background: palette.accent,
              borderRadius: 999,
              padding: "10px 24px",
              fontWeight: 700,
            }}
          >
            {rank.title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            position: "relative",
            width: buildingW,
            height: buildingH,
            marginTop: 70,
          }}
        >
          {blocks.map((bl, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (bl.x - bounds.minX) * CELL,
                top: (bl.y - bounds.minY) * CELL,
                width: CELL - 8,
                height: CELL - 8,
                borderRadius: 9,
                background: bl.color,
                display: "flex",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 148,
            fontWeight: 700,
            lineHeight: 1,
            marginTop: 70,
            letterSpacing: -4,
          }}
        >
          {fmtTokens(a.totalTokens)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            color: palette.muted,
            marginTop: 18,
          }}
        >
          tokens · since {fmtMonthYear(a.firstActivityDate)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 33,
            color: palette.accent,
            marginTop: 14,
          }}
        >
          ~{warAndPeaceEquivalent(a.totalTokens)}× War and Peace
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            marginTop: 70,
          }}
        >
          {metrics.map((m) => (
            <div
              key={m.l}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                background: palette.panel,
                borderRadius: 20,
                padding: "30px 44px",
                border: `1px solid ${palette.accentSoft}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 60 }}>{m.v}</div>
              <div style={{ display: "flex", fontSize: 30, color: palette.muted }}>
                {m.l}
              </div>
            </div>
          ))}
        </div>

        {milestones.length > 0 && (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: palette.muted,
              marginTop: 56,
            }}
          >
            {milestones
              .slice(0, 3)
              .map((m) => m.label)
              .join(" · ")}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
            fontSize: 36,
            color: palette.accent,
          }}
        >
          {host}
        </div>
      </div>
    ),
    SIZE
  );
}
