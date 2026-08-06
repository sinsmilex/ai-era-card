import { ERA_RANKS, type SnapshotPayload } from "@aieracard/schema";
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
// The band table itself lives in @aieracard/schema (ERA_RANKS) — the one
// canonical ladder shared with the CLI card and the share caption.
const RANKS = ERA_RANKS;

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
    title: `TIER${current.level} · ${current.name.toUpperCase()}`,
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

// Every badge is a fact earned from real aggregates — no XP, no locked
// slots, no participation trophies. Each badge carries an explicit rarity
// weight and the result is sorted rarest-first: callers that can only fit
// a few (OG image, story) take the head of the list; the card page shows
// them all. Push order is NOT the priority — only the weight is, so adding
// a badge mid-function can't silently reshuffle existing cards' OG images.
// No tenure badge: the card's own "since <month year>" line already says
// it, and a floor-years label ("1+ year") reads wrong next to it.
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
  const out: Array<EraMilestone & { weight: number }> = [];
  const add = (weight: number, id: string, label: string) =>
    out.push({ weight, id, label });

  // Token volume — highest crossed tier only. Top tiers outrank everything;
  // the low entry tiers rank below rare non-volume badges on purpose.
  if (a.totalTokens >= 100_000_000_000) add(100, "100b", "100B tokens");
  else if (a.totalTokens >= 20_000_000_000) add(95, "20b", "20B tokens club");
  else if (a.totalTokens >= 2_500_000_000) add(85, "2-5b", "2.5B tokens");
  else if (a.totalTokens >= 1_000_000_000) add(80, "1b", "1B tokens club");
  else if (a.totalTokens >= 100_000_000) add(40, "100m", "100M tokens");
  else if (a.totalTokens >= 10_000_000) add(10, "10m", "10M tokens");

  if (a.longestStreakDays >= 100) add(75, "streak100", "100-day streak");
  else if (a.longestStreakDays >= 30) add(45, "streak30", "30-day streak");

  if (a.totalActiveDays >= 500) add(78, "500d", "500 active days");
  else if (a.totalActiveDays >= 365) add(65, "365d", "365 active days");
  else if (a.totalActiveDays >= 100) add(35, "100d", "100 active days");

  // Daily density — needs a real baseline of days to be honest.
  if (a.totalActiveDays >= 10) {
    const perDay = a.totalTokens / a.totalActiveDays;
    if (perDay >= 20_000_000) add(60, "daily20m", "20M+ tokens/day");
    else if (perDay >= 5_000_000) add(30, "daily5m", "5M+ tokens/day");
  }

  // Consistency: active on most days since day one.
  const span = daysInclusive(a.firstActivityDate, a.lastActivityDate);
  if (span >= 60 && a.totalActiveDays / span >= 0.8)
    add(55, "consistent80", "Active 80% of days");

  // Cache efficiency — only local-log sources report cache reads.
  const cacheRead = (cc?.cacheReadTokens ?? 0) + (cx?.cacheReadTokens ?? 0);
  const cacheBase = (cc?.totalTokens ?? 0) + (cx?.totalTokens ?? 0);
  if (cacheBase >= 100_000_000 && cacheRead / cacheBase >= 0.9)
    add(50, "cache90", "90% cache-efficient");

  const sessions = (cc?.sessionCount ?? 0) + (cx?.sessionCount ?? 0);
  if (sessions >= 10_000) add(72, "sessions10k", "10k sessions");
  else if (sessions >= 1_000) add(32, "sessions1k", "1,000 sessions");

  if (a.distinctModels.length >= 20) add(58, "models20", "20+ models");
  else if (a.distinctModels.length >= 10) add(28, "models10", "10+ models");

  // Builds with models from more than one provider. OpenRouter reports
  // provider-prefixed ids ("openai/gpt-4.1"), so match after an optional
  // "vendor/" prefix rather than anchoring at the start.
  const hasClaude = a.distinctModels.some((m) => /claude/i.test(m));
  const hasOpenAI = a.distinctModels.some((m) =>
    /^(?:[\w.-]+\/)?(gpt|o\d|codex|chatgpt)/i.test(m)
  );
  if (hasClaude && hasOpenAI) add(25, "xprovider", "Cross-provider");

  if (sources >= 4) add(52, "sources4", "All 4 sources");
  else if (sources >= 3) add(22, "sources3", "3 tools");
  else if (sources >= 2) add(15, "multi", "Multi-tool");

  if (cc && cc.projectCount >= 25) add(48, "projects25", "25+ projects");
  else if (cc && cc.projectCount >= 10) add(20, "projects10", "10+ projects");

  if (cx && cx.reasoningTokens >= 100_000_000)
    add(62, "reasoning100m", "100M reasoning tokens");

  if (a.totalCostUsd != null && a.totalCostUsd >= 5_000)
    add(76, "spend5k", "$5k+ compute");
  else if (a.totalCostUsd != null && a.totalCostUsd >= 500)
    add(26, "spend500", "$500+ compute");

  return out
    .sort((x, y) => y.weight - x.weight)
    .map(({ id, label }) => ({ id, label }));
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
