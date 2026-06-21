import { describe, expect, it } from "vitest";
import {
  getActiveOverlay,
  getInactiveOverlay,
  shouldChainOverlayEarly,
  swapActiveOverlay,
  type AnimationLayerSlot,
} from "./threeAnimationGuard";

function mockSlot(overlayCount: 1 | 2): AnimationLayerSlot {
  const overlays = Array.from({ length: overlayCount }, (_, i) => ({
    id: i,
  })) as unknown as AnimationLayerSlot["overlays"];
  return { base: null, overlays, activeOverlayIndex: 0 };
}

describe("AnimationLayerSlot ping-pong", () => {
  it("active / inactive overlay を取得できる", () => {
    const slot = mockSlot(2);
    expect(getActiveOverlay(slot)).toBe(slot.overlays[0]);
    expect(getInactiveOverlay(slot)).toBe(slot.overlays[1]);
    swapActiveOverlay(slot);
    expect(getActiveOverlay(slot)).toBe(slot.overlays[1]);
    expect(getInactiveOverlay(slot)).toBe(slot.overlays[0]);
  });

  it("単スロットでは inactive は null", () => {
    const slot = mockSlot(1);
    expect(getInactiveOverlay(slot)).toBeNull();
    swapActiveOverlay(slot);
    expect(slot.activeOverlayIndex).toBe(0);
  });
});

describe("shouldChainOverlayEarly", () => {
  it("保留連鎖ありかつ終了 lead 秒前で true", () => {
    expect(shouldChainOverlayEarly(1.0, 1.15, 0.15, true)).toBe(true);
    expect(shouldChainOverlayEarly(0.5, 1.15, 0.15, true)).toBe(false);
    expect(shouldChainOverlayEarly(1.0, 1.15, 0.15, false)).toBe(false);
  });
});
