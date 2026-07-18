import type { SnapshotPayload } from "@aieracard/schema";

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

const RANKS: Array<{ level: number; name: string; minTokens: number }> = [
  { level: 1, name: "Trace", minTokens: 0 },
  { level: 2, name: "Circuit", minTokens: 10_000_000 },
  { level: 3, name: "Foundry", minTokens: 100_000_000 },
  { level: 4, name: "Citadel", minTokens: 500_000_000 },
  { level: 5, name: "Epoch", minTokens: 1_000_000_000 },
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

export function eraMilestones(payload: SnapshotPayload): EraMilestone[] {
  const a = payload.aggregate;
  const sources = [
    payload.sources.claudeCode,
    payload.sources.codex,
    payload.sources.cursor,
    payload.sources.openrouter,
  ].filter(Boolean).length;
  const out: EraMilestone[] = [];
  if (a.totalTokens >= 1_000_000_000)
    out.push({ id: "1b", label: "1B tokens club" });
  else if (a.totalTokens >= 100_000_000)
    out.push({ id: "100m", label: "100M tokens" });
  if (a.totalActiveDays >= 365)
    out.push({ id: "365d", label: "365 active days" });
  else if (a.totalActiveDays >= 100)
    out.push({ id: "100d", label: "100 active days" });
  if (a.longestStreakDays >= 30)
    out.push({ id: "streak30", label: "30-day streak" });
  if (a.distinctModels.length >= 10)
    out.push({ id: "models10", label: "10+ models" });
  if (sources >= 2) out.push({ id: "multi", label: "Multi-tool" });
  if (a.totalCostUsd != null && a.totalCostUsd >= 500)
    out.push({ id: "spend500", label: "$500+ compute" });
  return out.slice(0, 4);
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
