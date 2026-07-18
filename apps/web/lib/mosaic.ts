import type { SnapshotPayload } from "@aieracard/schema";

// Deterministic "city blocks" mosaic derived from the user's stats.
// Same payload → same pattern; more usage → denser, brighter blocks.
// This is the seed of the future map: the card background IS your territory.

export interface MosaicCell {
  color: string;
}

const ACTIVE_COLORS = ["#1D9E75", "#5DCAA5", "#534AB7", "#7F77DD"];
const IDLE_COLORS = ["#22272e", "#2d333b"];

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
  cells = 32
): MosaicCell[] {
  const a = payload.aggregate;
  const seed =
    (a.totalTokens % 1_000_003) * 31 +
    a.totalActiveDays * 7 +
    a.distinctModels.length * 131 +
    a.longestStreakDays * 17;
  const rnd = mulberry32(seed);

  // Density scales with log of total tokens: 1M → ~35%, 1B → ~75%.
  const magnitude = Math.log10(Math.max(a.totalTokens, 1));
  const density = Math.min(0.85, Math.max(0.2, (magnitude - 4) / 6.5));

  return Array.from({ length: cells }, () => {
    const active = rnd() < density;
    const palette = active ? ACTIVE_COLORS : IDLE_COLORS;
    return { color: palette[Math.floor(rnd() * palette.length)] };
  });
}
