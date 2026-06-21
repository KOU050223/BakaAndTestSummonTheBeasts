import type { AnimationAction } from "three";

export type AnimationLayerSlot = {
  base: AnimationAction | null;
  overlays: AnimationAction[];
  activeOverlayIndex: number;
};

/**
 * Three.js AnimationAction の T ポーズ防止ユーティリティ。
 *
 * Skyrim / ゲーム全般の T ポーズ（[参考](https://www.quora.com/Why-are-t-posing-characters-a-common-bug-in-video-games)）:
 * - スケルトンの bind/rest pose が T 字。有効なアニメーションが骨を駆動しないとここに戻る。
 * - Skyrim ではアニメ registry / behavior graph の不整合で「どのモーションも適用されない」状態になる。
 *
 * Three.js 固有（[forum](https://discourse.threejs.org/t/animationaction-crossfadeto-not-working/63467) / [公式例の修正](https://github.com/mrdoob/three.js/pull/24287)）:
 * - crossFade 中に全 action の effective weight ≈ 0 → bind pose（T ポーズ）
 * - crossFadeFrom 前に incoming の weight=1 が未設定だと T ポーズへフェードする
 * - 同一 action への reset + crossFade でも T ポーズが一瞬出る
 *
 * 対策（Skyrim の「常時 idle レイヤー」+ Three.js 公式 skinning 例）:
 * - base（スタンス）レイヤーは常に weight 1 で再生し続ける（骨格を常に駆動）
 * - overlay（攻撃）は fadeIn/fadeOut のみ。base を fadeOut しない
 * - overlay 連鎖は ping-pong 2 スロット + fadeOut/fadeIn（crossFadeFrom 不使用）
 */

export function getActiveOverlay(slot: AnimationLayerSlot): AnimationAction | null {
  return slot.overlays[slot.activeOverlayIndex] ?? null;
}

export function getInactiveOverlay(slot: AnimationLayerSlot): AnimationAction | null {
  if (slot.overlays.length < 2) return null;
  return slot.overlays[1 - slot.activeOverlayIndex] ?? null;
}

export function swapActiveOverlay(slot: AnimationLayerSlot): void {
  if (slot.overlays.length >= 2) {
    slot.activeOverlayIndex = 1 - slot.activeOverlayIndex;
  }
}

export function keepActionAlive(action: AnimationAction): void {
  action.enabled = true;
  if (!action.isRunning()) {
    action.play();
  }
}

/**
 * base レイヤーを常時 weight 1 で維持（Skyrim の常時 idle 登録に相当）。
 * VRMA 攻撃 clip が全ボーンをカバーしない場合、base が落ちると部分 T ポーズになる。
 */
export function enforceBaseLayer(slot: AnimationLayerSlot): void {
  const base = slot.base;
  if (!base) return;
  keepActionAlive(base);
  if (base.getEffectiveWeight() < 1) {
    base.setEffectiveWeight(1);
  }
}

/** Three.js 公式 skinning 例: reset → weight 1 → fadeIn → play */
export function fadeInOverlayAction(action: AnimationAction, durationSec: number): void {
  action.stopFading();
  action.stopWarping();
  action.enabled = true;
  action.reset().setEffectiveWeight(1).fadeIn(durationSec).play();
}

export function fadeOutOverlayAction(action: AnimationAction, durationSec: number): void {
  keepActionAlive(action);
  action.fadeOut(durationSec);
}

/**
 * overlay A → overlay B（攻撃→攻撃）。
 * 同一 action への遷移はスキップ（Three.js 公式例 PR #24287）。
 */
export function transitionOverlayActions(
  incoming: AnimationAction,
  outgoing: AnimationAction,
  durationSec: number,
): void {
  if (incoming === outgoing) return;

  keepActionAlive(outgoing);
  outgoing.fadeOut(durationSec);
  fadeInOverlayAction(incoming, durationSec);
}

export function shouldChainOverlayEarly(
  overlayTime: number,
  clipDuration: number,
  leadSec: number,
  hasPendingChain: boolean,
): boolean {
  if (!hasPendingChain || clipDuration <= 0) return false;
  const lead = Math.max(leadSec, 1 / 30);
  return overlayTime >= clipDuration - lead;
}

export function reinforceMinimumPoseWeight(
  slot: AnimationLayerSlot,
  minTotalWeight = 0.05,
): void {
  enforceBaseLayer(slot);

  const candidates = [
    slot.base,
    getActiveOverlay(slot),
    ...slot.overlays,
  ].filter((a): a is AnimationAction => a !== null);

  const total = candidates.reduce((sum, a) => sum + a.getEffectiveWeight(), 0);
  if (total >= minTotalWeight) return;

  const fallback = slot.base ?? getActiveOverlay(slot) ?? slot.overlays[0];
  if (!fallback) return;

  keepActionAlive(fallback);
  fallback.setEffectiveWeight(1);
}

export function silenceInactiveOverlays(slot: AnimationLayerSlot): void {
  const active = getActiveOverlay(slot);
  for (const overlay of slot.overlays) {
    if (overlay === active) continue;
    keepActionAlive(overlay);
    if (overlay.getEffectiveWeight() <= 0.001) {
      overlay.setEffectiveWeight(0);
    }
  }
}
