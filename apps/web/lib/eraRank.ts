import type { SnapshotPayload } from "@aieracard/schema";
import { fmtTokens, fmtUsd } from "./format";

// Status bands earned from real aggregates — not XP, quests, or daily login.
// Same payload → same rank forever (deterministic, no accounts).

export interface EraRank {
  level: number;
  name: string;
  /** Short flex line for OG / share text */
  title: string;
  nextLabel: string | null;
  progressToNext: number; // 0..1 within current band toward next
}

export interface EraMilestone {
  id: string;
  label: string;
}

export interface EraPalette {
  id: string;
  bg: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  glow: string;
  mosaicActive: string[];
  mosaicIdle: string[];
}

// All-time context tokens, including cache tokens when a source reports them.
// These intentionally broad, roughly logarithmic bands leave room for agent
// workflows to grow without turning today's heavy users into the final tier.
const RANKS: Array<{ level: number; name: string; minTokens: number }> = [
  { level: 1, name: "Foundation", minTokens: 0 },
  { level: 2, name: "Studio", minTokens: 25_000_000 },
  { level: 3, name: "Foundry", minTokens: 150_000_000 },
  { level: 4, name: "Tower", minTokens: 750_000_000 },
  { level: 5, name: "Citadel", minTokens: 2_500_000_000 },
  { level: 6, name: "Arcology", minTokens: 7_500_000_000 },
  { level: 7, name: "Landmark", minTokens: 20_000_000_000 },
  { level: 8, name: "Apex", minTokens: 100_000_000_000 },
];

const PALETTES: EraPalette[] = [
  {
    id: "tide",
    bg: "#0c1214",
    panel: "#141c1f",
    ink: "#e8f0f2",
    muted: "#8aa0a8",
    accent: "#3dcaa4",
    accentSoft: "#1a3d34",
    glow: "rgba(61, 202, 164, 0.22)",
    mosaicActive: ["#1D9E75", "#5DCAA5", "#2dd4a8", "#0f766e"],
    mosaicIdle: ["#1a2226", "#243036"],
  },
  {
    id: "ember",
    bg: "#120e0c",
    panel: "#1c1612",
    ink: "#f3ebe3",
    muted: "#a89888",
    accent: "#e8a35c",
    accentSoft: "#3d2a18",
    glow: "rgba(232, 163, 92, 0.2)",
    mosaicActive: ["#c4783a", "#e8a35c", "#f0c080", "#9a5520"],
    mosaicIdle: ["#221a14", "#2e241c"],
  },
  {
    id: "signal",
    bg: "#0e1018",
    panel: "#161a26",
    ink: "#e8eaf2",
    muted: "#8b93a8",
    accent: "#7c8cff",
    accentSoft: "#222848",
    glow: "rgba(124, 140, 255, 0.22)",
    mosaicActive: ["#534AB7", "#7F77DD", "#7c8cff", "#a5b0ff"],
    mosaicIdle: ["#1a1e2a", "#252a3a"],
  },
  {
    id: "forge",
    bg: "#100f12",
    panel: "#1a181e",
    ink: "#f0e8f2",
    muted: "#9a8fa0",
    accent: "#d478a8",
    accentSoft: "#3a2030",
    glow: "rgba(212, 120, 168, 0.2)",
    mosaicActive: ["#b85a8a", "#d478a8", "#e8a0c4", "#8a3d68"],
    mosaicIdle: ["#221c22", "#2e2630"],
  },
];

function seedFromPayload(p: SnapshotPayload): number {
  const a = p.aggregate;
  return (
    ((a.totalTokens % 1_000_003) * 31 +
      a.totalActiveDays * 7 +
      a.distinctModels.length * 131 +
      a.longestStreakDays * 17) >>>
    0
  );
}

export function eraPalette(payload: SnapshotPayload): EraPalette {
  return PALETTES[seedFromPayload(payload) % PALETTES.length];
}

export function eraRank(payload: SnapshotPayload): EraRank {
  const tokens = payload.aggregate.totalTokens;
  let current = RANKS[0];
  let next: (typeof RANKS)[number] | null = RANKS[1] ?? null;
  for (let i = 0; i < RANKS.length; i++) {
    if (tokens >= RANKS[i].minTokens) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  let progressToNext = 1;
  if (next) {
    const span = next.minTokens - current.minTokens;
    progressToNext = Math.min(
      1,
      Math.max(0, (tokens - current.minTokens) / span)
    );
  }
  return {
    level: current.level,
    name: current.name,
    title: `L${current.level} · ${current.name.toUpperCase()}`,
    nextLabel: next
      ? `${fmtCompact(next.minTokens)} → ${next.name}`
      : null,
    progressToNext,
  };
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return n / 1_000_000_000 + "B";
  if (n >= 1_000_000) return n / 1_000_000 + "M";
  return String(n);
}

// Whole days between two YYYY-MM-DD dates, inclusive of both endpoints.
function daysInclusive(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.floor(ms / 86_400_000) + 1;
}

// Full calendar years elapsed from `from` to `to` (both YYYY-MM-DD).
function fullYearsBetween(from: string, to: string): number {
  if (to < from) return 0;
  const years = Number(to.slice(0, 4)) - Number(from.slice(0, 4));
  return to.slice(5) >= from.slice(5) ? years : years - 1;
}

// Every badge is a fact earned from real aggregates — no XP, no locked
// slots, no participation trophies. Returned in priority order (rarest /
// most impressive first): callers that can only fit a few (OG image,
// story) take the head of the list; the card page shows them all.
// Dates compare against payload.generatedAt, never the clock, so the same
// payload renders the same badges forever.
export function eraMilestones(payload: SnapshotPayload): EraMilestone[] {
  const a = payload.aggregate;
  const cc = payload.sources.claudeCode;
  const cx = payload.sources.codex;
  const sources = [
    payload.sources.claudeCode,
    payload.sources.codex,
    payload.sources.cursor,
    payload.sources.openrouter,
  ].filter(Boolean).length;
  const out: EraMilestone[] = [];

  // Token volume — highest crossed tier only.
  if (a.totalTokens >= 100_000_000_000)
    out.push({ id: "100b", label: "100B tokens" });
  else if (a.totalTokens >= 20_000_000_000)
    out.push({ id: "20b", label: "20B tokens club" });
  else if (a.totalTokens >= 2_500_000_000)
    out.push({ id: "2-5b", label: "2.5B tokens" });
  else if (a.totalTokens >= 1_000_000_000)
    out.push({ id: "1b", label: "1B tokens club" });
  else if (a.totalTokens >= 100_000_000)
    out.push({ id: "100m", label: "100M tokens" });
  else if (a.totalTokens >= 10_000_000)
    out.push({ id: "10m", label: "10M tokens" });

  // Tenure in the era.
  const years = fullYearsBetween(a.firstActivityDate, payload.generatedAt);
  if (years >= 3) out.push({ id: "era3y", label: "3+ years in the era" });
  else if (years >= 2) out.push({ id: "era2y", label: "2+ years in the era" });
  else if (years >= 1) out.push({ id: "era1y", label: "1+ year in the era" });

  if (a.longestStreakDays >= 100)
    out.push({ id: "streak100", label: "100-day streak" });
  else if (a.longestStreakDays >= 30)
    out.push({ id: "streak30", label: "30-day streak" });

  if (a.totalActiveDays >= 500)
    out.push({ id: "500d", label: "500 active days" });
  else if (a.totalActiveDays >= 365)
    out.push({ id: "365d", label: "365 active days" });
  else if (a.totalActiveDays >= 100)
    out.push({ id: "100d", label: "100 active days" });

  // Daily density — needs a real baseline of days to be honest.
  if (a.totalActiveDays >= 10) {
    const perDay = a.totalTokens / a.totalActiveDays;
    if (perDay >= 20_000_000)
      out.push({ id: "daily20m", label: "20M+ tokens/day" });
    else if (perDay >= 5_000_000)
      out.push({ id: "daily5m", label: "5M+ tokens/day" });
  }

  // Consistency: active on most days since day one.
  const span = daysInclusive(a.firstActivityDate, a.lastActivityDate);
  if (span >= 60 && a.totalActiveDays / span >= 0.8)
    out.push({ id: "consistent80", label: "Active 80% of days" });

  // Cache efficiency — only local-log sources report cache reads.
  const cacheRead = (cc?.cacheReadTokens ?? 0) + (cx?.cacheReadTokens ?? 0);
  const cacheBase = (cc?.totalTokens ?? 0) + (cx?.totalTokens ?? 0);
  if (cacheBase >= 100_000_000 && cacheRead / cacheBase >= 0.9)
    out.push({ id: "cache90", label: "90% cache-efficient" });

  const sessions = (cc?.sessionCount ?? 0) + (cx?.sessionCount ?? 0);
  if (sessions >= 10_000)
    out.push({ id: "sessions10k", label: "10k sessions" });
  else if (sessions >= 1_000)
    out.push({ id: "sessions1k", label: "1,000 sessions" });

  if (a.distinctModels.length >= 20)
    out.push({ id: "models20", label: "20+ models" });
  else if (a.distinctModels.length >= 10)
    out.push({ id: "models10", label: "10+ models" });

  // Builds with models from more than one provider.
  const hasClaude = a.distinctModels.some((m) => /claude/i.test(m));
  const hasOpenAI = a.distinctModels.some((m) =>
    /^(gpt|o\d|codex|chatgpt)/i.test(m)
  );
  if (hasClaude && hasOpenAI)
    out.push({ id: "xprovider", label: "Cross-provider" });

  if (sources >= 4) out.push({ id: "sources4", label: "All 4 sources" });
  else if (sources >= 3) out.push({ id: "sources3", label: "3 tools" });
  else if (sources >= 2) out.push({ id: "multi", label: "Multi-tool" });

  if (cc && cc.projectCount >= 25)
    out.push({ id: "projects25", label: "25+ projects" });
  else if (cc && cc.projectCount >= 10)
    out.push({ id: "projects10", label: "10+ projects" });

  if (cx && cx.reasoningTokens >= 100_000_000)
    out.push({ id: "reasoning100m", label: "100M reasoning tokens" });

  if (a.totalCostUsd != null && a.totalCostUsd >= 5_000)
    out.push({ id: "spend5k", label: "$5k+ compute" });
  else if (a.totalCostUsd != null && a.totalCostUsd >= 500)
    out.push({ id: "spend500", label: "$500+ compute" });

  return out;
}

export function shareLine(payload: SnapshotPayload, url: string): string {
  const rank = eraRank(payload);
  const a = payload.aggregate;
  const tokens =
    a.totalTokens >= 1_000_000_000
      ? (a.totalTokens / 1_000_000_000).toFixed(1) + "B"
      : a.totalTokens >= 1_000_000
        ? (a.totalTokens / 1_000_000).toFixed(1) + "M"
        : String(a.totalTokens);
  const who = payload.display.handle ? `${payload.display.handle} · ` : "";
  return `${who}${rank.title} — ${tokens} tokens in the AI era. ${url}`;
}

export function linkedInShareLine(payload: SnapshotPayload, url: string): string {
  const rank = eraRank(payload);
  const a = payload.aggregate;
  const who = payload.display.handle ? `${payload.display.handle}'s ` : "";
  const compute =
    a.totalCostUsd != null ? ` · ${fmtUsd(a.totalCostUsd)} compute` : "";

  return `${who}AI usage snapshot: ${rank.title} · ${fmtTokens(a.totalTokens)} tokens across ${a.totalActiveDays} active days${compute}.

Self-reported aggregate data, not a game score.
${url}`;
}
