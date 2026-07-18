import type { SnapshotPayload } from "@aieracard/schema";
import { eraPalette, eraRank } from "./eraRank";

// Deterministic "city blocks" mosaic derived from the user's stats.
// Same payload → same pattern; more usage → denser, brighter blocks.
// Palette is stats-seeded so every card feels personally themed.

export interface MosaicCell {
  color: string;
}

export interface BuildingBlock {
  color: string;
  x: number;
  y: number;
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

export function buildMosaic(
  payload: SnapshotPayload,
  cells = 48
): MosaicCell[] {
  const a = payload.aggregate;
  const seed =
    (a.totalTokens % 1_000_003) * 31 +
    a.totalActiveDays * 7 +
    a.distinctModels.length * 131 +
    a.longestStreakDays * 17;
  const rnd = mulberry32(seed);
  const palette = eraPalette(payload);

  // Density scales with log of total tokens: 1M → ~35%, 1B → ~80%.
  const magnitude = Math.log10(Math.max(a.totalTokens, 1));
  const density = Math.min(0.88, Math.max(0.22, (magnitude - 4) / 6.2));

  return Array.from({ length: cells }, () => {
    const active = rnd() < density;
    const colors = active ? palette.mosaicActive : palette.mosaicIdle;
    return { color: colors[Math.floor(rnd() * colors.length)] };
  });
}

// A personal territory landmark for the card. Its footprint and stepped
// silhouette are deterministic from aggregate-only stats, so this exact
// geometry can later become the user's plot in the shared atlas.
export function buildBuilding(payload: SnapshotPayload): BuildingBlock[] {
  const a = payload.aggregate;
  const seed =
    (a.totalTokens % 1_000_003) * 31 +
    a.totalActiveDays * 7 +
    a.distinctModels.length * 131 +
    a.longestStreakDays * 17;
  const rnd = mulberry32(seed);
  const palette = eraPalette(payload);
  const { level } = eraRank(payload);
  const columns = 10;
  const rows = 9;
  const width = Math.min(columns, 3 + level);
  const baseHeight = Math.min(rows, level + 1);
  const left = Math.floor((columns - width) / 2);
  const blocks: BuildingBlock[] = [];

  for (let x = 0; x < width; x++) {
    const centerDistance = Math.abs(x - (width - 1) / 2);
    const shoulder = Math.floor(centerDistance / 1.8);
    const variation = rnd() > 0.72 ? 1 : rnd() < 0.24 ? -1 : 0;
    const height = Math.max(
      1,
      Math.min(rows, baseHeight - shoulder + variation)
    );

    for (let floor = 0; floor < height; floor++) {
      const litChance = Math.min(0.82, 0.32 + level * 0.06);
      const colors =
        rnd() < litChance ? palette.mosaicActive : palette.mosaicIdle;
      blocks.push({
        x: left + x,
        y: rows - 1 - floor,
        color: colors[Math.floor(rnd() * colors.length)],
      });
    }
  }

  return blocks;
}
