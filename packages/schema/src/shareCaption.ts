import type { SnapshotPayload } from "./index.js";

const SHARE_RANKS = [
  { level: 1, name: "Foundation", minTokens: 0 },
  { level: 2, name: "Studio", minTokens: 25_000_000 },
  { level: 3, name: "Foundry", minTokens: 150_000_000 },
  { level: 4, name: "Tower", minTokens: 750_000_000 },
  { level: 5, name: "Citadel", minTokens: 2_500_000_000 },
  { level: 6, name: "Arcology", minTokens: 7_500_000_000 },
  { level: 7, name: "Landmark", minTokens: 20_000_000_000 },
  { level: 8, name: "Apex", minTokens: 100_000_000_000 },
] as const;

const SHARE_SOURCES = [
  { key: "claudeCode", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "cursor", label: "Cursor" },
  { key: "openrouter", label: "OpenRouter" },
] as const;

/** A compact, paste-ready caption for a public card URL. */
export function buildShareCaption(
  payload: SnapshotPayload,
  url: string,
  fmtTokens: (tokens: number) => string
): string {
  const rank =
    [...SHARE_RANKS].reverse().find((r) => payload.aggregate.totalTokens >= r.minTokens) ??
    SHARE_RANKS[0];
  const sources = SHARE_SOURCES.filter(({ key }) => payload.sources[key])
    .sort((a, b) => sourceTokens(payload, b.key) - sourceTokens(payload, a.key))
    .slice(0, 3)
    .map(({ label }) => label)
    .join(" + ");
  const who = payload.display.handle
    ? `${payload.display.handle}'s AI coding card`
    : "My AI coding card";

  return `${who}: TIER${rank.level} · ${rank.name} · ${fmtTokens(payload.aggregate.totalTokens)} tokens · ${sources}\n${url}`;
}

function sourceTokens(
  payload: SnapshotPayload,
  key: (typeof SHARE_SOURCES)[number]["key"]
): number {
  const source = payload.sources[key];
  return source?.totalTokens ?? 0;
}
