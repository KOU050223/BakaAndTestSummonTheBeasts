"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer, LoopOnce, LoopRepeat } from "three";
import type { AnimationAction, Group } from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
} from "@pixiv/three-vrm-animation";

type VrmAvatarProps = {
  // 読み込む VRM ファイルの URL（public 配下を想定）。
  url: string;
  // ワールド座標。バトルでは Goサーバー権威の position をここへ渡す。
  position?: [number, number, number];
  // Y軸回り（ラジアン）の向き。攻撃の正面判定と一致させる。
  rotationY?: number;
  // 待機モーション（.vrma）の URL。常時ループ再生する。未指定なら再生しない。
  idleAnimationUrl?: string;
  // 攻撃などのワンショットモーション（.vrma）の URL。
  // この値が「変化した」タイミングで先頭から 1 回だけ再生し、終わると待機へ戻る。
  // 同じ攻撃を連続で出す場合は、呼び出し側でキー（後述の actionKey）を変えること。
  actionAnimationUrl?: string;
  // actionAnimationUrl と同じ URL を連続再生したいときの再トリガー用キー。
  // 値が変わるたびにワンショットを頭から再生し直す。
  actionKey?: string | number;
};

// VRM モデルを読み込んで表示し、VRMA（VRM Animation）を再生するコンポーネント。
// GLTFLoader に VRMLoaderPlugin / VRMAnimationLoaderPlugin を登録して
// VRM 本体も .vrma も同じローダーで読み込む。
// useFrame で毎フレーム mixer.update(delta) と vrm.update(delta) を呼ぶ。
export function VrmAvatar({
  url,
  position = [0, 0, 0],
  rotationY = 0,
  idleAnimationUrl,
  actionAnimationUrl,
  actionKey,
}: VrmAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const groupRef = useRef<Group>(null);

  // AnimationMixer は VRM が読み込まれた後に生成する。
  const mixerRef = useRef<AnimationMixer | null>(null);
  // 待機・アクションそれぞれの AnimationAction を保持する。
  const idleActionRef = useRef<AnimationAction | null>(null);
  const actionActionRef = useRef<AnimationAction | null>(null);

  // GLTFLoader はマウント中で使い回す。VRM も VRMA も同じローダーで読める。
  const loader = useMemo(() => {
    const l = new GLTFLoader();
    l.register((parser) => new VRMLoaderPlugin(parser));
    l.register((parser) => new VRMAnimationLoaderPlugin(parser));
    return l;
  }, []);

  // --- VRM 本体の読み込み ---
  useEffect(() => {
    let disposed = false;
    let loaded: VRM | null = null;

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const loadedVrm = gltf.userData.vrm as VRM;
        // パフォーマンス最適化（不要頂点・不要ジョイントの削除）。
        VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
        VRMUtils.removeUnnecessaryJoints(loadedVrm.scene);
        // NOTE: VRMUtils.rotateVRM0 はこのプロジェクトの座標系では使わない。
        // 元々 rotateVRM0 なしで正しい向きに表示されていたため、
        // 呼ぶとモデルが 180 度逆を向いてしまう。
        // フラスタムカリングで消えるのを防ぐ。
        loadedVrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        // lookAt アニメーションの再生に必要なプロキシを追加する。
        // lookAt を持たない VRM もあるため存在する場合のみ。
        if (loadedVrm.lookAt) {
          const lookAtProxy = new VRMLookAtQuaternionProxy(loadedVrm.lookAt);
          lookAtProxy.name = "lookAtQuaternionProxy";
          loadedVrm.scene.add(lookAtProxy);
        }

        loaded = loadedVrm;
        mixerRef.current = new AnimationMixer(loadedVrm.scene);
        setVrm(loadedVrm);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load VRM:", url, error);
      },
    );

    return () => {
      disposed = true;
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      idleActionRef.current = null;
      actionActionRef.current = null;
      if (loaded) {
        // GPU リソースを解放してメモリリークを防ぐ。
        VRMUtils.deepDispose(loaded.scene);
      }
    };
  }, [loader, url]);

  // --- 待機モーション（ループ）の読み込み ---
  useEffect(() => {
    if (!vrm || !mixerRef.current || !idleAnimationUrl) return;
    let disposed = false;

    loader.load(
      idleAnimationUrl,
      (gltf) => {
        if (disposed || !vrm || !mixerRef.current) return;
        const vrmAnimation = gltf.userData.vrmAnimations?.[0];
        if (!vrmAnimation) {
          console.warn("[VrmAvatar] no vrmAnimations in idle:", idleAnimationUrl);
          return;
        }
        const clip = createVRMAnimationClip(vrmAnimation, vrm);
        const action = mixerRef.current.clipAction(clip);
        action.setLoop(LoopRepeat, Infinity);
        action.play();
        idleActionRef.current = action;
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load idle vrma:", idleAnimationUrl, error);
      },
    );

    return () => {
      disposed = true;
      const action = idleActionRef.current;
      if (action) {
        action.stop();
        mixerRef.current?.uncacheClip(action.getClip());
        idleActionRef.current = null;
      }
    };
  }, [vrm, loader, idleAnimationUrl]);

  // --- アクションモーション（ワンショット）の読み込みと再生 ---
  // actionAnimationUrl または actionKey が変化したら頭から 1 回再生する。
  useEffect(() => {
    if (!vrm || !mixerRef.current || !actionAnimationUrl) return;
    const mixer = mixerRef.current;
    let disposed = false;

    loader.load(
      actionAnimationUrl,
      (gltf) => {
        if (disposed || !vrm) return;
        const vrmAnimation = gltf.userData.vrmAnimations?.[0];
        if (!vrmAnimation) {
          console.warn("[VrmAvatar] no vrmAnimations in action:", actionAnimationUrl);
          return;
        }
        const clip = createVRMAnimationClip(vrmAnimation, vrm);
        const action = mixer.clipAction(clip);
        action.setLoop(LoopOnce, 1);
        // 再生終了後にポーズが戻らず、最後のフレームで止まるようにする。
        action.clampWhenFinished = true;
        actionActionRef.current = action;

        const idle = idleActionRef.current;
        if (idle) {
          // 待機 → アクションへなめらかにクロスフェード。
          action.reset();
          action.crossFadeFrom(idle, 0.15, false);
          action.play();
        } else {
          action.reset().play();
        }

        // 再生が終わったら待機へ戻す。
        const onFinished = (e: { action: AnimationAction }) => {
          if (e.action !== action) return;
          const idleNow = idleActionRef.current;
          if (idleNow) {
            idleNow.reset();
            idleNow.crossFadeFrom(action, 0.2, false);
            idleNow.play();
          }
          mixer.removeEventListener("finished", onFinished);
        };
        mixer.addEventListener("finished", onFinished);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load action vrma:", actionAnimationUrl, error);
      },
    );

    return () => {
      disposed = true;
      const action = actionActionRef.current;
      if (action) {
        action.stop();
        mixerRef.current?.uncacheClip(action.getClip());
        actionActionRef.current = null;
      }
    };
    // actionKey を依存に含めることで、同じ URL でも再トリガーできる。
  }, [vrm, loader, actionAnimationUrl, actionKey]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    vrm?.update(delta);
  });

  if (!vrm) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={vrm.scene} />
    </group>
  );
}
