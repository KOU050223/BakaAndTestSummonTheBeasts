"use client";

import { Grid } from "@react-three/drei";
import {
  ARENA_GRID_CELL_SIZE,
  ARENA_GRID_SECTION_SIZE,
  computeGridHalfExtent,
} from "@/lib/battle/battleArena";
import type { FieldState } from "@/lib/battle/wsSchema";

type BattleFloorProps = {
  fields: FieldState[];
};

const GRID_PROPS = {
  cellSize: ARENA_GRID_CELL_SIZE,
  sectionSize: ARENA_GRID_SECTION_SIZE,
  cellColor: "#3b4a6b",
  sectionColor: "#5b6ea3",
  fadeStrength: 1,
  fadeFrom: 1 as const,
};

/**
 * 床グリッド。各フィールド中心に (半径 + 10) の正方形を敷く。
 */
export function BattleFloor({ fields }: BattleFloorProps) {
  if (fields.length === 0) {
    const halfExtent = computeGridHalfExtent(0);
    const size = halfExtent * 2;
    return (
      <Grid
        args={[size, size]}
        {...GRID_PROPS}
        fadeDistance={size * 1.5}
        position={[0, 0, 0]}
      />
    );
  }

  return (
    <>
      {fields.map((f) => {
        const halfExtent = computeGridHalfExtent(f.radius);
        const size = halfExtent * 2;
        return (
          <Grid
            key={f.subject}
            args={[size, size]}
            {...GRID_PROPS}
            fadeDistance={size * 1.5}
            position={[f.centerX, 0, f.centerZ]}
          />
        );
      })}
    </>
  );
}
