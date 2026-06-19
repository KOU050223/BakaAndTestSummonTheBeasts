"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { VrmAvatar } from "./VrmAvatar";
import { FieldZones } from "./FieldZones";
import type { StateMessage } from "@/lib/battle/wsSchema";

// 全召喚獣で使い回す VRM モデル（将来は科目別に差し替え可能にする）。
const DEFAULT_VRM_URL = "/cat.vrm";

type BattleSceneProps = {
  // Go サーバー権威の最新 state。未受信（接続待ち）の間は null。
  state: StateMessage | null;
};

// バトルの 3D シーン。
// state があればサーバー権威のプレイヤー位置・向き・フィールド円を反映する。
// state が null（フェーズ1のデモ／接続待ち）の間は、向かい合わせの 2 体を仮表示する。
// フェーズ3 でこの Canvas を AR（WebXR）に差し替える。
export function BattleScene({ state }: BattleSceneProps) {
  const players = state ? Object.entries(state.players) : [];

  return (
    <Canvas
      camera={{ position: [0, 1.0, 3], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      {/* ライティング */}
      <ambientLight intensity={Math.PI * 0.5} />
      <directionalLight position={[1, 2, 1]} intensity={Math.PI} />

      {/* 床のグリッド（AR では床面検出に置き換わる演出の暫定表現） */}
      <Grid
        args={[10, 10]}
        cellColor="#3b4a6b"
        sectionColor="#5b6ea3"
        fadeDistance={18}
        position={[0, 0, 0]}
      />

      <Suspense fallback={null}>
        {state ? (
          <>
            {/* 科目フィールド円 */}
            <FieldZones fields={state.fields} />
            {/* 召喚済みプレイヤーをサーバー権威の位置・向きで配置 */}
            {players.map(([userId, p]) =>
              p.summoned ? (
                <VrmAvatar key={userId} url={DEFAULT_VRM_URL} position={[p.x, 0, p.z]} rotationY={p.angle} />
              ) : null,
            )}
          </>
        ) : (
          <>
            {/* 接続待ちの仮表示：自分（手前左）と相手（奥右）を向かい合わせる */}
            <VrmAvatar url={DEFAULT_VRM_URL} position={[-0.8, 0, 0.3]} rotationY={Math.PI / 2} />
            <VrmAvatar url={DEFAULT_VRM_URL} position={[0.8, 0, -0.3]} rotationY={-Math.PI / 2} />
          </>
        )}
      </Suspense>

      <OrbitControls target={[0, 0.6, 0]} enablePan={false} />
    </Canvas>
  );
}
