"use client";

import { Button } from "@/components/ui";

type Outcome = "win" | "lose";

type BattleResultScreenProps = {
  // 自分から見た勝敗。
  outcome: Outcome;
  // 決着時のターン数（最後の state.tick）。未取得なら非表示。
  finalTick?: number;
  // 一覧などへ戻る。
  onBack: () => void;
};

// バトル結果画面。勝敗とターン数を表示する。
// ログ（戦闘履歴）は MVP では未実装（finished には winner/loser しか来ないため、
// 将来サーバーがログを配信したらここに追加する）。
export function BattleResultScreen({ outcome, finalTick, onBack }: BattleResultScreenProps) {
  const isWin = outcome === "win";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-white">
      <h1
        className={`text-6xl font-black tracking-widest [text-shadow:0_4px_20px_rgba(0,0,0,0.6)] ${
          isWin ? "text-sky-300" : "text-red-400"
        }`}
      >
        {isWin ? "WIN" : "LOSE"}
      </h1>

      {finalTick !== undefined && (
        <p className="text-slate-300">
          ターン数：<span className="tabular-nums font-bold">{finalTick}</span>
        </p>
      )}

      <Button onClick={onBack}>一覧へ戻る</Button>
    </div>
  );
}
