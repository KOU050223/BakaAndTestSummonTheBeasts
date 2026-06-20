"use client";

import { useCallback, useEffect, useRef } from "react";
import { BattleScene } from "./BattleScene";
import { BattleHUD } from "./BattleHUD";
import { WaitingOverlay } from "./WaitingOverlay";
import { BattleResultScreen } from "./BattleResultScreen";
import { useBattleStore } from "@/lib/battle/battleStore";
import { useBattleWebSocket } from "@/lib/battle/useBattleWebSocket";
import { buildInputMessage, type MoveInput } from "@/lib/battle/wsSchema";

// 入力送信レート（30Hz = サーバー tick に合わせる）。
const INPUT_INTERVAL_MS = 1000 / 30;

// ゲームサーバーの WebSocket ベース URL。未設定ならローカル既定。
const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:8080";

type BattleScreenProps = {
  // 対象バトル ID。
  battleId: string;
  // Rails 発行の JWT（Go が検証）。
  token: string;
  // 自分の userId（state.players のキーと突き合わせて勝敗・自分の HUD を出す）。
  currentUserId: string;
  // バトルを抜ける（一覧などへ）。
  onExit: () => void;
};

// バトル画面の統合コンポーネント。
// 3D シーン（BattleScene）の上に HUD を重ね、WebSocket でサーバーと同期する。
// 入力は押下状態を保持し、30Hz で input メッセージを送る（攻撃・召喚はトリガー）。
export function BattleScreen({ battleId, token, currentUserId, onExit }: BattleScreenProps) {
  const state = useBattleStore((s) => s.state);
  const finished = useBattleStore((s) => s.finished);

  const { sendInput } = useBattleWebSocket({ wsUrl: WS_URL, battleId, token });

  // 押下状態とトリガーは ref に保持し、固定間隔の送信ループから読む
  // （再レンダーを誘発せずに毎 tick の入力を組み立てる）。
  const moveRef = useRef<MoveInput>({ forward: false, back: false, left: false, right: false });
  const attackRef = useRef(false);
  const summonRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      sendInput(
        buildInputMessage({
          move: moveRef.current,
          attack: attackRef.current,
          summon: summonRef.current,
        }),
      );
      // トリガーは送ったら 1 tick で消費する。
      attackRef.current = false;
      summonRef.current = false;
    }, INPUT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sendInput]);

  const handleMoveChange = useCallback((direction: keyof MoveInput, pressed: boolean) => {
    moveRef.current = { ...moveRef.current, [direction]: pressed };
  }, []);
  const handleAttack = useCallback(() => {
    attackRef.current = true;
  }, []);
  const handleSummon = useCallback(() => {
    summonRef.current = true;
  }, []);

  const self = state?.players[currentUserId];

  // 決着後は結果画面。N:N ではチーム単位で勝敗を判定する
  // （自分の teamId が winnerTeam なら勝ち）。teamId が無い 1:1 では
  // 後方互換の winnerId（代表ID）で判定する。
  if (finished) {
    const myTeam = self?.teamId ?? "";
    const winnerTeam = finished.winnerTeam ?? "";
    const wonByTeam = myTeam !== "" && winnerTeam !== "" && winnerTeam === myTeam;
    const wonById = finished.winnerId === currentUserId;
    const outcome = wonByTeam || (winnerTeam === "" && wonById) ? "win" : "lose";
    return (
      <BattleResultScreen outcome={outcome} finalTick={state?.tick} onBack={onExit} />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <BattleScene state={state} currentUserId={currentUserId} />
      <WaitingOverlay show={state === null} />
      {self && state && (
        <BattleHUD
          self={self}
          players={state.players}
          onMoveChange={handleMoveChange}
          onAttack={handleAttack}
          onSummon={handleSummon}
        />
      )}
    </div>
  );
}
