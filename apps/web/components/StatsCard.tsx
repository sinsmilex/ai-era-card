import type { SnapshotPayload } from "@aieracard/schema";
import { cardTheme as t } from "./cardTheme";
import { buildMosaic } from "@/lib/mosaic";
import {
  fmtMonthYear,
  fmtTokens,
  fmtUsd,
  warAndPeaceEquivalent,
} from "@/lib/format";

export function sourceLabels(p: SnapshotPayload): string[] {
  const labels: string[] = [];
  if (p.sources.claudeCode) labels.push("Claude Code");
  if (p.sources.codex) labels.push("Codex");
  if (p.sources.cursor) labels.push("Cursor");
  if (p.sources.openrouter) labels.push("OpenRouter");
  return labels;
}

export function StatsCard({
  payload,
  slug,
  host,
}: {
  payload: SnapshotPayload;
  slug: string;
  host: string;
}) {
  const a = payload.aggregate;
  const mosaic = buildMosaic(payload);
  const topModels = a.distinctModels.slice(0, 2);
  const moreModels = a.distinctModels.length - topModels.length;

  const metrics: Array<{ value: string; label: string }> = [
    a.totalCostUsd != null
      ? { value: fmtUsd(a.totalCostUsd), label: "compute spent" }
      : { value: fmtTokens(a.totalTokens), label: "tokens total" },
    { value: String(a.totalActiveDays), label: "active days" },
    { value: String(a.longestStreakDays), label: "day streak" },
    { value: String(a.distinctModels.length), label: "models used" },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        background: t.bg,
        borderRadius: t.radius,
        padding: "28px 32px",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 24,
          top: 24,
          display: "grid",
          gridTemplateColumns: "repeat(8, 10px)",
          gap: 3,
        }}
        aria-hidden
      >
        {mosaic.map((c, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: c.color,
            }}
          />
        ))}
      </div>

      <div
        style={{
          fontFamily: t.mono,
          fontSize: 12,
          letterSpacing: 2,
          color: t.muted,
          marginBottom: 22,
        }}
      >
        AI ERA CARD
        {payload.display.handle ? ` · ${payload.display.handle}` : ""}
      </div>

      <div
        style={{
          fontFamily: t.mono,
          fontSize: 46,
          fontWeight: 500,
          color: t.text,
          letterSpacing: -1,
        }}
      >
        {fmtTokens(a.totalTokens)}
      </div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 6 }}>
        tokens processed · since {fmtMonthYear(a.firstActivityDate)}
      </div>
      <div style={{ fontSize: 13, color: t.accent, marginBottom: 24 }}>
        ≈ {warAndPeaceEquivalent(a.totalTokens)} copies of War and Peace
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: t.panel,
              borderRadius: t.panelRadius,
              padding: "10px 12px",
            }}
          >
            <div
              style={{ fontFamily: t.mono, fontSize: 18, color: t.text }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {sourceLabels(payload).map((label) => (
            <span
              key={label}
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: t.accent,
                background: t.chipBg,
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              {label}
            </span>
          ))}
          {topModels.map((m) => (
            <span
              key={m}
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: t.chipText,
                background: t.chipBg,
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              {m}
            </span>
          ))}
          {moreModels > 0 && (
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: t.chipText,
                background: t.chipBg,
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              +{moreModels}
            </span>
          )}
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 12, color: t.link }}>
          {host}/s/{slug}
        </span>
      </div>

      {payload.sources.openrouter && (
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: t.muted,
            lineHeight: 1.45,
          }}
        >
          OpenRouter tokens are last 30 days. All-time OpenRouter spend
          {payload.sources.openrouter.totalCostUsd != null
            ? ` ($${payload.sources.openrouter.totalCostUsd})`
            : ""}{" "}
          is not included in compute spent above.
        </div>
      )}
    </div>
  );
}
