"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import type { Group } from "three";

type VrmAvatarProps = {
  // 読み込む VRM ファイルの URL（public 配下を想定）。
  url: string;
  // ワールド座標。バトルでは Goサーバー権威の position をここへ渡す。
  position?: [number, number, number];
  // Y軸回り（ラジアン）の向き。攻撃の正面判定と一致させる。
  rotationY?: number;
};

// VRM モデルを読み込んで表示するコンポーネント。
// GLTFLoader に VRMLoaderPlugin を登録して読み込み、useFrame で毎フレーム
// vrm.update(delta) を呼ぶ（スプリングボーン・表情などの更新に必須）。
export function VrmAvatar({ url, position = [0, 0, 0], rotationY = 0 }: VrmAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const groupRef = useRef<Group>(null);

  // GLTFLoader はマウント中で使い回す。url が変わるたびに作り直す必要はない。
  const loader = useMemo(() => {
    const l = new GLTFLoader();
    l.register((parser) => new VRMLoaderPlugin(parser));
    return l;
  }, []);

  useEffect(() => {
    let disposed = false;
    let loaded: VRM | null = null;

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const loadedVrm = gltf.userData.vrm as VRM;
        // パフォーマンス最適化（不要頂点の削除）。
        VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
        // フラスタムカリングで消えるのを防ぐ。
        loadedVrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        loaded = loadedVrm;
        setVrm(loadedVrm);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load VRM:", url, error);
      },
    );

    return () => {
      disposed = true;
      if (loaded) {
        // GPU リソースを解放してメモリリークを防ぐ。
        VRMUtils.deepDispose(loaded.scene);
      }
    };
  }, [loader, url]);

  useFrame((_, delta) => {
    vrm?.update(delta);
  });

  if (!vrm) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={vrm.scene} />
    </group>
  );
}
