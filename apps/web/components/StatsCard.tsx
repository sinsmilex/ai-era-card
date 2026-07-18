import type { SnapshotPayload } from "@aieracard/schema";
import { buildMosaic } from "@/lib/mosaic";
import { eraMilestones, eraPalette, eraRank } from "@/lib/eraRank";
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
  const palette = eraPalette(payload);
  const rank = eraRank(payload);
  const milestones = eraMilestones(payload);
  const mosaic = buildMosaic(payload, 60);
  const sources = sourceLabels(payload);

  const metrics: Array<{ value: string; label: string }> = [
    a.totalCostUsd != null
      ? { value: fmtUsd(a.totalCostUsd), label: "compute" }
      : { value: fmtTokens(a.totalTokens), label: "tokens" },
    { value: String(a.totalActiveDays), label: "active days" },
    { value: String(a.longestStreakDays), label: "streak" },
    { value: String(a.distinctModels.length), label: "models" },
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 680,
        background: palette.bg,
        borderRadius: 20,
        padding: "32px 36px 28px",
        position: "relative",
        overflow: "hidden",
        fontFamily:
          "var(--font-card-mono, 'JetBrains Mono'), ui-monospace, monospace",
        boxShadow: `0 0 0 1px ${palette.accentSoft}, 0 24px 80px ${palette.glow}`,
        color: palette.ink,
      }}
    >
      {/* Territory field */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.55,
          background: `radial-gradient(ellipse 80% 60% at 85% 15%, ${palette.glow}, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: -8,
          top: -8,
          display: "grid",
          gridTemplateColumns: "repeat(10, 14px)",
          gap: 4,
          opacity: 0.9,
          transform: "rotate(-2deg)",
        }}
      >
        {mosaic.map((c, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              background: c.color,
            }}
          />
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: 2.5,
              color: palette.muted,
            }}
          >
            AI ERA CARD
            {payload.display.handle ? ` · ${payload.display.handle}` : ""}
          </span>
          <span
            style={{
              fontSize: 11,
              letterSpacing: 1.5,
              color: palette.bg,
              background: palette.accent,
              borderRadius: 999,
              padding: "5px 12px",
              fontWeight: 600,
            }}
          >
            {rank.title}
          </span>
        </div>

        <div
          style={{
            fontSize: "clamp(48px, 10vw, 72px)",
            fontWeight: 600,
            letterSpacing: -2,
            lineHeight: 0.95,
            color: palette.ink,
          }}
        >
          {fmtTokens(a.totalTokens)}
        </div>
        <div
          style={{
            fontSize: 15,
            color: palette.muted,
            marginTop: 10,
          }}
        >
          tokens · since {fmtMonthYear(a.firstActivityDate)}
        </div>
        <div
          style={{
            fontSize: 14,
            color: palette.accent,
            marginTop: 6,
            marginBottom: 28,
          }}
        >
          ≈ {warAndPeaceEquivalent(a.totalTokens).toLocaleString("en-US")}{" "}
          copies of War and Peace
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
                background: palette.panel,
                borderRadius: 10,
                padding: "12px 14px",
                border: `1px solid ${palette.accentSoft}`,
              }}
            >
              <div style={{ fontSize: 20, color: palette.ink, fontWeight: 500 }}>
                {m.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: palette.muted,
                  marginTop: 3,
                  letterSpacing: 0.3,
                }}
              >
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {milestones.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {milestones.map((m) => (
              <span
                key={m.id}
                style={{
                  fontSize: 11,
                  color: palette.accent,
                  background: palette.accentSoft,
                  borderRadius: 999,
                  padding: "5px 11px",
                  letterSpacing: 0.2,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sources.map((label) => (
              <span
                key={label}
                style={{
                  fontSize: 11,
                  color: palette.ink,
                  background: palette.panel,
                  border: `1px solid ${palette.accentSoft}`,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: palette.muted }}>
            {host}/s/{slug}
          </span>
        </div>

        {rank.nextLabel && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: `1px solid ${palette.accentSoft}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: palette.muted,
                marginBottom: 6,
              }}
            >
              <span>Next rank</span>
              <span>{rank.nextLabel}</span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: palette.accentSoft,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.round(rank.progressToNext * 100)}%`,
                  height: "100%",
                  background: palette.accent,
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        )}

        {payload.sources.openrouter && (
          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: palette.muted,
              lineHeight: 1.45,
            }}
          >
            OpenRouter tokens are last 30 days. All-time OpenRouter spend
            {payload.sources.openrouter.totalCostUsd != null
              ? ` ($${payload.sources.openrouter.totalCostUsd})`
              : ""}{" "}
            is not included in compute above.
          </div>
        )}
      </div>
    </div>
  );
}
