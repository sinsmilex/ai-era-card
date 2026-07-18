import { ImageResponse } from "next/og";
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

// The OG image is the viral mechanic — this is what Slack/X/Discord render.
// Satori supports a CSS subset (flexbox only, no grid), so this is a second,
// simplified implementation of StatsCard sharing cardTheme.
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
            background: t.bg,
            color: t.muted,
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
  const mosaic = buildMosaic(p, 40);
  const host = appUrl().replace(/^https?:\/\//, "");

  const metrics = [
    a.totalCostUsd != null
      ? { value: fmtUsd(a.totalCostUsd), label: "compute spent" }
      : { value: fmtTokens(a.totalTokens), label: "tokens total" },
    { value: String(a.totalActiveDays), label: "active days" },
    { value: String(a.longestStreakDays), label: "day streak" },
    { value: String(a.distinctModels.length), label: "models used" },
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
          padding: "56px 72px",
          position: "relative",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 56,
            display: "flex",
            flexWrap: "wrap",
            width: 8 * 26,
            gap: 6,
          }}
        >
          {mosaic.map((c, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: c.color,
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 4,
            color: t.muted,
            marginBottom: 28,
          }}
        >
          AI ERA CARD{p.display.handle ? ` · ${p.display.handle}` : ""}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 110,
            fontWeight: 700,
            color: t.text,
            lineHeight: 1,
          }}
        >
          {fmtTokens(a.totalTokens)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: t.muted,
            marginTop: 12,
          }}
        >
          tokens processed · since {fmtMonthYear(a.firstActivityDate)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: t.accent,
            marginTop: 8,
            marginBottom: 40,
          }}
        >
          ~{warAndPeaceEquivalent(a.totalTokens)} copies of War and Peace
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {metrics.map((m) => (
            <div
              key={m.label}
              style={{
                display: "flex",
                flexDirection: "column",
                background: t.panel,
                borderRadius: 14,
                padding: "20px 28px",
                width: 240,
              }}
            >
              <div style={{ display: "flex", fontSize: 40, color: t.text }}>
                {m.value}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 20,
                  color: t.muted,
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
            fontSize: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              color: t.chipText,
              maxWidth: 640,
              overflow: "hidden",
            }}
          >
            {a.distinctModels.slice(0, 2).join(" · ")}
            {a.distinctModels.length > 2
              ? ` +${a.distinctModels.length - 2}`
              : ""}
          </div>
          <div style={{ display: "flex", color: t.link }}>
            {host}/s/{slug}
          </div>
        </div>
      </div>
    ),
    size
  );
}
