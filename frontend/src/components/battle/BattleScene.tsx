"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { VrmAvatar } from "./VrmAvatar";

// 全召喚獣で使い回す VRM モデル（将来は科目別に差し替え可能にする）。
const DEFAULT_VRM_URL = "/cat.vrm";

// バトルの 3D シーン。MVP（フェーズ1）では AR 無しの固定ビューで、
// 自分と相手の召喚獣 2 体を向かい合わせに配置して表示確認するだけ。
// フェーズ2 以降で position / rotationY を Goサーバー権威の state に接続する。
export function BattleScene() {
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
        {/* 自分の召喚獣：手前左、奥（相手）を向く */}
        <VrmAvatar url={DEFAULT_VRM_URL} position={[-0.8, 0, 0.3]} rotationY={Math.PI / 2} />
        {/* 相手の召喚獣：奥右、手前（自分）を向く */}
        <VrmAvatar url={DEFAULT_VRM_URL} position={[0.8, 0, -0.3]} rotationY={-Math.PI / 2} />
      </Suspense>

      <OrbitControls target={[0, 0.6, 0]} enablePan={false} />
    </Canvas>
  );
}
