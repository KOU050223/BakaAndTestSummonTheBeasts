import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useBattleWebSocket } from "./useBattleWebSocket";
import { useBattleStore } from "./battleStore";
import { buildInputMessage } from "./wsSchema";

// テスト用の最小 WebSocket モック。送信内容を記録し、サーバー受信を疑似発火できる。
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.OPEN;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // --- テスト操作用ヘルパ ---
  emitOpen() {
    this.onopen?.();
  }
  emitMessage(obj: unknown) {
    this.onmessage?.({ data: JSON.stringify(obj) });
  }
}

describe("useBattleWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
    useBattleStore.getState().reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const params = { wsUrl: "ws://localhost:8080", battleId: "1", token: "jwt" };

  it("マウント時に battleId/token を含む URL で接続する", () => {
    renderHook(() => useBattleWebSocket(params));

    expect(MockWebSocket.instances).toHaveLength(1);
    const url = MockWebSocket.instances[0].url;
    expect(url).toContain("ws://localhost:8080/ws/battle");
    expect(url).toContain("battleId=1");
    expect(url).toContain("token=jwt");
  });

  it("onopen で connected=true になる", () => {
    renderHook(() => useBattleWebSocket(params));

    act(() => MockWebSocket.instances[0].emitOpen());

    expect(useBattleStore.getState().connected).toBe(true);
  });

  it("state メッセージ受信でストアに反映する", () => {
    renderHook(() => useBattleWebSocket(params));
    act(() => MockWebSocket.instances[0].emitOpen());

    act(() =>
      MockWebSocket.instances[0].emitMessage({
        type: "state",
        tick: 5,
        fields: [],
        players: {},
      }),
    );

    expect(useBattleStore.getState().state?.tick).toBe(5);
  });

  it("finished メッセージ受信でストアに反映する", () => {
    renderHook(() => useBattleWebSocket(params));
    act(() => MockWebSocket.instances[0].emitOpen());

    act(() =>
      MockWebSocket.instances[0].emitMessage({ type: "finished", winnerId: "1", loserId: "2" }),
    );

    expect(useBattleStore.getState().finished?.winnerId).toBe("1");
  });

  it("不正なメッセージは握りつぶしてストアを変更しない", () => {
    renderHook(() => useBattleWebSocket(params));
    act(() => MockWebSocket.instances[0].emitOpen());

    act(() => MockWebSocket.instances[0].emitMessage({ type: "bogus" }));

    expect(useBattleStore.getState().state).toBeNull();
    expect(useBattleStore.getState().finished).toBeNull();
  });

  it("sendInput で input メッセージを送信する", () => {
    const { result } = renderHook(() => useBattleWebSocket(params));
    act(() => MockWebSocket.instances[0].emitOpen());

    act(() => result.current.sendInput(buildInputMessage({ attack: true })));

    const sent = JSON.parse(MockWebSocket.instances[0].sent[0]);
    expect(sent.type).toBe("input");
    expect(sent.attack).toBe(true);
  });

  it("未接続（CLOSED）では送信しない", () => {
    const { result } = renderHook(() => useBattleWebSocket(params));
    MockWebSocket.instances[0].readyState = MockWebSocket.CLOSED;

    act(() => result.current.sendInput(buildInputMessage({ attack: true })));

    expect(MockWebSocket.instances[0].sent).toHaveLength(0);
  });

  it("アンマウントで WebSocket を閉じる", () => {
    const { unmount } = renderHook(() => useBattleWebSocket(params));
    const ws = MockWebSocket.instances[0];

    unmount();

    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });
});
