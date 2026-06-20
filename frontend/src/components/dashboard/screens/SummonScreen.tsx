"use client";

import { useState } from "react";
import Image from "next/image";
import { Panel, LabelTag } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useSummon, type Summon } from "@/lib/summon/useSummon";
import { useMyScores } from "@/lib/summon/useMyScores";
import { summonImage } from "@/lib/summon/summonVisual";
import type { MyScore } from "@/lib/api/grading";

// 各ステータスの表示メタ情報。bar の最大値は表示スケール用の目安。
// HP は他より大きい値域（HP_BASE=100 始まり）になるため max を分けている。
type StatKey = "hp" | "attack" | "defense" | "speed";

const STAT_META: { key: StatKey; label: string; max: number; color: string }[] = [
  { key: "hp", label: "HP", max: 150, color: "bg-green-400" },
  { key: "attack", label: "こうげき", max: 40, color: "bg-red-400" },
  { key: "defense", label: "ぼうぎょ", max: 15, color: "bg-sky-400" },
  { key: "speed", label: "すばやさ", max: 10, color: "bg-yellow-400" },
];

export function SummonScreen() {
  const { user } = useCurrentUser();
  const isStudent = user?.role === "student";
  const { summons, isLoading, isError } = useSummon(user?.id);
  const { summary } = useMyScores(isStudent);

  // 中央に表示する科目。ユーザー未選択（null）や、選択中の科目が消えた場合は
  // 先頭の召喚獣にフォールバックする。effect で setState せず描画時に解決することで
  // 余計な再レンダリングを避ける。
  const [selected, setSelected] = useState<string | null>(null);
  const activeSummon =
    summons.find((s) => s.code === selected) ?? summons[0] ?? null;

  return (
    <Panel className="mx-auto mt-6 max-w-4xl">
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

        {!isLoading && !isError && activeSummon && (
          <div className="flex flex-col gap-5">
            {/* 科目タブ */}
            <SubjectTabs
              summons={summons}
              selected={activeSummon.code}
              onSelect={setSelected}
            />

            {/* 中央：召喚獣の召喚演出 */}
            <SummonStage
              summon={activeSummon}
              studentName={user?.name ?? "名もなき召喚士"}
              score={summary.bySubject[activeSummon.code]}
            />

            {/* 下部：全科目の点数一覧 ＋ 総合点 */}
            <ScorePanel
              summons={summons}
              selected={activeSummon.code}
              summary={summary}
              onSelect={setSelected}
            />
          </div>
        )}
      </div>
    </Panel>
  );
}

// 科目切り替えタブ。選択中はネオン強調。
function SubjectTabs({
  summons,
  selected,
  onSelect,
}: {
  summons: Summon[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {summons.map((s) => {
        const active = s.code === selected;
        return (
          <button
            key={s.code}
            type="button"
            onClick={() => onSelect(s.code)}
            aria-pressed={active}
            className={`rounded-sm border px-4 py-1.5 text-sm font-bold transition-all duration-150 ${
              active
                ? "border-sky-400 bg-sky-400/20 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
                : "border-sky-400/30 text-slate-300 hover:border-sky-400/60 hover:text-sky-200"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// 召喚獣を中央に大きく据える召喚ステージ。原作の召喚画面風に
// 「名前 / 教科 / 点数」のラベルを四隅に配置し、星＋グロー背景で演出する。
function SummonStage({
  summon,
  studentName,
  score,
}: {
  summon: Summon;
  studentName: string;
  score: MyScore | undefined;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border-2 border-sky-400/50 bg-gradient-to-b from-[#10254a] via-[#16315f] to-[#0d2447] px-4 py-4 shadow-[inset_0_0_60px_rgba(56,189,248,0.25)]">
      <StarField />

      {/* 上段ラベル：名前（左） / 教科（右） */}
      <div className="relative z-10 mb-2 flex items-start justify-between gap-2">
        <CornerLabel tag="名前" value={studentName} />
        <CornerLabel tag="教科" value={summon.label} align="right" />
      </div>

      {/* 中央：召喚獣ビジュアル + グロー */}
      <div className="relative z-10 flex justify-center">
        <div className="absolute top-1/2 h-36 w-36 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl" />
        <Image
          key={summon.code}
          src={summonImage(summon.code)}
          alt={`${summon.label}の召喚獣`}
          width={150}
          height={200}
          priority
          className="relative h-auto w-[120px] animate-[summon-float_3s_ease-in-out_infinite] drop-shadow-[0_0_18px_rgba(56,189,248,0.6)] sm:w-[150px]"
        />
      </div>

      {/* 下段ラベル：点数（右） */}
      <div className="relative z-10 mt-2 flex justify-end">
        <CornerLabel
          tag="点数"
          value={score ? `${score.score}` : "—"}
          sub={score ? `/ ${score.max_score}` : "未受験"}
          align="right"
          emphasize
        />
      </div>

      {/* ステータスバー */}
      <div className="relative z-10 mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STAT_META.map(({ key, label, max, color }) => {
          const value = summon[key];
          const pct = Math.min(100, Math.round((value / max) * 100));
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-semibold text-slate-200">
                {label}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-black/30"
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

// 四隅のラベル（原作の「名前」「教科」「点数」枠を模したもの）。
function CornerLabel({
  tag,
  value,
  sub,
  align = "left",
  emphasize = false,
}: {
  tag: string;
  value: string;
  sub?: string;
  align?: "left" | "right";
  emphasize?: boolean;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <span className="mb-1 inline-block rounded-sm bg-sky-400/20 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-sky-200">
        {tag}
      </span>
      <p
        className={`font-black text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)] ${
          emphasize ? "text-3xl" : "text-lg"
        }`}
      >
        {value}
        {sub && (
          <span className="ml-1 text-xs font-semibold text-slate-300">{sub}</span>
        )}
      </p>
    </div>
  );
}

// 散りばめた星（CSS のみ。装飾なので aria-hidden）。
function StarField() {
  const stars = [
    { top: "12%", left: "8%", size: 10, delay: "0s" },
    { top: "20%", left: "82%", size: 8, delay: "0.4s" },
    { top: "68%", left: "14%", size: 12, delay: "0.8s" },
    { top: "78%", left: "76%", size: 9, delay: "1.2s" },
    { top: "44%", left: "92%", size: 7, delay: "0.6s" },
    { top: "52%", left: "4%", size: 8, delay: "1s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute animate-[star-twinkle_2s_ease-in-out_infinite] text-yellow-200/70"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: s.delay,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// 周囲に出す全科目の点数一覧＋総合点。各行クリックでその科目を中央に呼び出せる。
function ScorePanel({
  summons,
  selected,
  summary,
  onSelect,
}: {
  summons: Summon[];
  selected: string;
  summary: ReturnType<typeof useMyScores>["summary"];
  onSelect: (code: string) => void;
}) {
  const overallPct =
    summary.max > 0 ? Math.round((summary.total / summary.max) * 100) : 0;

  return (
    <div className="rounded-md border border-sky-400/20 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-sky-200">各教科の点数</p>
        <div className="text-right">
          <span className="text-[0.65rem] font-bold tracking-wide text-slate-400">
            総合点
          </span>
          <p className="leading-none">
            <span className="text-2xl font-black text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
              {summary.total}
            </span>
            <span className="ml-1 text-xs font-semibold text-slate-300">
              / {summary.max}（{overallPct}%）
            </span>
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {summons.map((s) => {
          const score = summary.bySubject[s.code];
          const active = s.code === selected;
          return (
            <li key={s.code}>
              <button
                type="button"
                onClick={() => onSelect(s.code)}
                aria-pressed={active}
                className={`flex w-full items-center justify-between rounded-sm border px-3 py-2 text-left transition-all duration-150 ${
                  active
                    ? "border-sky-400/60 bg-sky-400/15"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-semibold text-white">
                  {s.label}
                </span>
                <span className="text-sm">
                  {score ? (
                    <>
                      <span className="font-black text-sky-200">
                        {score.score}
                      </span>
                      <span className="text-xs text-slate-400">
                        {" "}
                        / {score.max_score}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500">未受験</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
