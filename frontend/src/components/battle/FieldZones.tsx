"use client";

import { DoubleSide } from "three";
import type { FieldState } from "@/lib/battle/wsSchema";

// 科目フィールドごとの色（リングの視認性確保）。未定義はグレー。
const FIELD_COLOR: Record<string, string> = {
  english: "#f59e0b",
  math: "#38bdf8",
  japanese: "#f472b6",
  physics: "#a78bfa",
  chemistry: "#34d399",
};

export function fieldColor(subject: string): string {
  return FIELD_COLOR[subject] ?? "#94a3b8";
}

type FieldZonesProps = {
  // Go サーバー権威の fields（科目・中心座標・半径）。
  fields: FieldState[];
};

// AR 床に科目フィールド円を 3D で描画する。
// 各フィールドは中心 (centerX, centerZ)・半径 radius の薄い円盤として床面（y=0）に置く。
// 各フィールド中心に (半径+10) のグリッド（battleArena.ts 参照）。
export function FieldZones({ fields }: FieldZonesProps) {
  return (
    <>
      {fields.map((f) => (
        <mesh
          key={f.subject}
          position={[f.centerX, 0.005, f.centerZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[f.radius * 0.92, f.radius, 48]} />
          <meshBasicMaterial color={fieldColor(f.subject)} transparent opacity={0.7} side={DoubleSide} />
        </mesh>
      ))}
    </>
  );
}
