import Link from "next/link";
import type { ReactNode } from "react";
import { LabelTag, Panel } from "@/components/ui";
import type { MyScore } from "@/lib/api/grading";

const SCORE_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
});

export function SummaryPanel({
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
          <p className="text-xs font-bold tracking-wider text-[var(--dashboard-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[var(--dashboard-text)]">{value}</p>
          <p className="mt-0.5 text-xs text-[var(--dashboard-muted)] opacity-75">{sub}</p>
        </div>
      </div>
    </Panel>
  );
}

export function SectionHeader({
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
    <div className="flex items-center justify-between gap-3 border-b border-[var(--dashboard-border)] bg-[linear-gradient(90deg,var(--dashboard-accent-soft),transparent)] px-5 py-4">
      <div className="flex items-center gap-3">
        <LabelTag variant="info">{tag}</LabelTag>
        <h2 className="font-black text-[var(--dashboard-text)]">{title}</h2>
      </div>
      <Link href={href} className="text-xs font-bold text-[var(--dashboard-accent)] hover:opacity-75">
        {linkLabel} →
      </Link>
    </div>
  );
}

export function RecentScoreRow({ score }: { score: MyScore }) {
  const percentage =
    score.max_score > 0 ? Math.round((score.score / score.max_score) * 100) : 0;
  const scoreClass =
    percentage >= 80
      ? "text-emerald-300"
      : percentage >= 60
        ? "text-amber-300"
        : "text-red-300";

  return (
    <div className="theme-card flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-[var(--dashboard-text)]">{score.exam_title}</p>
        <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
          {score.subject_label} ・ {formatDate(score.scored_at)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className={`text-xl font-black ${scoreClass}`}>{score.score}</span>
        <span className="text-xs text-[var(--dashboard-muted)]"> / {score.max_score}</span>
      </div>
    </div>
  );
}

export function SummonStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-sky-400/10 pb-1">
      <span className="text-[var(--dashboard-muted)]">{label}</span>
      <span className="font-black text-[var(--dashboard-accent)]">{value}</span>
    </div>
  );
}

export function LoadingMessage({ children }: { children: ReactNode }) {
  return (
    <p className="animate-pulse py-12 text-center text-sm text-sky-300">
      {children}
    </p>
  );
}

export function EmptyMessage({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-3xl" aria-hidden="true">
        {icon}
      </p>
      <p className="mt-3 text-sm text-[var(--dashboard-muted)]">{children}</p>
    </div>
  );
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "日付不明";

  return SCORE_DATE_FORMATTER.format(new Date(timestamp));
}

export function scoreTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
