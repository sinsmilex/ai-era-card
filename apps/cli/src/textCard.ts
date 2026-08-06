import {
  composeTerritory,
  eraRankBand,
  eraRankTitle,
  type SnapshotPayload,
} from "@aieracard/schema";

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Tier label for a token total, e.g. "TIER4 · TOWER" — delegates to the
 * canonical ladder in @aieracard/schema. */
export const rankTitleFor = eraRankTitle;

// A terminal-sized raster of the shared territory composer. The terminal has
// fewer cells, but keeps the same rank massing and seeded tile roles as web.
export function renderTerminalMosaic(payload: SnapshotPayload): string[] {
  const width = 10;
  const height = 7;
  const { aggregate } = payload;
  const rank = eraRankBand(aggregate.totalTokens);
  const { tiles } = composeTerritory(payload, rank.level);
  const minX = Math.min(...tiles.map((tile) => tile.x));
  const maxX = Math.max(...tiles.map((tile) => tile.x));
  const minY = Math.min(...tiles.map((tile) => tile.y));
  const maxY = Math.max(...tiles.map((tile) => tile.y));
  const blocks = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ".")
  );
  const glyph = {
    foundation: "#",
    core: "#",
    spire: "@",
    window: "+",
    void: ".",
  } as const;

  for (const tile of tiles) {
    const x = Math.round(((tile.x - minX) / (maxX - minX || 1)) * (width - 1));
    const y = Math.round(((tile.y - minY) / (maxY - minY || 1)) * (height - 1));
    blocks[y][x] = glyph[tile.role];
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
  // OpenRouter only reports a trailing 30-day window while the other sources
  // report all-time usage. Do not present their combined token totals as a share.
  const hasMixedUsageWindows = sources.openrouter != null && sourceEntries.length > 1;
  const barWidth = 20;
  const filled = Math.round(primaryShare * barWidth);
  const sourceBar = `${"█".repeat(filled)}${"░".repeat(barWidth - filled)}`;
  const compute =
    aggregate.totalCostUsd != null
      ? `${fmtUsd(aggregate.totalCostUsd)} compute`
      : "compute not reported";
  const innerWidth = 62;
  const textWidth = 48;
  const artwork = renderTerminalMosaic(payload);
  const stats = [
    `AI ERA CARD · ${display.handle || "anonymous"}`,
    eraRankTitle(aggregate.totalTokens),
    `${fmtTokens(aggregate.totalTokens)} tokens`,
    `${compute} · ${aggregate.distinctModels.length} models`,
    `${aggregate.totalActiveDays} active days · ${aggregate.longestStreakDays}-day streak`,
    `Sources: ${sourceEntries.map((source) => source.name).join(" · ")}`,
    hasMixedUsageWindows
      ? "Usage: share unavailable (OpenRouter: last 30 days)"
      : `Usage: ${sourceBar}${primarySource ? ` ${primarySource.name} ${Math.round(primaryShare * 100)}%` : ""}`,
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
