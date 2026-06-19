"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useOpponents } from "@/lib/battle/useOpponents";
import { useSummon } from "@/lib/summon/useSummon";
import { Button, Panel } from "@/components/ui";

// 「宣戦布告」画面。対戦相手と対戦科目を選んでバトルを作成する（マッチングの起点）。
// 作成すると POST /api/battles で両者ぶんのバトルが waiting 状態で作られ、
// 作成者はそのままバトル画面へ。相手は「バトル一覧」から入室する。
export function DeclareWarScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { opponents } = useOpponents();
  const { summons } = useSummon(user?.id);

  const [opponentId, setOpponentId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  const { mutate, isPending, error } = $api.useMutation("post", "/api/battles");

  const toggleSubject = (code: string) => {
    setSubjects((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const canSubmit = opponentId !== null && subjects.length > 0 && !isPending;

  const handleSubmit = () => {
    if (opponentId === null || subjects.length === 0) return;
    mutate(
      { body: { opponentId: String(opponentId), subjects } },
      {
        onSuccess: (data) => router.push(`/wars/${data.battleId}/battle`),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black tracking-wider text-white">⚔️ 宣戦布告</h1>

      <Panel className="p-5">
        <h2 className="mb-3 text-lg font-bold text-white">対戦相手を選ぶ</h2>
        {opponents.length === 0 ? (
          <p className="text-slate-400">同じクラスに対戦できる生徒がいません。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {opponents.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpponentId(s.id)}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  opponentId === s.id
                    ? "bg-sky-500 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-5">
        <h2 className="mb-3 text-lg font-bold text-white">対戦科目を選ぶ（召喚フィールド）</h2>
        {summons.length === 0 ? (
          <p className="text-slate-400">召喚獣がいません。先に成績を登録してください。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {summons.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => toggleSubject(s.code)}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  subjects.includes(s.code)
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </Panel>

      {error != null && (
        <p className="text-red-400">バトルの作成に失敗しました。入力内容を確認してください。</p>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {isPending ? "宣戦布告中…" : "宣戦布告する"}
      </Button>
    </div>
  );
}
