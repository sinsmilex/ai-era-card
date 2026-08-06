// The single canonical rank ladder. Web (eraRank), CLI (textCard, baseline
// delta), and the share caption all consume this table — do not copy it into
// an app; a tier rename or threshold tweak must land everywhere at once, or
// the caption a user pastes stops matching the card it links to.
export interface EraRankBand {
  level: number;
  name: string;
  minTokens: number;
}

export const ERA_RANKS: readonly EraRankBand[] = [
  { level: 1, name: "Foundation", minTokens: 0 },
  { level: 2, name: "Studio", minTokens: 25_000_000 },
  { level: 3, name: "Foundry", minTokens: 150_000_000 },
  { level: 4, name: "Tower", minTokens: 750_000_000 },
  { level: 5, name: "Citadel", minTokens: 2_500_000_000 },
  { level: 6, name: "Arcology", minTokens: 7_500_000_000 },
  { level: 7, name: "Landmark", minTokens: 20_000_000_000 },
  { level: 8, name: "Apex", minTokens: 100_000_000_000 },
];

export function eraRankBand(totalTokens: number): EraRankBand {
  let current = ERA_RANKS[0];
  for (const band of ERA_RANKS) {
    if (totalTokens >= band.minTokens) current = band;
  }
  return current;
}

/** The one tier-title format every surface renders, e.g. "TIER4 · TOWER". */
export function eraRankTitle(totalTokens: number): string {
  const band = eraRankBand(totalTokens);
  return `TIER${band.level} · ${band.name.toUpperCase()}`;
}
