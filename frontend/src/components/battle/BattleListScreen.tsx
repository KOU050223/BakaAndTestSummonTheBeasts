"use client";

import { useRouter } from "next/navigation";
import { useBattles } from "@/lib/battle/useBattles";
import { subjectLabel } from "@/lib/battle/subjectLabel";
import { Button, Panel } from "@/components/ui";

// バトル一覧画面。自分が参加する waiting/active のバトルを表示し、入室導線を出す。
// 相手が宣戦布告したバトルもここに waiting で現れるため、相手側の入室口になる。
export function BattleListScreen() {
  const router = useRouter();
  const { battles } = useBattles();

  // 入室できるのは未終了（waiting / active）のみ。
  const joinable = battles.filter((b) => b.status === "waiting" || b.status === "active");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black tracking-wider text-white">🎮 バトル</h1>

      {joinable.length === 0 ? (
        <Panel className="p-6">
          <p className="text-slate-300">対戦中・待機中のバトルはありません。</p>
          <p className="mt-2 text-sm text-slate-400">
            「宣戦布告」から相手を選んでバトルを始められます。
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-3">
          {joinable.map((b) => (
            <Panel key={b.battleId} className="flex items-center justify-between gap-4 p-4">
              <div className="text-white">
                <p className="font-bold">
                  vs {b.opponentName ?? "対戦相手"}
                  <span className="ml-2 rounded bg-slate-700 px-2 py-0.5 text-xs font-semibold">
                    {b.status === "waiting" ? "待機中" : "対戦中"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  科目: {b.subjects.map(subjectLabel).join("・")}
                </p>
              </div>
              <Button onClick={() => router.push(`/wars/${b.battleId}/battle`)}>入室する</Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
