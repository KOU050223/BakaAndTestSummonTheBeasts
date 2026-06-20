import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useBattleStore } from "@/lib/battle/battleStore";
import type { StateMessage } from "@/lib/battle/wsSchema";

// 3D（Canvas / VRM 読み込み）は jsdom で動かないのでモックする。
vi.mock("./BattleScene", () => ({
  BattleScene: () => <div data-testid="battle-scene" />,
}));

// WebSocket フックはネットワークに触れるのでモック（sendInput を記録）。
const sendInput = vi.fn();
vi.mock("@/lib/battle/useBattleWebSocket", () => ({
  useBattleWebSocket: () => ({ sendInput }),
}));

import { BattleScreen } from "./BattleScreen";

const stateWithPlayers = (overrides?: Partial<StateMessage>): StateMessage => ({
  type: "state",
  tick: 10,
  fields: [],
  players: {
    "1": { x: 0, z: 0, angle: 0, currentSubject: "math", summoned: true, attacking: false, summons: { math: { hp: 100 } } },
    "2": { x: 1, z: 1, angle: 0, currentSubject: "math", summoned: true, attacking: false, summons: { math: { hp: 80 } } },
  },
  ...overrides,
});

const baseProps = { battleId: "1", token: "jwt", currentUserId: "1", onExit: vi.fn() };

describe("BattleScreen", () => {
  beforeEach(() => {
    useBattleStore.getState().reset();
    sendInput.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("state 未受信のときは待機オーバーレイを表示する", () => {
    render(<BattleScreen {...baseProps} />);

    expect(screen.getByText(/相手の入室を待っています/)).toBeInTheDocument();
  });

  it("state 受信後は HUD（自分の科目HP）を表示する", () => {
    useBattleStore.getState().applyState(stateWithPlayers());

    render(<BattleScreen {...baseProps} />);

    expect(screen.queryByText(/相手の入室を待っています/)).not.toBeInTheDocument();
    // 自分（userId=1）の科目別 HP が出る
    expect(screen.getByText(/数学/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("自分が勝者の finished で結果画面（WIN）を表示する", () => {
    useBattleStore.getState().applyState(stateWithPlayers());
    useBattleStore.getState().applyFinished({ type: "finished", winnerId: "1", loserId: "2" });

    render(<BattleScreen {...baseProps} />);

    expect(screen.getByText(/WIN/i)).toBeInTheDocument();
  });

  it("自分が敗者の finished で結果画面（LOSE）を表示する", () => {
    useBattleStore.getState().applyState(stateWithPlayers());
    useBattleStore.getState().applyFinished({ type: "finished", winnerId: "2", loserId: "1" });

    render(<BattleScreen {...baseProps} />);

    expect(screen.getByText(/LOSE/i)).toBeInTheDocument();
  });
});
