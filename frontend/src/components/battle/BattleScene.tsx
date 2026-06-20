"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { VrmAvatar } from "./VrmAvatar";
import { FieldZones } from "./FieldZones";
import type { StateMessage, PlayerState } from "@/lib/battle/wsSchema";
import { goAngleToThreeRotationY } from "@/lib/battle/coords";

// 自分(index=0)と相手(index=1)で色を分ける。
const MARKER_COLORS = ["#60a5fa", "#f87171"] as const;

type PlayerMarkerProps = {
  position: [number, number, number];
  rotationY: number;
  playerIndex: number;
};

// 未召喚プレイヤーの位置・向きを床マーカーで示す。
// 薄い円盤（足元の存在感）＋小さな三角形（向き）で構成する。
function PlayerMarker({ position, rotationY, playerIndex }: PlayerMarkerProps) {
  const color = MARKER_COLORS[playerIndex % 2];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 足元の円盤 */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {/* 向きを示す三角形（前方 +Z） */}
      <mesh position={[0, 0.02, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 3]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// カメラと注視点の補間速度。値が大きいほどカメラが素早く追いつく。
const CAM_LERP = 0.08;
// プレイヤーの後ろ上方へのオフセット（ローカル座標）。
const CAM_OFFSET = new THREE.Vector3(0, 3.5, 5.5);
// 注視点オフセット（プレイヤー中心より少し上）。
const LOOK_OFFSET = new THREE.Vector3(0, 1.0, 0);

type CameraFollowerProps = {
  target: PlayerState | undefined;
};

// 自プレイヤーを斜め後ろ上から追従するカメラ。
// OrbitControls の代わりに useFrame で毎フレーム補間する。
function CameraFollower({ target }: CameraFollowerProps) {
  const { camera } = useThree();
  const lookAtRef = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    if (!target) return;

    const rotY = goAngleToThreeRotationY(target.angle);
    const offset = CAM_OFFSET.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    const desiredPos = new THREE.Vector3(target.x, 0, target.z).add(offset);
    const desiredLook = new THREE.Vector3(target.x, 0, target.z).add(LOOK_OFFSET);

    camera.position.lerp(desiredPos, CAM_LERP);
    lookAtRef.current.lerp(desiredLook, CAM_LERP);
    camera.lookAt(lookAtRef.current);
  });

  return null;
}

// 全召喚獣で使い回す VRM モデル（将来は科目別に差し替え可能にする）。
const DEFAULT_VRM_URL = "/cat.vrm";

// VRoid 公式 VRMA_MotionPack のモーション（public 配下に同梱）。
// 待機はループ、攻撃はワンショットで再生する。
const IDLE_VRMA_URL = "/VRMA_MotionPack/vrma/model_pose.vrma";
const ATTACK_VRMA_URL = "/VRMA_MotionPack/vrma/ban.vrma";

type BattleAvatarProps = {
  position: [number, number, number];
  rotationY: number;
  // サーバー権威の「この tick で攻撃を発動したか」。
  attacking: boolean;
  // 現在の tick。攻撃モーションの再トリガーキーに使う。
  tick: number;
};

// 召喚済みプレイヤーの VRM アバター。
// attacking が true になった tick を覚えておき、それを actionKey として
// VrmAvatar に渡すことで攻撃モーションを 1 回だけ再生させる。
// （attacking は 1 tick で false に戻るため、ここで「最後に攻撃した tick」を保持する）
function BattleAvatar({ position, rotationY, attacking, tick }: BattleAvatarProps) {
  const [lastAttackTick, setLastAttackTick] = useState<number | null>(null);
  if (attacking && tick !== lastAttackTick) {
    setLastAttackTick(tick);
  }
  return (
    <VrmAvatar
      url={DEFAULT_VRM_URL}
      position={position}
      rotationY={rotationY}
      idleAnimationUrl={IDLE_VRMA_URL}
      actionAnimationUrl={lastAttackTick !== null ? ATTACK_VRMA_URL : undefined}
      actionKey={lastAttackTick ?? undefined}
    />
  );
}

type BattleSceneProps = {
  // Go サーバー権威の最新 state。未受信（接続待ち）の間は null。
  state: StateMessage | null;
  // 自分の userId。カメラ追従ターゲットの特定に使う。
  currentUserId: string;
};

// バトルの 3D シーン。
// state があればサーバー権威のプレイヤー位置・向き・フィールド円を反映する。
// state が null（フェーズ1のデモ／接続待ち）の間は、向かい合わせの 2 体を仮表示する。
// フェーズ3 でこの Canvas を AR（WebXR）に差し替える。
export function BattleScene({ state, currentUserId }: BattleSceneProps) {
  const players = state ? Object.entries(state.players) : [];
  const selfState = state?.players[currentUserId];

  return (
    <Canvas
      camera={{ position: [0, 3.5, 5.5], fov: 50 }}
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
            {/* プレイヤーをサーバー権威の位置・向きで配置。召喚済みは VRM、未召喚は床マーカー */}
            {/* goAngleToThreeRotationY で Go 座標系 → Three.js 座標系に変換する */}
            {players.map(([userId, p], index) => {
              const rotationY = goAngleToThreeRotationY(p.angle);
              return p.summoned ? (
                <BattleAvatar
                  key={userId}
                  position={[p.x, 0, p.z]}
                  rotationY={rotationY}
                  attacking={p.attacking}
                  tick={state.tick}
                />
              ) : (
                <PlayerMarker key={userId} position={[p.x, 0, p.z]} rotationY={rotationY} playerIndex={index} />
              );
            })}
          </>
        ) : (
          <>
            {/* 接続待ちの仮表示：自分（手前左）と相手（奥右）を向かい合わせる */}
            {/* デモとして片方に攻撃モーション、もう片方に待機モーションを再生する */}
            <VrmAvatar
              url={DEFAULT_VRM_URL}
              position={[-0.8, 0, 0.3]}
              rotationY={Math.PI / 2}
              idleAnimationUrl={IDLE_VRMA_URL}
              actionAnimationUrl={ATTACK_VRMA_URL}
            />
            <VrmAvatar
              url={DEFAULT_VRM_URL}
              position={[0.8, 0, -0.3]}
              rotationY={-Math.PI / 2}
              idleAnimationUrl={IDLE_VRMA_URL}
            />
          </>
        )}
      </Suspense>

      {/* 自プレイヤーを斜め後ろ上から追従するカメラ */}
      <CameraFollower target={selfState} />
    </Canvas>
  );
}
