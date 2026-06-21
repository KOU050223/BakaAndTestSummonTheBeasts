import type { FieldState } from "@/lib/battle/wsSchema";

/** 床グリッド・カメラ用のバトルアリーナ境界（Go/Rails の XZ と同一単位）。 */
export type ArenaBounds = {
  centerX: number;
  centerZ: number;
  /** 中心から端までの距離（グリッド半辺長に使う）。 */
  halfExtent: number;
};

const DEFAULT_HALF_EXTENT = 8;
const ARENA_PADDING = 2;

/**
 * 全フィールドを包含するアリーナ境界を求める。
 * Rails: FIELD_RING_RADIUS=5, FIELD_RADIUS=3 → 最大半径 8。
 */
export function computeArenaBounds(fields: FieldState[]): ArenaBounds {
  if (fields.length === 0) {
    return { centerX: 0, centerZ: 0, halfExtent: DEFAULT_HALF_EXTENT };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const f of fields) {
    minX = Math.min(minX, f.centerX - f.radius);
    maxX = Math.max(maxX, f.centerX + f.radius);
    minZ = Math.min(minZ, f.centerZ - f.radius);
    maxZ = Math.max(maxZ, f.centerZ + f.radius);
  }

  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const halfExtent = Math.max(
    maxX - centerX,
    maxZ - centerZ,
    DEFAULT_HALF_EXTENT / 2,
  ) + ARENA_PADDING;

  return { centerX, centerZ, halfExtent };
}

/** フィールド円の外側余白（グリッド半辺 = 半径 + この値）。 */
export const ARENA_GRID_MARGIN = 10;

/** 床グリッドの半辺長（フィールド中心から端まで）。 */
export function computeGridHalfExtent(fieldRadius: number): number {
  return fieldRadius + ARENA_GRID_MARGIN;
}

/** 細線タイル 1 マスの辺長（ワールド単位）。小さいほど間隔が読みやすい。 */
export const ARENA_GRID_CELL_SIZE = 0.25;

/** 太線間隔（ワールド単位）。サーバー移動量 1.0 ごとに目立たせる。 */
export const ARENA_GRID_SECTION_SIZE = 1;
