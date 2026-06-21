import { describe, expect, it } from "vitest";
import { AnimationClip, NumberKeyframeTrack } from "three";
import { createCombatStanceClip, getAvatarOverlayPolicy } from "./avatarAnimation";
import { CHAINED_OVERLAY_POLICY } from "./overlayTransition";

describe("createCombatStanceClip", () => {
  it("攻撃 clip 先頭からスタンス subclip を作る", () => {
    const fps = 30;
    const endFrame = 10;
    const source = new AnimationClip("attack", endFrame / fps, [
      new NumberKeyframeTrack(".position[x]", [0, 5 / fps, (endFrame - 1) / fps], [0, 1, 2]),
    ]);
    const stance = createCombatStanceClip(source);
    expect(stance.name).toBe("attack_combat_stance");
    expect(stance.duration).toBeGreaterThan(0);
    expect(stance.duration).toBeLessThanOrEqual(source.duration);
  });
});

describe("getAvatarOverlayPolicy", () => {
  it("combat / showcase とも CHAINED ベースで crossFade 秒数だけ異なる", () => {
    const combat = getAvatarOverlayPolicy("combat");
    const showcase = getAvatarOverlayPolicy("showcase");
    expect(combat.chainOnOverlayEnd).toBe(CHAINED_OVERLAY_POLICY.chainOnOverlayEnd);
    expect(combat.enterOverlaySec).toBe(0.15);
    expect(combat.exitOverlaySec).toBe(0.22);
    expect(showcase.enterOverlaySec).toBe(0.15);
    expect(showcase.exitOverlaySec).toBe(0.22);
  });
});
