import type { AnimationAction } from "three";
import {
  enforceBaseLayer,
  fadeInOverlayAction,
  fadeOutOverlayAction,
  getActiveOverlay,
  getInactiveOverlay,
  silenceInactiveOverlays,
  swapActiveOverlay,
  transitionOverlayActions,
  type AnimationLayerSlot,
} from "./threeAnimationGuard";

export type OverlayActionPair = AnimationLayerSlot;

/** clip を ping-pong 用に複製（同一 mixer で別 AnimationAction を得るため）。 */
export function cloneOverlayClipForPingPong<T extends { clone: () => T; name: string }>(
  clip: T,
): T {
  const alt = clip.clone();
  alt.name = `${clip.name}_alt`;
  return alt;
}

/** base 常時駆動 + overlay fadeIn（base は fadeOut しない）。 */
export function playOverlayFromBase(
  slot: AnimationLayerSlot,
  enterSec: number,
): void {
  const overlay = getActiveOverlay(slot);
  if (!overlay) return;

  enforceBaseLayer(slot);
  fadeInOverlayAction(overlay, enterSec);
  silenceInactiveOverlays(slot);
}

/** overlay → overlay 連鎖（攻撃→攻撃）。base は常時 weight 1。 */
export function playOverlayChain(
  slot: AnimationLayerSlot,
  enterSec: number,
): void {
  const outgoing = getActiveOverlay(slot);
  const incoming = getInactiveOverlay(slot);
  if (!outgoing) return;

  enforceBaseLayer(slot);

  if (incoming) {
    transitionOverlayActions(incoming, outgoing, enterSec);
    swapActiveOverlay(slot);
    return;
  }

  silenceInactiveOverlays(slot);
}

/** overlay fadeOut のみ。base は常時 weight 1 のまま。 */
export function recoverBaseFromOverlay(
  slot: AnimationLayerSlot,
  exitSec: number,
): void {
  const overlay = getActiveOverlay(slot);
  if (!overlay) return;

  enforceBaseLayer(slot);
  fadeOutOverlayAction(overlay, exitSec);
  silenceInactiveOverlays(slot);
}

export function isOverlayClipSettled(overlay: AnimationAction): boolean {
  const clip = overlay.getClip();
  return (
    clip.duration > 0 &&
    !overlay.isRunning() &&
    overlay.time >= clip.duration - 1e-4 &&
    overlay.getEffectiveWeight() > 0.01
  );
}

export function isOverlayClipFullyEnded(
  overlay: AnimationAction,
  hasPendingChain: boolean,
): boolean {
  if (hasPendingChain) return false;
  return isOverlayClipSettled(overlay);
}

export function reinforceBaseWeight(slot: AnimationLayerSlot): void {
  enforceBaseLayer(slot);
}
