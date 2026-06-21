import { describe, expect, it } from "vitest";
import {
  CHAINED_OVERLAY_POLICY,
  OverlayTransitionController,
  STRICT_OVERLAY_POLICY,
  isRecoverComplete,
  resolvePendingOverlayKey,
} from "./overlayTransition";

describe("resolvePendingOverlayKey", () => {
  it("未再生の保留キーのみ返す", () => {
    expect(resolvePendingOverlayKey(undefined, 1)).toBeUndefined();
    expect(resolvePendingOverlayKey(2, 2)).toBeUndefined();
    expect(resolvePendingOverlayKey(3, 2)).toBe(3);
  });
});

describe("isRecoverComplete", () => {
  it("weight 閾値で recovering 完了を判定する", () => {
    const policy = CHAINED_OVERLAY_POLICY;
    expect(isRecoverComplete(policy, 0, 1)).toBe(true);
    expect(isRecoverComplete(policy, 0.5, 0.5)).toBe(false);
  });
});

describe("OverlayTransitionController", () => {
  it("base から overlay を即開始できる", () => {
    const ctrl = new OverlayTransitionController(CHAINED_OVERLAY_POLICY);
    expect(ctrl.request(1)).toEqual({ kind: "play_from_base", key: 1 });
    ctrl.markOverlayStarted(1);
    expect(ctrl.phase).toBe("overlay");
  });

  it("CHAINED: overlay 中の再入力で即 play_chain（攻撃中再攻撃）", () => {
    const ctrl = new OverlayTransitionController(CHAINED_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    expect(ctrl.request(2)).toEqual({
      kind: "play_chain",
      key: 2,
      holdOutgoingEnd: false,
    });
  });

  it("STRICT: overlay 中はキューのみ", () => {
    const ctrl = new OverlayTransitionController(STRICT_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    expect(ctrl.request(2)).toEqual({ kind: "queue", key: 2 });
  });

  it("overlay 終了時に保留があれば recover をスキップして連鎖する", () => {
    const ctrl = new OverlayTransitionController(STRICT_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    ctrl.request(2);
    expect(ctrl.onOverlayEnded()).toEqual({
      kind: "play_chain",
      key: 2,
      holdOutgoingEnd: true,
    });
    expect(ctrl.phase).toBe("overlay");
  });

  it("overlay 終了時に保留がなければ recover へ遷移する", () => {
    const ctrl = new OverlayTransitionController(CHAINED_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    expect(ctrl.onOverlayEnded()).toEqual({ kind: "start_recover" });
    expect(ctrl.phase).toBe("recovering");
  });

  it("recovering 中は割り込み連鎖できる", () => {
    const ctrl = new OverlayTransitionController(CHAINED_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    ctrl.onOverlayEnded();
    expect(ctrl.request(5)).toEqual({
      kind: "play_chain",
      key: 5,
      holdOutgoingEnd: false,
    });
  });

  it("STRICT では recover 完了まで次を base 起点で再生する", () => {
    const ctrl = new OverlayTransitionController(STRICT_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    ctrl.request(2);
    expect(ctrl.onOverlayEnded()).toEqual({ kind: "start_recover" });
    expect(ctrl.onRecoverComplete()).toEqual({ kind: "play_from_base", key: 2 });
  });

  it("STRICT ポリシーでは recovering 中はキューのみ", () => {
    const ctrl = new OverlayTransitionController(STRICT_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    ctrl.onOverlayEnded();
    expect(ctrl.request(4)).toEqual({ kind: "queue", key: 4 });
  });

  it("hasPendingChain は STRICT で保留キーがあるとき true", () => {
    const ctrl = new OverlayTransitionController(STRICT_OVERLAY_POLICY);
    ctrl.markOverlayStarted(1);
    ctrl.request(2);
    expect(ctrl.hasPendingChain()).toBe(true);
    ctrl.onOverlayEnded();
    expect(ctrl.hasPendingChain()).toBe(false);
  });
});
