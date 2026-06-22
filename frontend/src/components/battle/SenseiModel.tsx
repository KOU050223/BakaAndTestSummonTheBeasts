"use client";

import { useEffect, useMemo, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Group } from "three";

type SenseiModelProps = {
  // 読み込む GLB ファイルの URL（public 配下を想定）。
  url?: string;
  // ワールド座標。既定はフィールド中心（原点）。
  position?: [number, number, number];
  // Y軸回り（ラジアン）の向き。
  rotationY?: number;
  // 表示スケール。
  scale?: number;
};

// 先生（sensei.glb）をバトルフィールドの中心に立たせるためのコンポーネント。
// GLTFLoader でそのまま GLB を読み込み、scene を primitive で描画する。
export function SenseiModel({
  url = "/sensei.glb",
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
}: SenseiModelProps) {
  const [scene, setScene] = useState<Group | null>(null);

  const loader = useMemo(() => new GLTFLoader(), []);

  useEffect(() => {
    let disposed = false;
    let loadedScene: Group | null = null;

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        loadedScene = gltf.scene;
        // フラスタムカリングで消えるのを防ぐ。
        loadedScene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        setScene(loadedScene);
      },
      undefined,
      (error) => {
        console.error("[SenseiModel] failed to load glb:", url, error);
      },
    );

    return () => {
      disposed = true;
      setScene(null);
    };
  }, [loader, url]);

  if (!scene) return null;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}
