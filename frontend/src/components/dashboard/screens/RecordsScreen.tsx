"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LabelTag, Panel } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { type BattleListItem, useBattles } from "@/lib/battle/useBattles";
import { subjectLabel } from "@/lib/battle/subjectLabel";

type BattleStatus = "waiting" | "active" | "finished";
type BattleLogRow = BattleListItem;
type StatusFilter = "all" | BattleStatus;

const STATUS_LABEL: Record<BattleLogRow["status"], string> = {
  waiting: "承認待ち",
  active: "進行中",
  finished: "完了",
};

const STATUS_CLASS: Record<BattleLogRow["status"], string> = {
  waiting: "border-amber-700/40 bg-amber-100 text-amber-900",
  active: "border-red-700/40 bg-red-100 text-red-900",
  finished: "border-emerald-700/40 bg-emerald-100 text-emerald-900",
};

export function RecordsScreen() {
  const { user } = useCurrentUser();
  const { battles, isLoading, isError } = useBattles();

  if (!user) return null;

  return (
    <BattleRecords
      battles={battles}
      isLoading={isLoading}
      isError={isError}
      role={user.role}
    />
  );
}

function BattleRecords({
  battles,
  isLoading,
  isError,
  role,
}: {
  battles: BattleLogRow[];
  isLoading: boolean;
  isError: boolean;
  role: "student" | "teacher" | "school_admin";
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const filteredBattles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return battles.filter((battle) => {
      const matchesStatus =
        statusFilter === "all" || battle.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          battle.participantsLabel,
          battle.winnerName ?? "",
          battle.winnerTeamName ?? "",
          ...battle.subjects.map(subjectLabel),
        ].some((value) =>
          value.toLocaleLowerCase("ja-JP").includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [battles, query, statusFilter]);

  const activeCount = battles.filter(
    (battle) => battle.status === "active",
  ).length;
  const waitingCount = battles.filter(
    (battle) => battle.status === "waiting",
  ).length;
  const finishedCount = battles.filter(
    (battle) => battle.status === "finished",
  ).length;

  return (
    <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-5">
      <Panel>
        <div className="border-b border-[var(--dashboard-border)] bg-[linear-gradient(90deg,var(--dashboard-accent-soft),transparent)] px-6 py-5">
          <div className="flex items-center gap-3">
            <LabelTag variant="info">
              {role === "student" ? "生徒" : role === "teacher" ? "教師" : "管理者"}
            </LabelTag>
            <h1 className="text-2xl font-black tracking-wide text-[var(--dashboard-text)]">
              {role === "student" ? "戦績" : "試召戦争ログ"}
            </h1>
          </div>
          <p className="mt-2 text-sm text-[var(--dashboard-muted)]">
            保存された対戦の参加者・科目・ターン数・結果を確認できます。
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="総試合数"
            value={battles.length}
            tone="sky"
          />
          <SummaryCard label="進行中" value={activeCount} tone="red" />
          <SummaryCard label="承認待ち" value={waitingCount} tone="amber" />
          <SummaryCard label="完了" value={finishedCount} tone="emerald" />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 border-b border-[var(--dashboard-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1 lg:max-w-xl">
            <span className="sr-only">ユーザー名または科目で検索</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--dashboard-muted)]">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ユーザー名・科目で検索…"
              className="w-full rounded-md border border-[var(--dashboard-border)] bg-white/70 py-3 pl-11 pr-4 text-sm text-[var(--dashboard-text)] outline-none transition placeholder:text-[var(--dashboard-muted)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)]"
            />
          </label>

          <div className="flex flex-wrap gap-2" aria-label="状態で絞り込み">
            {(
              [
                ["all", "すべて"],
                ["active", "進行中"],
                ["waiting", "承認待ち"],
                ["finished", "完了"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
                className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
                  statusFilter === value
                    ? "border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white shadow-sm"
                    : "border-[var(--dashboard-border)] bg-white/55 text-[var(--dashboard-text)] hover:bg-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-[var(--dashboard-accent)]">対戦履歴を読み込み中…</p>
          ) : isError ? (
            <p className="py-16 text-center text-sm text-red-300">対戦履歴の取得に失敗しました。</p>
          ) : filteredBattles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">⚔️</p>
              <p className="mt-3 text-sm text-[var(--dashboard-muted)]">
                条件に一致する試召戦争ログはありません。
              </p>
            </div>
          ) : (
            <table
              aria-label="試召戦争ログ"
              className="min-w-[980px] w-full text-sm"
            >
              <thead className="border-b border-[var(--dashboard-border)] bg-[var(--dashboard-table-header-bg)] text-left text-xs uppercase tracking-wider text-[var(--dashboard-table-header-text)]">
                <tr>
                  <th className="px-5 py-4 font-bold">作成日時</th>
                  <th className="px-5 py-4 font-bold">対戦</th>
                  <th className="px-5 py-4 font-bold">科目</th>
                  <th className="px-5 py-4 text-center font-bold">ターン数</th>
                  <th className="px-5 py-4 font-bold">結果</th>
                  <th className="px-5 py-4 font-bold">状態</th>
                  <th className="px-5 py-4 font-bold">詳細</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--dashboard-border)]/25">
                {filteredBattles.map((battle) => (
                  <BattleLogTableRow key={battle.battleId} battle={battle} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Panel>
    </div>
  );
}

function BattleLogTableRow({ battle }: { battle: BattleLogRow }) {
  const winner = battle.winnerTeamName ?? battle.winnerName;
  const result =
    battle.status === "finished" && winner
      ? `${winner} の勝利`
      : "—";

  return (
    <tr className="bg-white/28 text-[var(--dashboard-text)] transition hover:bg-white/55">
      <td className="whitespace-nowrap px-5 py-4 text-[var(--dashboard-muted)]">
        {formatOccurredAt(battle.createdAt)}
      </td>
      <td className="px-5 py-4 font-bold text-[var(--dashboard-text)]">
        {battle.participantsLabel || "対戦相手未定"}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {battle.subjects.map((subject) => (
            <span key={subject} className="inline-flex rounded-md border border-violet-800/30 bg-violet-100 px-2.5 py-1 font-bold text-violet-900">
              {subjectLabel(subject)}
            </span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-center font-black text-[var(--dashboard-text)]">
        {battle.status === "finished" ? `${battle.turnCount}ターン` : "—"}
      </td>
      <td
        className={`whitespace-nowrap px-5 py-4 font-bold ${
          winner ? "text-emerald-800" : "text-[var(--dashboard-muted)]"
        }`}
      >
        {result}
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASS[battle.status]}`}
        >
          {STATUS_LABEL[battle.status]}
        </span>
      </td>
      <td className="px-5 py-4">
        {battle.status === "finished" ? (
          <Link href={`/wars/${battle.battleId}/result`} className="font-bold text-[var(--dashboard-accent)] hover:underline">
            詳細
          </Link>
        ) : (
          <span className="text-[var(--dashboard-muted)]">—</span>
        )}
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "sky" | "red" | "amber" | "emerald";
}) {
  const valueClass = {
    sky: "text-sky-800",
    red: "text-red-800",
    amber: "text-amber-800",
    emerald: "text-emerald-800",
  }[tone];

  return (
    <div className="theme-card rounded-lg px-5 py-4">
      <p className="text-xs font-bold tracking-wider text-[var(--dashboard-muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function formatOccurredAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
