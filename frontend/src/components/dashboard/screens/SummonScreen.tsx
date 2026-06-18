"use client";

import { Panel, LabelTag } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useSummon, type Summon } from "@/lib/summon/useSummon";

// 科目ごとの召喚獣アイコン（雰囲気づけ）。表示の装飾であり科目マスタの責務ではないため
// フロント側に持つ。未定義の科目は汎用アイコンにフォールバックする。
const SUBJECT_ICON: Record<string, string> = {
  english: "📖",
  math: "🔢",
  physics: "⚛️",
  chemistry: "⚗️",
  biology: "🌿",
  earth_science: "🌎",
  geography: "🗺️",
  japanese_history: "🏯",
  world_history: "🌐",
  civics: "⚖️",
  japanese: "🖌️",
};

// 各ステータスの表示メタ情報。bar の最大値は表示スケール用の目安。
// HP は他より大きい値域（HP_BASE=100 始まり）になるため max を分けている。
// ステータスのうちバー表示する数値項目のキー（code/label を除いたもの）。
type StatKey = "hp" | "attack" | "defense" | "speed";

const STAT_META: { key: StatKey; label: string; max: number; color: string }[] = [
  { key: "hp", label: "HP", max: 150, color: "bg-green-400" },
  { key: "attack", label: "こうげき", max: 40, color: "bg-red-400" },
  { key: "defense", label: "ぼうぎょ", max: 15, color: "bg-sky-400" },
  { key: "speed", label: "すばやさ", max: 10, color: "bg-yellow-400" },
];

export function SummonScreen() {
  const { user } = useCurrentUser();
  const { summons, isLoading, isError } = useSummon(user?.id);

  return (
    <Panel className="mx-auto mt-6 max-w-3xl">
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">召喚獣</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          召喚獣プレビュー
        </h1>
      </div>

      <div className="px-5 py-6">
        {isLoading && (
          <p className="animate-pulse py-10 text-center text-sky-300">召喚中...</p>
        )}

        {!isLoading && isError && (
          <p className="py-10 text-center text-sm text-red-300">
            召喚獣ステータスの取得に失敗しました
          </p>
        )}

        {!isLoading && !isError && summons.length === 0 && (
          <div className="py-10 text-center">
            <p className="mb-3 text-4xl">🪄</p>
            <p className="text-sm text-slate-400">
              まだ召喚獣がいません。テストを受けると科目ごとに召喚されます。
            </p>
          </div>
        )}

        {!isLoading && !isError && summons.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {summons.map((summon) => (
              <SummonCard key={summon.code} summon={summon} />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function SummonCard({ summon }: { summon: Summon }) {
  return (
    <div className="rounded-sm border border-sky-400/20 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{SUBJECT_ICON[summon.code] ?? "✨"}</span>
        <div>
          <p className="font-bold text-white">{summon.label}の召喚獣</p>
          <p className="text-xs text-slate-400">
            直近のテスト結果から召喚
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {STAT_META.map(({ key, label, max, color }) => {
          const value = summon[key];
          const pct = Math.min(100, Math.round((value / max) * 100));
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold text-slate-300">
                {label}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label={label}
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
              >
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-bold text-white">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
