"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useOpponents } from "@/lib/battle/useOpponents";
import { useClasses } from "@/lib/classes/useClasses";
import { useSummon } from "@/lib/summon/useSummon";
import { Button, Panel } from "@/components/ui";

type Mode = "solo" | "class";

// 「宣戦布告」画面。個人戦（1対1）とクラス戦（N:N）を選んでバトルを作成する。
// - 個人戦: POST /api/battles で相手1人とのバトルを作成。
// - クラス戦: POST /api/battles/declare_war で相手クラスへ宣戦布告し、
//   自クラスと相手クラスの生徒全員を陣営に分けた N:N バトルを作成する。
export function DeclareWarScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { opponents } = useOpponents();
  const { classes } = useClasses();
  const { summons } = useSummon(user?.id);

  const [mode, setMode] = useState<Mode>("solo");
  const [opponentId, setOpponentId] = useState<number | null>(null);
  const [defenderClassId, setDefenderClassId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);

  const soloMutation = $api.useMutation("post", "/api/battles");
  const classMutation = $api.useMutation("post", "/api/battles/declare_war");

  const isPending = soloMutation.isPending || classMutation.isPending;
  const error = soloMutation.error ?? classMutation.error;

  // 自分の所属クラス（クラス戦で attacker になる）。相手クラス候補から除外する。
  const myClassId = user?.school_class?.id ?? null;
  const opponentClasses = (classes ?? []).filter((c) => c.id !== myClassId);

  const toggleSubject = (code: string) => {
    setSubjects((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const canSubmit =
    subjects.length > 0 &&
    !isPending &&
    (mode === "solo" ? opponentId !== null : defenderClassId !== null);

  const handleSubmit = () => {
    if (subjects.length === 0) return;
    const onSuccess = (data: { battleId: string }) =>
      router.push(`/wars/${data.battleId}/battle`);

    if (mode === "solo") {
      if (opponentId === null) return;
      soloMutation.mutate({ body: { opponentId: String(opponentId), subjects } }, { onSuccess });
    } else {
      if (defenderClassId === null) return;
      classMutation.mutate(
        { body: { defenderClassId: String(defenderClassId), subjects } },
        { onSuccess },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-black tracking-wider text-white">⚔️ 宣戦布告</h1>

      <Panel className="p-5">
        <h2 className="mb-3 text-lg font-bold text-white">対戦形式を選ぶ</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("solo")}
            className={`rounded-lg px-4 py-2 font-semibold transition ${
              mode === "solo" ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
          >
            個人戦（1対1）
          </button>
          <button
            type="button"
            onClick={() => setMode("class")}
            className={`rounded-lg px-4 py-2 font-semibold transition ${
              mode === "class" ? "bg-amber-500 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
          >
            クラス戦（N対N）
          </button>
        </div>
      </Panel>

      {mode === "solo" ? (
        <Panel className="p-5">
          <h2 className="mb-3 text-lg font-bold text-white">対戦相手を選ぶ</h2>
          {opponents.length === 0 ? (
            <p className="text-slate-400">対戦できる生徒がいません。</p>
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
      ) : (
        <Panel className="p-5">
          <h2 className="mb-3 text-lg font-bold text-white">宣戦布告する相手クラスを選ぶ</h2>
          {opponentClasses.length === 0 ? (
            <p className="text-slate-400">宣戦布告できるクラスがありません。</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {opponentClasses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDefenderClassId(c.id)}
                  className={`rounded-lg px-4 py-2 font-semibold transition ${
                    defenderClassId === c.id
                      ? "bg-sky-500 text-white"
                      : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
                >
                  {c.grade}年{c.name}
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}

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
