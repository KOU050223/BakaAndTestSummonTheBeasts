import { AnimationUtils } from "three";
import type { AnimationClip } from "three";
import {
  CHAINED_OVERLAY_POLICY,
  type OverlayTransitionPolicy,
} from "./overlayTransition";

/**
 * バトル用アバターアニメーション方針:
 *
 * - `model_pose.vrma` は展示用の直立ポーズ。攻撃 clip と weight ブレンドすると
 *   常に直立へ引き戻され、追従・クロスフェードでは解決できない。
 * - バトルでは攻撃 clip と同じ骨格の「スタンス区間」をループし、
 *   攻撃開始/終了は overlayTransition システムで base↔overlay を crossFade する。
 * - 展示（接続待ちデモ等）では外部 idle VRMA を base、攻撃を overlay に載せる。
 */
export type AvatarAnimationProfile = "combat" | "showcase";

export const COMBAT_STANCE_FPS = 30;
export const COMBAT_STANCE_END_FRAME = 10;
export const COMBAT_ATTACK_CROSSFADE_SEC = 0.15;
export const COMBAT_RECOVER_CROSSFADE_SEC = 0.22;

const SHOWCASE_ATTACK_CROSSFADE_SEC = 0.15;
const SHOWCASE_RECOVER_CROSSFADE_SEC = 0.22;

/** プロファイルごとの overlay 遷移ポリシー（攻撃連鎖対応）。 */
export function getAvatarOverlayPolicy(profile: AvatarAnimationProfile): OverlayTransitionPolicy {
  if (profile === "combat") {
    return {
      ...CHAINED_OVERLAY_POLICY,
      enterOverlaySec: COMBAT_ATTACK_CROSSFADE_SEC,
      exitOverlaySec: COMBAT_RECOVER_CROSSFADE_SEC,
      interruptOverlaySec: 0.08,
    };
  }
  return {
    ...CHAINED_OVERLAY_POLICY,
    enterOverlaySec: SHOWCASE_ATTACK_CROSSFADE_SEC,
    exitOverlaySec: SHOWCASE_RECOVER_CROSSFADE_SEC,
  };
}

export function createCombatStanceClip(source: AnimationClip): AnimationClip {
  const maxFrame = Math.max(1, Math.floor(source.duration * COMBAT_STANCE_FPS));
  const endFrame = Math.max(1, Math.min(COMBAT_STANCE_END_FRAME, maxFrame));
  return AnimationUtils.subclip(
    source,
    `${source.name}_combat_stance`,
    0,
    endFrame,
    COMBAT_STANCE_FPS,
  );
}
