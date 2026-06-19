"use client";

import { useCallback, useEffect, useRef } from "react";
import { useBattleStore } from "./battleStore";
import { parseServerMessage, type InputMessage } from "./wsSchema";

type UseBattleWebSocketParams = {
  // ゲームサーバーのベース URL（例: ws://localhost:8080）。
  wsUrl: string;
  // 対象バトル ID。
  battleId: string;
  // Rails 発行の JWT。Go が共有シークレットで検証する。
  token: string;
};

// バトルの WebSocket 接続を管理するフック。
// - マウント時に ws://<wsUrl>/ws/battle?token=&battleId= へ接続する。
// - 受信した state/finished を zod 検証してストアへ流す。不正メッセージは無視する。
// - sendInput で input メッセージを送る（接続中のみ）。
// - アンマウント時に切断する。
export function useBattleWebSocket({ wsUrl, battleId, token }: UseBattleWebSocketParams) {
  const wsRef = useRef<WebSocket | null>(null);
  const applyState = useBattleStore((s) => s.applyState);
  const applyFinished = useBattleStore((s) => s.applyFinished);
  const setConnected = useBattleStore((s) => s.setConnected);

  useEffect(() => {
    const url = `${wsUrl}/ws/battle?token=${encodeURIComponent(token)}&battleId=${encodeURIComponent(battleId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (ev: MessageEvent) => {
      let msg;
      try {
        msg = parseServerMessage(ev.data as string);
      } catch {
        // 不正・未知のメッセージは握りつぶす（ログのみ）。
        console.warn("[useBattleWebSocket] invalid message dropped");
        return;
      }
      if (msg.type === "state") applyState(msg);
      else if (msg.type === "finished") applyFinished(msg);
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [wsUrl, battleId, token, applyState, applyFinished, setConnected]);

  const sendInput = useCallback((input: InputMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(input));
  }, []);

  return { sendInput };
}
