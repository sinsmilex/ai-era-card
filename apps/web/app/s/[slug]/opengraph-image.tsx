import { ImageResponse } from "next/og";
import { getStore } from "@/lib/db";
import { buildMosaic } from "@/lib/mosaic";
import { eraMilestones, eraPalette, eraRank } from "@/lib/eraRank";
import {
  appUrl,
  fmtMonthYear,
  fmtTokens,
  fmtUsd,
  warAndPeaceEquivalent,
} from "@/lib/format";

// The OG image is the viral mechanic — Slack/X/Discord unfurl.
// Flexbox-only CSS (Satori). Shares eraRank + mosaic with StatsCard.
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);

  if (!rec) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#101418",
            color: "#8b949e",
            fontSize: 48,
          }}
        >
          Card not found
        </div>
      ),
      size
    );
  }

  const p = rec.payload;
  const a = p.aggregate;
  const palette = eraPalette(p);
  const rank = eraRank(p);
  const milestones = eraMilestones(p);
  const mosaic = buildMosaic(p, 70);
  const host = appUrl().replace(/^https?:\/\//, "");

  const metrics = [
    a.totalCostUsd != null
      ? { value: fmtUsd(a.totalCostUsd), label: "compute" }
      : { value: fmtTokens(a.totalTokens), label: "tokens" },
    { value: String(a.totalActiveDays), label: "active days" },
    { value: String(a.longestStreakDays), label: "streak" },
    { value: String(a.distinctModels.length), label: "models" },
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
          padding: "52px 64px",
          position: "relative",
          fontFamily: "monospace",
          color: palette.ink,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 40,
            top: 36,
            display: "flex",
            flexWrap: "wrap",
            width: 10 * 28,
            gap: 5,
            opacity: 0.95,
          }}
        >
          {mosaic.map((c, i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: c.color,
                display: "flex",
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              color: palette.muted,
            }}
          >
            AI ERA CARD
            {p.display.handle ? ` · ${p.display.handle}` : ""}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 2,
              color: palette.bg,
              background: palette.accent,
              borderRadius: 999,
              padding: "8px 18px",
              fontWeight: 700,
            }}
          >
            {rank.title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 118,
            fontWeight: 700,
            color: palette.ink,
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          {fmtTokens(a.totalTokens)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: palette.muted,
            marginTop: 14,
          }}
        >
          tokens · since {fmtMonthYear(a.firstActivityDate)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: palette.accent,
            marginTop: 8,
            marginBottom: 32,
          }}
        >
          ~{warAndPeaceEquivalent(a.totalTokens)}× War and Peace
          {milestones[0] ? ` · ${milestones[0].label}` : ""}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: palette.panel,
                borderRadius: 14,
                padding: "18px 24px",
                width: 230,
                border: `1px solid ${palette.accentSoft}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  color: palette.ink,
                  fontWeight: 600,
                }}
              >
                {m.value}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: palette.muted,
                  marginTop: 4,
                }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "auto",
            fontSize: 22,
            color: palette.muted,
          }}
        >
          <div style={{ display: "flex" }}>
            {milestones
              .slice(0, 3)
              .map((m) => m.label)
              .join(" · ")}
          </div>
          <div style={{ display: "flex", color: palette.accent }}>
            {host}/s/{slug}
          </div>
        </div>
      </div>
    ),
    size
  );
}
