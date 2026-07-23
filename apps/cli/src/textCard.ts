import type { SnapshotPayload } from "@aieracard/schema";

const RANKS = [
  { level: 1, name: "Foundation", minTokens: 0 },
  { level: 2, name: "Studio", minTokens: 25_000_000 },
  { level: 3, name: "Foundry", minTokens: 150_000_000 },
  { level: 4, name: "Tower", minTokens: 750_000_000 },
  { level: 5, name: "Citadel", minTokens: 2_500_000_000 },
  { level: 6, name: "Arcology", minTokens: 7_500_000_000 },
  { level: 7, name: "Landmark", minTokens: 20_000_000_000 },
  { level: 8, name: "Apex", minTokens: 100_000_000_000 },
] as const;

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A terminal-sized version of the web card's deterministic landmark.
export function renderTerminalMosaic(payload: SnapshotPayload): string[] {
  const width = 10;
  const height = 7;
  const { aggregate } = payload;
  const rank = RANKS.findLast(
    (candidate) => aggregate.totalTokens >= candidate.minTokens
  )!;
  const seed =
    (aggregate.totalTokens % 1_000_003) * 31 +
    aggregate.totalActiveDays * 7 +
    aggregate.distinctModels.length * 131 +
    aggregate.longestStreakDays * 17;
  const random = mulberry32(seed);
  const blocks = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => {
      const brightness = random();
      return brightness < 0.58 ? "░" : brightness < 0.88 ? "▒" : "▓";
    })
  );
  const buildingWidth = Math.min(width, 3 + rank.level);
  const baseHeight = Math.min(height, rank.level + 1);
  const left = Math.floor((width - buildingWidth) / 2);

  for (let x = 0; x < buildingWidth; x++) {
    const centerDistance = Math.abs(x - (buildingWidth - 1) / 2);
    const shoulder = Math.floor(centerDistance / 1.8);
    const variation = random() > 0.72 ? 1 : random() < 0.24 ? -1 : 0;
    const columnHeight = Math.max(
      1,
      Math.min(height, baseHeight - shoulder + variation)
    );

    for (let floor = 0; floor < columnHeight; floor++) {
      const brightness = random();
      blocks[height - 1 - floor][left + x] =
        brightness < 0.18 ? "░" : brightness < 0.5 ? "▒" : brightness < 0.82 ? "▓" : "█";
    }
  }

  return blocks.map((row) => row.join(""));
}

export function renderTextCard(payload: SnapshotPayload): string {
  const { aggregate, display, sources } = payload;
  const sourceNames = {
    claudeCode: "Claude Code",
    codex: "Codex",
    cursor: "Cursor",
    openrouter: "OpenRouter",
  };
  const sourceEntries = Object.entries(sources).map(([source, stats]) => ({
    name: sourceNames[source as keyof typeof sourceNames],
    tokens: stats.totalTokens ?? 0,
  }));
  const totalSourceTokens = sourceEntries.reduce((sum, source) => sum + source.tokens, 0);
  const primarySource = [...sourceEntries].sort((a, b) => b.tokens - a.tokens)[0];
  const primaryShare =
    totalSourceTokens > 0 && primarySource ? primarySource.tokens / totalSourceTokens : 0;
  const barWidth = 20;
  const filled = Math.round(primaryShare * barWidth);
  const sourceBar = `${"█".repeat(filled)}${"░".repeat(barWidth - filled)}`;
  const rank = RANKS.findLast(
    (candidate) => aggregate.totalTokens >= candidate.minTokens
  )!;
  const compute =
    aggregate.totalCostUsd != null
      ? `${fmtUsd(aggregate.totalCostUsd)} compute`
      : "compute not reported";
  const innerWidth = 62;
  const textWidth = 48;
  const artwork = renderTerminalMosaic(payload);
  const stats = [
    `AI ERA CARD · ${display.handle || "anonymous"}`,
    `L${rank.level} · ${rank.name.toUpperCase()}`,
    `${fmtTokens(aggregate.totalTokens)} tokens`,
    `${compute} · ${aggregate.distinctModels.length} models`,
    `${aggregate.totalActiveDays} active days · ${aggregate.longestStreakDays}-day streak`,
    `Sources: ${sourceEntries.map((source) => source.name).join(" · ")}`,
    `Usage: ${sourceBar}${primarySource ? ` ${primarySource.name} ${Math.round(primaryShare * 100)}%` : ""}`,
    "Self-reported · not a game score",
  ];
  const line = (text: string, art = "") =>
    `│ ${text.slice(0, textWidth).padEnd(textWidth)}  ${art.padEnd(10)}   │`;

  return [
    `┌${"─".repeat(innerWidth + 2)}┐`,
    ...stats.map((stat, index) => line(stat, artwork[index])),
    `└${"─".repeat(innerWidth + 2)}┘`,
  ].join("\n");
}
