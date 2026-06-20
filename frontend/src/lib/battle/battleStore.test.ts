import { beforeEach, describe, expect, it } from "vitest";
import { useBattleStore } from "./battleStore";
import type { StateMessage, FinishedMessage } from "./wsSchema";

const sampleState: StateMessage = {
  type: "state",
  tick: 10,
  fields: [{ subject: "math", centerX: 0, centerZ: 0, radius: 3 }],
  players: {
    "38": {
      x: 1,
      z: 2,
      angle: 0,
      currentSubject: "math",
      summoned: true,
      attacking: false,
      summons: { math: { hp: 100 } },
    },
  },
};

describe("battleStore", () => {
  beforeEach(() => {
    useBattleStore.getState().reset();
  });

  it("初期状態は state=null, finished=null, connected=false", () => {
    const s = useBattleStore.getState();
    expect(s.state).toBeNull();
    expect(s.finished).toBeNull();
    expect(s.connected).toBe(false);
  });

  it("applyState で最新スナップショットを保持する", () => {
    useBattleStore.getState().applyState(sampleState);

    expect(useBattleStore.getState().state).toEqual(sampleState);
  });

  it("applyState は古い tick で上書きせず最新を保つ", () => {
    useBattleStore.getState().applyState(sampleState);
    const older: StateMessage = { ...sampleState, tick: 5 };

    useBattleStore.getState().applyState(older);

    // 古い tick は無視され、最新（tick=10）が残る
    expect(useBattleStore.getState().state?.tick).toBe(10);
  });

  it("applyFinished で決着を保持する", () => {
    const fin: FinishedMessage = { type: "finished", winnerId: "38", loserId: "39" };

    useBattleStore.getState().applyFinished(fin);

    expect(useBattleStore.getState().finished).toEqual(fin);
  });

  it("setConnected で接続状態を更新する", () => {
    useBattleStore.getState().setConnected(true);
    expect(useBattleStore.getState().connected).toBe(true);
  });

  it("reset で初期状態に戻す", () => {
    useBattleStore.getState().applyState(sampleState);
    useBattleStore.getState().setConnected(true);

    useBattleStore.getState().reset();

    const s = useBattleStore.getState();
    expect(s.state).toBeNull();
    expect(s.finished).toBeNull();
    expect(s.connected).toBe(false);
  });
});
