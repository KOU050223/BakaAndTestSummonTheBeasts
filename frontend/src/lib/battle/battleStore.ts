import { create } from "zustand";
import type { FinishedMessage, StateMessage } from "./wsSchema";

// バトルの受信状態を保持する Zustand ストア。
// Go サーバー権威の state スナップショットと finished をここに集約し、
// HUD・3Dシーン・結果画面が購読する。クライアント側で状態を加工しない
// （補間も MVP では行わない）。
type BattleStore = {
  // 最新の state スナップショット（未受信は null）。
  state: StateMessage | null;
  // 決着通知（未決着は null）。
  finished: FinishedMessage | null;
  // WebSocket 接続済みか。
  connected: boolean;

  applyState: (state: StateMessage) => void;
  applyFinished: (finished: FinishedMessage) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
};

const initialState = {
  state: null,
  finished: null,
  connected: false,
} satisfies Pick<BattleStore, "state" | "finished" | "connected">;

export const useBattleStore = create<BattleStore>((set, get) => ({
  ...initialState,

  applyState: (state) => {
    // 順序が前後したスナップショットは捨て、最新 tick のみを保持する。
    const current = get().state;
    if (current && state.tick < current.tick) return;
    set({ state });
  },

  applyFinished: (finished) => set({ finished }),

  setConnected: (connected) => set({ connected }),

  reset: () => set({ ...initialState }),
}));
