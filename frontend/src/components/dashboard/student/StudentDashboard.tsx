"use client";

import Image from "next/image";
import Link from "next/link";
import { LabelTag, Panel } from "@/components/ui";
import type { MyScore } from "@/lib/api/grading";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { summonImage } from "@/lib/summon/summonVisual";
import { useMyScores } from "@/lib/summon/useMyScores";
import { useSummon } from "@/lib/summon/useSummon";

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

const SCORE_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
});

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
        <p role="status" className="animate-pulse py-16 text-center text-sky-300">
          生徒情報を読み込み中…
        </p>
      </Panel>
    );
  }

  if (userError) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <p role="alert" className="py-16 text-center text-red-300">
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
        <div className="relative overflow-hidden bg-gradient-to-r from-sky-500/20 via-indigo-500/10 to-transparent px-6 py-6 sm:px-8">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl"
          />
          <div className="relative flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <LabelTag variant="info">生徒</LabelTag>
              {user.school_class && (
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-200">
                  {user.school_class.name}
                </span>
              )}
            </div>
            <div>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                {user.name}さん、おかえりなさい
              </h1>
              <p className="mt-2 text-sm text-slate-300">
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
          className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
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
              <div className="flex items-center gap-5 rounded-md border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-sky-500/5 p-4">
                <div className="relative flex h-32 w-28 shrink-0 items-center justify-center">
                  <div className="absolute h-24 w-24 rounded-full bg-sky-400/25 blur-2xl" />
                  <Image
                    src={summonImage(featuredSummon.code)}
                    alt={`${user.name}の召喚獣`}
                    width={96}
                    height={128}
                    className="relative h-auto max-h-28 w-auto drop-shadow-[0_0_14px_rgba(56,189,248,0.6)]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mt-2 text-lg font-black text-white">
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
          <LabelTag variant="info">SHORTCUT</LabelTag>
          <h2 id="quick-actions-heading" className="text-lg font-black text-white">
            クイックアクション
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-md border border-sky-400/25 bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-400/10 hover:shadow-[0_0_18px_rgba(56,189,248,0.18)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-white group-hover:text-sky-200">
                    {action.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
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

function SummaryPanel({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: "sky" | "amber";
}) {
  const colorClass = {
    sky: "text-sky-300 border-sky-400/25 bg-sky-400/10",
    amber: "text-amber-300 border-amber-400/25 bg-amber-400/10",
  }[color];

  return (
    <Panel>
      <div className="flex items-center gap-4 p-5">
        <span
          aria-hidden="true"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-2xl ${colorClass}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-xs font-bold tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
        </div>
      </div>
    </Panel>
  );
}

function SectionHeader({
  tag,
  title,
  href,
  linkLabel,
}: {
  tag: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-sky-400/25 bg-gradient-to-r from-sky-400/15 to-transparent px-5 py-4">
      <div className="flex items-center gap-3">
        <LabelTag variant="info">{tag}</LabelTag>
        <h2 className="font-black text-white">{title}</h2>
      </div>
      <Link href={href} className="text-xs font-bold text-sky-300 hover:text-sky-100">
        {linkLabel} →
      </Link>
    </div>
  );
}

function RecentScoreRow({ score }: { score: MyScore }) {
  const percentage =
    score.max_score > 0 ? Math.round((score.score / score.max_score) * 100) : 0;
  const scoreClass =
    percentage >= 80
      ? "text-emerald-300"
      : percentage >= 60
        ? "text-amber-300"
        : "text-red-300";

  return (
    <div className="flex items-center gap-4 rounded-md border border-sky-400/10 bg-white/[0.03] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white">{score.exam_title}</p>
        <p className="mt-1 text-xs text-slate-400">
          {score.subject_label} ・ {formatDate(score.scored_at)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`text-xl font-black ${scoreClass}`}>{score.score}</span>
        <span className="text-xs text-slate-500"> / {score.max_score}</span>
      </div>
    </div>
  );
}

function SummonStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-sky-400/10 pb-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-black text-sky-200">{value}</span>
    </div>
  );
}

function LoadingMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="animate-pulse py-12 text-center text-sm text-sky-300">
      {children}
    </p>
  );
}

function EmptyMessage({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-3xl" aria-hidden="true">
        {icon}
      </p>
      <p className="mt-3 text-sm text-slate-400">{children}</p>
    </div>
  );
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "日付不明";

  return SCORE_DATE_FORMATTER.format(new Date(timestamp));
}

function scoreTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
