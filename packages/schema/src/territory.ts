import type { SnapshotPayload } from "./index";

export type TerritoryTileRole =
  | "foundation"
  | "core"
  | "spire"
  | "window"
  | "void";

export interface TerritoryTile {
  x: number;
  /**
   * Screen-space row: y increases downward. The ground/foundation is the
   * maximum y row, so every CSS and SVG renderer can place y directly.
   */
  y: number;
  role: TerritoryTileRole;
}

export interface TerritoryComposition {
  columns: number;
  rows: number;
  tiles: TerritoryTile[];
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

function seedFromPayload(payload: SnapshotPayload) {
  const a = payload.aggregate;
  return (
    (a.totalTokens % 1_000_003) * 31 +
    a.totalActiveDays * 7 +
    a.distinctModels.length * 131 +
    a.longestStreakDays * 17
  );
}

// Each profile is a stable massing language, not a noisy grid: a wide plinth
// becomes a narrow Tower, then grows into increasingly dense city-scale forms.
// Tiles retain coordinate and role data so the same territory can seed a future
// atlas without exposing anything beyond the existing aggregate payload.
const MASSING_BY_LEVEL = [
  [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
  [3, 4, 4, 5, 5, 5, 5, 5, 4, 3],
  [3, 5, 6, 7, 7, 7, 7, 6, 5, 3],
  [4, 6, 8, 11, 11, 8, 6, 4],
  [5, 7, 9, 11, 12, 12, 11, 9, 7, 5],
  [5, 7, 9, 11, 13, 13, 13, 11, 9, 7, 5],
  [6, 8, 10, 12, 14, 14, 14, 14, 12, 10, 8, 6],
  [6, 8, 10, 12, 14, 15, 15, 15, 15, 14, 12, 10, 8, 6],
] as const;

function silhouetteFor(level: number, random: () => number) {
  const profile = MASSING_BY_LEVEL[Math.min(Math.max(level, 1), 8) - 1];
  const center = (profile.length - 1) / 2;

  return profile.map((height, index) => {
    // The core stays legible. Only terraces may vary by one floor, and the
    // following pass limits neighboring changes so tiles remain stacked.
    const edgeDistance = Math.abs(index - center);
    const variation =
      level > 1 && edgeDistance > 1.5
        ? random() < 0.2
          ? -1
          : random() > 0.82
            ? 1
            : 0
        : 0;
    return Math.max(1, height + variation);
  }).map((height, index, heights) => {
    const left = heights[index - 1];
    const right = heights[index + 1];
    const neighborLimit = Math.min(
      left == null ? Infinity : left + 2,
      right == null ? Infinity : right + 2
    );
    return Math.min(height, neighborLimit);
  });
}

export function composeTerritory(
  payload: SnapshotPayload,
  level: number
): TerritoryComposition {
  const random = mulberry32(seedFromPayload(payload));
  const heights = silhouetteFor(level, random);
  const rows = 15;
  const columns = 14;
  const left = Math.floor((columns - heights.length) / 2);
  const tallest = Math.max(...heights);
  const center = (heights.length - 1) / 2;
  const tiles: TerritoryTile[] = [];

  for (let column = 0; column < heights.length; column++) {
    const height = heights[column];
    const nearCrown = height >= tallest - 1 && Math.abs(column - center) <= 1.5;
    const leftHeight = heights[column - 1] ?? 0;
    const rightHeight = heights[column + 1] ?? 0;

    for (let floor = 0; floor < height; floor++) {
      const highFloor = floor >= height - 2;
      // Gaps belong inside the upper mass, never in the plinth. Requiring
      // neighboring columns at this floor keeps them as punched windows or
      // courtyards rather than a transparent skirt around the silhouette.
      const voidFloor = Math.max(2, Math.ceil(height * 0.28));
      const interiorVoid =
        level >= 5 &&
        floor >= voidFloor &&
        floor < height - 2 &&
        leftHeight > floor &&
        rightHeight > floor &&
        random() < 0.07 + (level - 5) * 0.02;
      const role: TerritoryTileRole = interiorVoid
        ? "void"
        : floor === 0
          ? "foundation"
          : highFloor && nearCrown
            ? "spire"
            : random() < Math.min(0.72, 0.22 + level * 0.055)
              ? "window"
              : "core";

      tiles.push({
        x: left + column,
        // Keep the foundation at the visual bottom (maximum screen-space y).
        // Renderers intentionally map this coordinate directly to CSS/SVG y.
        y: rows - 1 - floor,
        role,
      });
    }
  }

  return { columns, rows, tiles };
}
