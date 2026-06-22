"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import { VrmAvatar } from "./VrmAvatar";
import { BattleFloor } from "./BattleFloor";
import { FieldZones } from "./FieldZones";
import { SenseiModel } from "./SenseiModel";
import {
  ARENA_GRID_CELL_SIZE,
  ARENA_GRID_SECTION_SIZE,
  computeGridHalfExtent,
} from "@/lib/battle/battleArena";
import type { StateMessage, PlayerState } from "@/lib/battle/wsSchema";
import { goAngleToThreeRotationY } from "@/lib/battle/coords";

// 陣営で色を分ける。自チーム（自分含む）は青、相手チームは赤。
const ALLY_COLOR = "#60a5fa";
const ENEMY_COLOR = "#f87171";

// 自分と同じ陣営かを判定する。teamId が空（1:1・無所属）の場合は
// 自分自身だけを味方扱いにする。
function isAllyOf(player: PlayerState, self: PlayerState | undefined): boolean {
  if (!self) return false;
  if (self.teamId === "" || player.teamId === "") return player === self;
  return player.teamId === self.teamId;
}

type PlayerMarkerProps = {
  position: [number, number, number];
  rotationY: number;
  ally: boolean;
};

// 未召喚プレイヤーの位置・向きを床マーカーで示す。
// 薄い円盤（足元の存在感）＋小さな三角形（向き）で構成する。
function PlayerMarker({ position, rotationY, ally }: PlayerMarkerProps) {
  const color = ally ? ALLY_COLOR : ENEMY_COLOR;
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
  // サーバー権威: クールダウンを通過した攻撃入力があった tick のみ true。
  attacking: boolean;
  // 現在の tick。攻撃モーションの再トリガーキーに使う。
  tick: number;
};

function BattleAvatar({ position, rotationY, attacking, tick }: BattleAvatarProps) {
  const [lastAttackTick, setLastAttackTick] = useState<number | null>(null);

  useEffect(() => {
    if (attacking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- server tick edge for actionKey
      setLastAttackTick((prev) => (tick !== prev ? tick : prev));
    }
  }, [attacking, tick]);

  return (
    <VrmAvatar
      url={DEFAULT_VRM_URL}
      position={position}
      rotationY={rotationY}
      animationProfile="combat"
      actionAnimationUrl={ATTACK_VRMA_URL}
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

      {/* 床グリッド: ワールド XZ = サーバー座標。フィールド円と 1:1 整合 */}
      {state ? (
        <BattleFloor fields={state.fields} />
      ) : (
        <Grid
          args={[computeGridHalfExtent(0) * 2, computeGridHalfExtent(0) * 2]}
          cellSize={ARENA_GRID_CELL_SIZE}
          sectionSize={ARENA_GRID_SECTION_SIZE}
          cellColor="#3b4a6b"
          sectionColor="#5b6ea3"
          fadeDistance={computeGridHalfExtent(0) * 3}
          fadeStrength={1}
          fadeFrom={1}
          position={[0, 0, 0]}
        />
      )}

      <Suspense fallback={null}>
        {state ? (
          <>
            {/* 科目フィールド円 */}
            <FieldZones fields={state.fields} />
            {/* 各科目フィールド円の中心に先生を立たせる。中心を向くようカメラ側（-Z）へ向ける */}
            {state.fields.map((f) => (
              <SenseiModel
                key={f.subject}
                position={[f.centerX, 0, f.centerZ]}
                rotationY={Math.PI}
              />
            ))}
            {/* プレイヤーをサーバー権威の位置・向きで配置。召喚済みは VRM、未召喚は床マーカー */}
            {/* goAngleToThreeRotationY で Go 座標系 → Three.js 座標系に変換する */}
            {players.map(([userId, p]) => {
              // 戦闘不能のプレイヤーは場から除外されるので描画しない。
              if (p.defeated) return null;
              const rotationY = goAngleToThreeRotationY(p.angle);
              const ally = isAllyOf(p, selfState);
              return p.summoned ? (
                <group key={userId}>
                  {/* 陣営を示す足元リング（自=青 / 敵=赤） */}
                  <mesh position={[p.x, 0.015, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.32, 0.42, 32]} />
                    <meshBasicMaterial color={ally ? ALLY_COLOR : ENEMY_COLOR} transparent opacity={0.7} />
                  </mesh>
                  <BattleAvatar
                    position={[p.x, 0, p.z]}
                    rotationY={rotationY}
                    attacking={p.attacking}
                    tick={state.tick}
                  />
                </group>
              ) : (
                <PlayerMarker key={userId} position={[p.x, 0, p.z]} rotationY={rotationY} ally={ally} />
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
              actionKey={0}
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
