"use client";

import { useState } from "react";
import type { SnapshotPayload } from "@aieracard/schema";
import { buildingBounds, buildBuilding } from "@/lib/mosaic";
import { eraMilestones, eraPalette, eraRank } from "@/lib/eraRank";
import {
  presentSources,
  tokenShares,
  type SourceKey,
} from "@/lib/sourceStats";
import {
  fmtMonthYear,
  fmtTokens,
  fmtUsd,
  warAndPeaceEquivalent,
} from "@/lib/format";

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
  const building = buildBuilding(payload);
  const buildingBoundary = buildingBounds(building);

  // Interactive source filter: click a source chip to view that source
  // alone; click again (or "All") to return to the aggregate.
  const [selected, setSelected] = useState<SourceKey | null>(null);
  const views = presentSources(payload);
  const shares = tokenShares(payload);
  const view = selected ? views.find((v) => v.key === selected) ?? null : null;

  const shownTokens = view ? view.tokens : a.totalTokens;
  const shownFirstDate = view ? view.firstDate : a.firstActivityDate;

  const metrics: Array<{ value: string; label: string }> = view
    ? [
        view.costUsd != null
          ? { value: fmtUsd(view.costUsd), label: "compute" }
          : {
              value: view.tokens != null ? fmtTokens(view.tokens) : "—",
              label: "tokens",
            },
        { value: String(view.activeDays), label: "active days" },
        view.streak != null
          ? { value: String(view.streak), label: "streak" }
          : {
              value: view.requests != null ? String(view.requests) : "—",
              label: "requests",
            },
        { value: String(view.models.length), label: "models" },
      ]
    : [
        a.totalCostUsd != null
          ? { value: fmtUsd(a.totalCostUsd), label: "compute" }
          : { value: fmtTokens(a.totalTokens), label: "tokens" },
        { value: String(a.totalActiveDays), label: "active days" },
        { value: String(a.longestStreakDays), label: "streak" },
        { value: String(a.distinctModels.length), label: "models" },
      ];

  // Per-source colors for chips + breakdown bar (stable by source order).
  const sourceColor = (key: SourceKey) => {
    const i = views.findIndex((v) => v.key === key);
    return palette.mosaicActive[i % palette.mosaicActive.length];
  };

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
      {/* Deterministic personal territory landmark. */}
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
          right: 36,
          top: 32,
          opacity: 0.9,
        }}
      >
        {building.map((block, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (block.x - buildingBoundary.maxX) * 18 - 14,
              top: (block.y - buildingBoundary.minY) * 18,
              width: 14,
              height: 14,
              borderRadius: 3,
              background: block.color,
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
              background: view ? sourceColor(view.key) : palette.accent,
              borderRadius: 999,
              padding: "5px 12px",
              fontWeight: 600,
            }}
          >
            {view ? `${view.label} only` : rank.title}
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
          {shownTokens != null ? fmtTokens(shownTokens) : "—"}
        </div>
        <div
          style={{
            fontSize: 15,
            color: palette.muted,
            marginTop: 10,
          }}
        >
          tokens
          {view ? ` · ${view.label}` : ""}
          {shownFirstDate ? ` · since ${fmtMonthYear(shownFirstDate)}` : ""}
        </div>
        <div
          style={{
            fontSize: 14,
            color: palette.accent,
            marginTop: 6,
            marginBottom: 28,
            minHeight: 18,
          }}
        >
          {shownTokens != null && shownTokens > 0
            ? `≈ ${warAndPeaceEquivalent(shownTokens).toLocaleString("en-US")} copies of War and Peace`
            : view
              ? "Token count not reported by this source."
              : ""}
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

        {!view && milestones.length > 0 && (
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

        {/* In-card source breakdown: stacked token-share bar + interactive
            chips. Clicking a chip filters the whole card to that source. */}
        {views.length > 1 && (
          <div
            aria-hidden
            style={{
              display: "flex",
              height: 5,
              borderRadius: 99,
              overflow: "hidden",
              background: palette.accentSoft,
              marginBottom: 10,
            }}
          >
            {shares.map((s) => (
              <div
                key={s.key}
                style={{
                  width: `${Math.max(s.share * 100, s.tokens > 0 ? 2 : 0)}%`,
                  background: sourceColor(s.key),
                  opacity: selected && selected !== s.key ? 0.25 : 1,
                }}
              />
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
            {views.map((v) => {
              const isActive = selected === v.key;
              const share = shares.find((s) => s.key === v.key);
              const canFilter = views.length > 1;
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    canFilter && setSelected(isActive ? null : v.key)
                  }
                  style={{
                    fontSize: 11,
                    fontFamily: "inherit",
                    color: isActive ? palette.bg : palette.ink,
                    background: isActive ? sourceColor(v.key) : palette.panel,
                    border: `1px solid ${
                      isActive ? sourceColor(v.key) : palette.accentSoft
                    }`,
                    borderRadius: 999,
                    padding: "4px 10px",
                    cursor: canFilter ? "pointer" : "default",
                    opacity: selected && !isActive ? 0.55 : 1,
                  }}
                >
                  {v.label}
                  {share && share.tokens > 0
                    ? ` · ${Math.round(share.share * 100)}%`
                    : ""}
                </button>
              );
            })}
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 11,
                  fontFamily: "inherit",
                  color: palette.muted,
                  background: "transparent",
                  border: `1px dashed ${palette.accentSoft}`,
                  borderRadius: 999,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                ← all sources
              </button>
            )}
          </div>
          <span style={{ fontSize: 12, color: palette.muted }}>
            {host}/s/{slug}
          </span>
        </div>

        {!view && rank.nextLabel && (
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

        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: palette.muted,
          }}
        >
          Self-reported · not a game score
        </div>

        {view?.note && (
          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              color: palette.muted,
              lineHeight: 1.45,
            }}
          >
            {view.note}
          </div>
        )}
        {!view && payload.sources.openrouter && (
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
