import type { SnapshotPayload } from "@aieracard/schema";
import { eraPalette } from "./eraRank";

// Deterministic "city blocks" mosaic derived from the user's stats.
// Same payload → same pattern; more usage → denser, brighter blocks.
// Palette is stats-seeded so every card feels personally themed.

export interface MosaicCell {
  color: string;
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
