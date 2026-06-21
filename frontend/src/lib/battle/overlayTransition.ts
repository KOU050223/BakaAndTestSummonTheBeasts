/**
 * ベースループ + ワンショット overlay の汎用遷移状態機械。
 *
 * バトル攻撃・展示 idle+action・将来の emote 等、
 * 「ループ base ↔ 単発 overlay」のペアに共通で使える。
 *
 *   base ──(enter)──> overlay ──(end)──> recovering ──(exit)──> base
 *
 * ポリシーで連鎖・割り込み・キューを切り替え可能。
 */

export type OverlayPhase = "base" | "overlay" | "recovering";

export type OverlayTransitionPolicy = {
  /** base → overlay の crossFade 秒数 */
  enterOverlaySec: number;
  /** overlay → base の crossFade 秒数 */
  exitOverlaySec: number;
  /** overlay 再生中のリクエストを最新 1 件だけ保留する（interruptOverlay が false のとき） */
  queueWhileOverlay: boolean;
  /** overlay 再生中に即次 overlay へ crossFade（攻撃中に再攻撃） */
  interruptOverlay: boolean;
  /** overlay 割り込み時の crossFade 秒数（未指定時は enterOverlaySec の半分） */
  interruptOverlaySec?: number;
  /** overlay 終了時、保留があれば recover をスキップして連鎖する */
  chainOnOverlayEnd: boolean;
  /** recovering 中のリクエストで即 overlay へ割り込む */
  interruptRecovering: boolean;
  /** recovering 完了判定: overlay weight がこの値未満 */
  overlayWeightThreshold: number;
  /** recovering 完了判定: base weight がこの値より大 */
  baseWeightThreshold: number;
};

export type OverlayRequestKey = string | number;

export type OverlayPlaybackDecision =
  | { kind: "ignore" }
  | { kind: "play_from_base"; key: OverlayRequestKey }
  | { kind: "play_chain"; key: OverlayRequestKey; holdOutgoingEnd?: boolean }
  | { kind: "queue"; key: OverlayRequestKey }
  | { kind: "start_recover" };

export function resolvePendingOverlayKey(
  pending: OverlayRequestKey | undefined,
  lastPlayed: OverlayRequestKey | undefined,
): OverlayRequestKey | undefined {
  if (pending === undefined) return undefined;
  if (pending === lastPlayed) return undefined;
  return pending;
}

export function isRecoverComplete(
  policy: OverlayTransitionPolicy,
  overlayWeight: number,
  baseWeight: number,
): boolean {
  return (
    overlayWeight < policy.overlayWeightThreshold &&
    baseWeight > policy.baseWeightThreshold
  );
}

export class OverlayTransitionController {
  phase: OverlayPhase = "base";
  lastPlayedKey: OverlayRequestKey | undefined;
  pendingKey: OverlayRequestKey | undefined;

  constructor(private policy: OverlayTransitionPolicy) {}

  setPolicy(policy: OverlayTransitionPolicy): void {
    this.policy = policy;
  }

  reset(): void {
    this.phase = "base";
    this.lastPlayedKey = undefined;
    this.pendingKey = undefined;
  }

  /** 外部から overlay 再生開始を通知（Three.js 側が実際に play した後）。 */
  markOverlayStarted(key: OverlayRequestKey): void {
    this.lastPlayedKey = key;
    this.phase = "overlay";
  }

  /** overlay トリガー（actionKey 等）を受け取り、次に実行すべき操作を返す。 */
  request(key: OverlayRequestKey): OverlayPlaybackDecision {
    if (key === this.lastPlayedKey) {
      return { kind: "ignore" };
    }

    switch (this.phase) {
      case "base":
        return { kind: "play_from_base", key };
      case "overlay":
        if (this.policy.interruptOverlay) {
          this.pendingKey = undefined;
          return { kind: "play_chain", key, holdOutgoingEnd: false };
        }
        if (this.policy.queueWhileOverlay) {
          this.pendingKey = key;
          return { kind: "queue", key };
        }
        return { kind: "ignore" };
      case "recovering":
        if (this.policy.interruptRecovering) {
          this.pendingKey = undefined;
          return { kind: "play_chain", key, holdOutgoingEnd: false };
        }
        this.pendingKey = key;
        return { kind: "queue", key };
    }
  }

  /** overlay clip が終了したとき。連鎖 or recover 開始を決める。 */
  onOverlayEnded(): OverlayPlaybackDecision {
    if (this.phase !== "overlay") {
      return { kind: "ignore" };
    }

    const chainKey = this.policy.chainOnOverlayEnd
      ? resolvePendingOverlayKey(this.pendingKey, this.lastPlayedKey)
      : undefined;

    if (chainKey !== undefined) {
      this.pendingKey = undefined;
      return { kind: "play_chain", key: chainKey, holdOutgoingEnd: true };
    }

    this.phase = "recovering";
    return { kind: "start_recover" };
  }

  /** recovering の crossFade が完了したとき。保留があれば base 起点で再生。 */
  onRecoverComplete(): OverlayPlaybackDecision {
    if (this.phase !== "recovering") {
      return { kind: "ignore" };
    }

    this.phase = "base";
    const nextKey = resolvePendingOverlayKey(this.pendingKey, this.lastPlayedKey);
    this.pendingKey = undefined;

    if (nextKey !== undefined) {
      return { kind: "play_from_base", key: nextKey };
    }
    return { kind: "ignore" };
  }

  markRecoverStarted(): void {
    if (this.phase === "overlay") {
      this.phase = "recovering";
    }
  }

  /** 保留中の連鎖 overlay があるか（lastPlayed と異なる pending）。 */
  hasPendingChain(): boolean {
    if (!this.policy.chainOnOverlayEnd) return false;
    return resolvePendingOverlayKey(this.pendingKey, this.lastPlayedKey) !== undefined;
  }
}

/** 攻撃連鎖向け: 攻撃中の再入力で即 crossFade、recovering 中も割り込み可。 */
export const CHAINED_OVERLAY_POLICY: OverlayTransitionPolicy = {
  enterOverlaySec: 0.15,
  exitOverlaySec: 0.22,
  queueWhileOverlay: false,
  interruptOverlay: true,
  interruptOverlaySec: 0.08,
  chainOnOverlayEnd: true,
  interruptRecovering: true,
  overlayWeightThreshold: 0.01,
  baseWeightThreshold: 0.9,
};

/** 単発 overlay のみ: 終了まで次を受け付けず、必ず base へ戻る。 */
export const STRICT_OVERLAY_POLICY: OverlayTransitionPolicy = {
  enterOverlaySec: 0.15,
  exitOverlaySec: 0.22,
  queueWhileOverlay: true,
  interruptOverlay: false,
  chainOnOverlayEnd: false,
  interruptRecovering: false,
  overlayWeightThreshold: 0.01,
  baseWeightThreshold: 0.9,
};

/** キュー後に overlay 終了で連鎖する（展示向け等）。 */
export const QUEUE_CHAIN_OVERLAY_POLICY: OverlayTransitionPolicy = {
  ...STRICT_OVERLAY_POLICY,
  chainOnOverlayEnd: true,
};
