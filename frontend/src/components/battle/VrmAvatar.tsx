"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer, LoopOnce, LoopRepeat, Vector3 } from "three";
import type { AnimationAction, Group } from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
} from "@pixiv/three-vrm-animation";
import {
  type AvatarAnimationProfile,
  createCombatStanceClip,
  getAvatarOverlayPolicy,
} from "@/lib/battle/avatarAnimation";
import { lerpAngleY } from "@/lib/battle/coords";
import {
  OverlayTransitionController,
  isRecoverComplete,
  type OverlayPlaybackDecision,
} from "@/lib/battle/overlayTransition";
import {
  enforceBaseLayer,
  getActiveOverlay,
  reinforceMinimumPoseWeight,
  shouldChainOverlayEarly,
  silenceInactiveOverlays,
  type AnimationLayerSlot,
} from "@/lib/battle/threeAnimationGuard";
import {
  cloneOverlayClipForPingPong,
  isOverlayClipFullyEnded,
  playOverlayChain,
  playOverlayFromBase,
  recoverBaseFromOverlay,
  reinforceBaseWeight,
} from "@/lib/battle/threeOverlayPlayback";

const AVATAR_LERP = 0.15;

const EMPTY_LAYER_SLOT: AnimationLayerSlot = {
  base: null,
  overlays: [],
  activeOverlayIndex: 0,
};

type VrmAvatarProps = {
  url: string;
  position?: [number, number, number];
  rotationY?: number;
  animationProfile?: AvatarAnimationProfile;
  idleAnimationUrl?: string;
  actionAnimationUrl?: string;
  actionKey?: string | number;
};

export function VrmAvatar({
  url,
  position = [0, 0, 0],
  rotationY = 0,
  animationProfile = "showcase",
  idleAnimationUrl,
  actionAnimationUrl,
  actionKey,
}: VrmAvatarProps) {
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [overlayReady, setOverlayReady] = useState(false);
  const [baseReady, setBaseReady] = useState(false);
  const groupRef = useRef<Group>(null);

  const mixerRef = useRef<AnimationMixer | null>(null);
  const layerSlotRef = useRef<AnimationLayerSlot>({ ...EMPTY_LAYER_SLOT });
  const overlaySystemRef = useRef({
    controller: new OverlayTransitionController(getAvatarOverlayPolicy("showcase")),
  });
  const onOverlayFinishedRef = useRef<((e: { action: AnimationAction }) => void) | null>(null);
  const processedActionKeyRef = useRef<string | number | undefined>(undefined);

  const targetPositionRef = useRef(new Vector3(...position));
  const targetRotationYRef = useRef(rotationY);
  const currentRotationYRef = useRef(rotationY);
  const needsSnapRef = useRef(true);

  useEffect(() => {
    targetPositionRef.current.set(position[0], position[1], position[2]);
    targetRotationYRef.current = rotationY;
  }, [position, rotationY]);

  const loader = useMemo(() => {
    const l = new GLTFLoader();
    l.register((parser) => new VRMLoaderPlugin(parser));
    l.register((parser) => new VRMAnimationLoaderPlugin(parser));
    return l;
  }, []);

  const getPolicy = () => getAvatarOverlayPolicy(animationProfile);

  const detachOverlayFinishedListener = () => {
    const mixer = mixerRef.current;
    const handler = onOverlayFinishedRef.current;
    if (mixer && handler) {
      mixer.removeEventListener("finished", handler);
      onOverlayFinishedRef.current = null;
    }
  };

  const resetLayerSlot = () => {
    layerSlotRef.current = { ...EMPTY_LAYER_SLOT };
  };

  const resetOverlaySystem = () => {
    detachOverlayFinishedListener();
    overlaySystemRef.current.controller.reset();
    processedActionKeyRef.current = undefined;
    resetLayerSlot();
  };

  const attachOverlayFinishedListener = () => {
    const mixer = mixerRef.current;
    const overlay = getActiveOverlay(layerSlotRef.current);
    if (!mixer || !overlay) return;

    detachOverlayFinishedListener();

    const onFinished = (e: { action: AnimationAction }) => {
      const active = getActiveOverlay(layerSlotRef.current);
      if (!active || e.action !== active) return;
      applyOverlayDecision(overlaySystemRef.current.controller.onOverlayEnded());
    };
    onOverlayFinishedRef.current = onFinished;
    mixer.addEventListener("finished", onFinished);
  };

  const applyOverlayDecision = (decision: OverlayPlaybackDecision) => {
    const slot = layerSlotRef.current;
    const policy = getPolicy();
    const controller = overlaySystemRef.current.controller;

    switch (decision.kind) {
      case "ignore":
      case "queue":
        break;
      case "play_from_base":
        playOverlayFromBase(slot, policy.enterOverlaySec);
        controller.markOverlayStarted(decision.key);
        attachOverlayFinishedListener();
        break;
      case "play_chain": {
        const chainSec = decision.holdOutgoingEnd
          ? policy.enterOverlaySec
          : (policy.interruptOverlaySec ?? policy.enterOverlaySec * 0.5);
        playOverlayChain(slot, chainSec);
        controller.markOverlayStarted(decision.key);
        attachOverlayFinishedListener();
        break;
      }
      case "start_recover":
        recoverBaseFromOverlay(slot, policy.exitOverlaySec);
        break;
    }
  };

  useEffect(() => {
    overlaySystemRef.current.controller.setPolicy(getPolicy());
  }, [animationProfile]);

  useEffect(() => {
    let disposed = false;
    let loaded: VRM | null = null;

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const loadedVrm = gltf.userData.vrm as VRM;
        VRMUtils.removeUnnecessaryVertices(loadedVrm.scene);
        VRMUtils.removeUnnecessaryJoints(loadedVrm.scene);
        loadedVrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });
        if (loadedVrm.lookAt) {
          const lookAtProxy = new VRMLookAtQuaternionProxy(loadedVrm.lookAt);
          lookAtProxy.name = "lookAtQuaternionProxy";
          loadedVrm.scene.add(lookAtProxy);
        }

        loaded = loadedVrm;
        mixerRef.current = new AnimationMixer(loadedVrm.scene);
        resetOverlaySystem();
        needsSnapRef.current = true;
        setVrm(loadedVrm);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load VRM:", url, error);
      },
    );

    return () => {
      disposed = true;
      resetOverlaySystem();
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      setOverlayReady(false);
      setBaseReady(false);
      if (loaded) {
        VRMUtils.deepDispose(loaded.scene);
      }
    };
  }, [loader, url]);

  useEffect(() => {
    if (animationProfile !== "showcase" || !vrm || !mixerRef.current || !idleAnimationUrl) {
      return;
    }
    let disposed = false;
    setBaseReady(false);

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
        layerSlotRef.current.base = action;
        setBaseReady(true);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load idle vrma:", idleAnimationUrl, error);
      },
    );

    return () => {
      disposed = true;
      const base = layerSlotRef.current.base;
      if (base) {
        base.stop();
        mixerRef.current?.uncacheClip(base.getClip());
        layerSlotRef.current.base = null;
      }
      setBaseReady(false);
    };
  }, [vrm, loader, idleAnimationUrl, animationProfile]);

  useEffect(() => {
    if (!vrm || !mixerRef.current || !actionAnimationUrl) return;
    const mixer = mixerRef.current;
    let disposed = false;

    setOverlayReady(false);
    if (animationProfile === "combat") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset base clip when overlay URL changes
      setBaseReady(false);
    }
    resetOverlaySystem();

    loader.load(
      actionAnimationUrl,
      (gltf) => {
        if (disposed || !vrm) return;
        const vrmAnimation = gltf.userData.vrmAnimations?.[0];
        if (!vrmAnimation) {
          console.warn("[VrmAvatar] no vrmAnimations in overlay:", actionAnimationUrl);
          return;
        }
        const clip = createVRMAnimationClip(vrmAnimation, vrm);
        const altClip = cloneOverlayClipForPingPong(clip);
        const overlayA = mixer.clipAction(clip);
        const overlayB = mixer.clipAction(altClip);
        for (const overlay of [overlayA, overlayB]) {
          overlay.setLoop(LoopOnce, 1);
          overlay.clampWhenFinished = true;
          overlay.zeroSlopeAtStart = true;
          overlay.zeroSlopeAtEnd = true;
        }
        layerSlotRef.current = {
          base: layerSlotRef.current.base,
          overlays: [overlayA, overlayB],
          activeOverlayIndex: 0,
        };

        if (animationProfile === "combat") {
          const stanceClip = createCombatStanceClip(clip);
          const base = mixer.clipAction(stanceClip);
          base.setLoop(LoopRepeat, Infinity);
          base.play();
          layerSlotRef.current.base = base;
          setBaseReady(true);
        }

        setOverlayReady(true);
      },
      undefined,
      (error) => {
        console.error("[VrmAvatar] failed to load overlay vrma:", actionAnimationUrl, error);
      },
    );

    return () => {
      disposed = true;
      const overlays = [...layerSlotRef.current.overlays];
      const base = layerSlotRef.current.base;
      detachOverlayFinishedListener();
      for (const overlay of overlays) {
        overlay.stop();
        mixer.uncacheClip(overlay.getClip());
      }
      if (base) {
        base.stop();
        mixer.uncacheClip(base.getClip());
      }
      resetLayerSlot();
      overlaySystemRef.current.controller.reset();
      if (animationProfile === "combat") {
        setBaseReady(false);
      }
      setOverlayReady(false);
    };
  }, [vrm, loader, actionAnimationUrl, animationProfile]);

  useEffect(() => {
    const needsBase = animationProfile === "combat" || Boolean(idleAnimationUrl);
    if (
      actionKey === undefined ||
      !overlayReady ||
      (needsBase && !baseReady) ||
      layerSlotRef.current.overlays.length === 0 ||
      !mixerRef.current
    ) {
      return;
    }
    if (processedActionKeyRef.current === actionKey) {
      return;
    }
    processedActionKeyRef.current = actionKey;

    applyOverlayDecision(overlaySystemRef.current.controller.request(actionKey));
  }, [actionKey, overlayReady, baseReady, animationProfile, idleAnimationUrl]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (needsSnapRef.current) {
        groupRef.current.position.copy(targetPositionRef.current);
        groupRef.current.rotation.y = targetRotationYRef.current;
        currentRotationYRef.current = targetRotationYRef.current;
        needsSnapRef.current = false;
      } else {
        groupRef.current.position.lerp(targetPositionRef.current, AVATAR_LERP);
        currentRotationYRef.current = lerpAngleY(
          currentRotationYRef.current,
          targetRotationYRef.current,
          AVATAR_LERP,
        );
        groupRef.current.rotation.y = currentRotationYRef.current;
      }
    }

    const slot = layerSlotRef.current;
    const controller = overlaySystemRef.current.controller;
    const policy = getPolicy();

    // 連鎖保留あり: clip 終了「前」に crossFade 開始（終了瞬間の weight 落ち → T ポーズを防ぐ）
    if (controller.phase === "overlay" && controller.hasPendingChain()) {
      const overlay = getActiveOverlay(slot);
      if (overlay) {
        const clip = overlay.getClip();
        if (
          shouldChainOverlayEarly(
            overlay.time,
            clip.duration,
            policy.enterOverlaySec,
            true,
          )
        ) {
          applyOverlayDecision(controller.onOverlayEnded());
        }
      }
    }

    mixerRef.current?.update(delta);

    enforceBaseLayer(slot);
    silenceInactiveOverlays(slot);
    reinforceMinimumPoseWeight(slot);

    if (controller.phase === "overlay") {
      const overlay = getActiveOverlay(slot);
      if (
        overlay &&
        isOverlayClipFullyEnded(overlay, controller.hasPendingChain())
      ) {
        applyOverlayDecision(controller.onOverlayEnded());
      }
    }

    if (controller.phase === "recovering") {
      const recoveringOverlay = getActiveOverlay(slot);
      if (
        slot.base &&
        recoveringOverlay &&
        isRecoverComplete(
          policy,
          recoveringOverlay.getEffectiveWeight(),
          slot.base.getEffectiveWeight(),
        )
      ) {
        applyOverlayDecision(controller.onRecoverComplete());
      }
    }

    if (controller.phase === "base") {
      reinforceBaseWeight(slot);
    }

    vrm?.update(delta);
  });

  if (!vrm) return null;

  return (
    <group ref={groupRef}>
      <primitive object={vrm.scene} />
    </group>
  );
}
