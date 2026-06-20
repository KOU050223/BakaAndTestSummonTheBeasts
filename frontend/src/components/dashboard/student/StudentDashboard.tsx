"use client";

import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { summonImage } from "@/lib/summon/summonVisual";
import { useMyScores } from "@/lib/summon/useMyScores";
import { useSummon } from "@/lib/summon/useSummon";
import {
  EmptyMessage,
  LoadingMessage,
  RecentScoreRow,
  SectionHeader,
  SummaryPanel,
  SummonStat,
  scoreTimestamp,
} from "./StudentDashboardParts";

const QUICK_ACTIONS = [
  {
    href: "/scores",
    icon: "📊",
    label: "成績を確認",
    description: "点数と召喚獣ステータス",
  },
  {
    href: "/summon",
    icon: "🐉",
    label: "召喚獣を見る",
    description: "あなたの召喚獣を確認",
  },
  {
    href: "/submit",
    icon: "📨",
    label: "答案を提出",
    description: "答案画像をアップロード",
  },
  {
    href: "/declare-war",
    icon: "⚔️",
    label: "宣戦布告",
    description: "試召戦争を申し込む",
  },
] as const;

export function StudentDashboard() {
  const {
    user,
    isLoading: userLoading,
    isError: userError,
  } = useCurrentUser();
  const { summary, isLoading: scoresLoading, isError: scoresError } =
    useMyScores(user?.role === "student");
  const {
    summons,
    isLoading: summonsLoading,
    isError: summonsError,
  } = useSummon(user?.id);

  if (userLoading) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <p role="status" className="animate-pulse py-16 text-center text-[var(--dashboard-accent)]">
          生徒情報を読み込み中…
        </p>
      </Panel>
    );
  }

  if (userError) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <p role="alert" className="py-16 text-center text-[var(--dashboard-score-bad)]">
          生徒情報の取得に失敗しました
        </p>
      </Panel>
    );
  }

  if (!user) return null;

  const scoreRate =
    summary.max > 0 ? Math.round((summary.total / summary.max) * 100) : 0;
  const recentScores = [...summary.scores]
    .sort(
      (left, right) =>
        scoreTimestamp(right.scored_at) - scoreTimestamp(left.scored_at),
    )
    .slice(0, 3);
  const featuredSummon = summons[0] ?? null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <Panel>
        <div className="relative overflow-hidden bg-[linear-gradient(100deg,var(--dashboard-accent-soft),transparent)] px-6 py-6 sm:px-8">
          <span aria-hidden="true" className="theme-tape -top-1 left-1/2" />
          <div
            aria-hidden="true"
              className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[var(--dashboard-accent-soft)] blur-3xl"
          />
          <div className="relative flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-[var(--dashboard-border)] bg-[var(--dashboard-accent-soft)] px-3 py-1 text-xs font-black tracking-widest text-[var(--dashboard-accent)]">
                生徒
              </span>
              {user.school_class && (
                <span className="border border-[var(--dashboard-border)] bg-[var(--dashboard-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--dashboard-accent)]">
                  {user.school_class.name}
                </span>
              )}
            </div>
            <div>
              <h1 className="mt-1 text-2xl font-black text-[var(--dashboard-text)] [text-shadow:1px_2px_0_rgb(40_25_12_/_45%)] sm:text-3xl">
                {user.name}さん、おかえりなさい
              </h1>
              <p className="mt-2 text-sm text-[var(--dashboard-muted)]">
                宣戦布告をして上位のクラスを目指しましょう！
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <section aria-label="学習サマリー" className="grid gap-4 sm:grid-cols-2">
        <SummaryPanel
          icon="🎯"
          label="総合点"
          value={scoresLoading ? "集計中…" : `${summary.total} / ${summary.max}`}
          sub={`${scoreRate}% 達成`}
          color="sky"
        />
        <SummaryPanel
          icon="📝"
          label="受験した試験"
          value={scoresLoading ? "確認中…" : `${summary.scores.length} 件`}
          sub="採点済みの答案"
          color="amber"
        />
      </section>

      {(scoresError || summonsError) && (
        <div
          role="alert"
          className="rounded-md border border-[var(--dashboard-score-bad-border)] bg-[var(--dashboard-score-bad-soft)] px-4 py-3 text-sm text-[var(--dashboard-score-bad)]"
        >
          一部の学習データを取得できませんでした。時間をおいて再読み込みしてください。
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <SectionHeader
            tag="SCORE"
            title="最近の成績"
            href="/scores"
            linkLabel="すべて見る"
          />
          <div className="p-4 sm:p-5">
            {scoresLoading ? (
              <LoadingMessage>成績を読み込み中…</LoadingMessage>
            ) : recentScores.length === 0 ? (
              <EmptyMessage icon="📄">
                採点された試験はまだありません
              </EmptyMessage>
            ) : (
              <div className="flex flex-col gap-3">
                {recentScores.map((score) => (
                  <RecentScoreRow key={score.exam_id} score={score} />
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            tag="SUMMON"
            title="召喚獣"
            href="/summon"
            linkLabel="詳細を見る"
          />
          <div className="p-5">
            {summonsLoading ? (
              <LoadingMessage>召喚獣を呼び出し中…</LoadingMessage>
            ) : featuredSummon ? (
              <div className="theme-card flex items-center gap-5 p-4">
                <div className="relative flex h-32 w-28 shrink-0 items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-full bg-[var(--dashboard-accent-soft)] blur-2xl" />
                  <Image
                    src={summonImage(featuredSummon.code)}
                    alt={`${user.name}の召喚獣`}
                    width={96}
                    height={128}
                    className="theme-summon-image relative h-auto max-h-28 w-auto"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mt-2 text-lg font-black text-[var(--dashboard-text)]">
                    {user.name}の召喚獣
                  </h2>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <SummonStat label="HP" value={featuredSummon.hp} />
                    <SummonStat label="こうげき" value={featuredSummon.attack} />
                    <SummonStat label="ぼうぎょ" value={featuredSummon.defense} />
                    <SummonStat label="すばやさ" value={featuredSummon.speed} />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyMessage icon="🪄">
                テストを受けると召喚獣が現れます
              </EmptyMessage>
            )}
          </div>
        </Panel>
      </div>

      <section aria-labelledby="quick-actions-heading">
        <div className="mb-3 flex items-center gap-3">
          <span className="border border-[var(--dashboard-border)] bg-[var(--dashboard-accent-soft)] px-2 py-1 text-xs font-black tracking-widest text-[var(--dashboard-accent)]">SHORTCUT</span>
          <h2 id="quick-actions-heading" className="text-lg font-black text-[var(--dashboard-text)]">
            クイックアクション
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="theme-card group p-4 transition hover:-translate-y-0.5 hover:border-[var(--dashboard-accent)] hover:bg-[var(--dashboard-accent-soft)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-[var(--dashboard-text)] group-hover:text-[var(--dashboard-accent)]">
                    {action.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--dashboard-muted)]">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
