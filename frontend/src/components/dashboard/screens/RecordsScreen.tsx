"use client";

import { useMemo, useState } from "react";
import { LabelTag, Panel } from "@/components/ui";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";

type BattleStatus = "waiting" | "active" | "finished";
type BattleLogRow = {
  battleId: number;
  occurredAt: string;
  challengerName: string;
  defenderName: string;
  subjectCode: string;
  subjectLabel: string;
  challengerScore: number | null;
  defenderScore: number | null;
  winnerName: string | null;
  status: BattleStatus;
};
type StatusFilter = "all" | BattleStatus;

const MOCK_BATTLE_LOGS: BattleLogRow[] = [
  {
    battleId: 1,
    occurredAt: "2026-06-14T14:32:00+09:00",
    challengerName: "吉井明久",
    defenderName: "霧島翔子",
    subjectCode: "math",
    subjectLabel: "数学",
    challengerScore: 50,
    defenderScore: 0,
    winnerName: "吉井明久",
    status: "finished",
  },
  {
    battleId: 2,
    occurredAt: "2026-06-13T09:10:00+09:00",
    challengerName: "木下秀吉",
    defenderName: "山田太郎",
    subjectCode: "japanese",
    subjectLabel: "国語",
    challengerScore: 58,
    defenderScore: 61,
    winnerName: "山田太郎",
    status: "finished",
  },
  {
    battleId: 3,
    occurredAt: "2026-06-12T16:45:00+09:00",
    challengerName: "島田美波",
    defenderName: "佐藤花子",
    subjectCode: "chemistry",
    subjectLabel: "化学",
    challengerScore: 67,
    defenderScore: 52,
    winnerName: "島田美波",
    status: "finished",
  },
  {
    battleId: 4,
    occurredAt: "2026-06-12T11:20:00+09:00",
    challengerName: "中村健太",
    defenderName: "姫路瑞希",
    subjectCode: "math",
    subjectLabel: "数学",
    challengerScore: 71,
    defenderScore: 82,
    winnerName: "姫路瑞希",
    status: "finished",
  },
  {
    battleId: 5,
    occurredAt: "2026-06-11T13:05:00+09:00",
    challengerName: "坂本雄二",
    defenderName: "田村睦",
    subjectCode: "english",
    subjectLabel: "英語",
    challengerScore: null,
    defenderScore: null,
    winnerName: null,
    status: "active",
  },
  {
    battleId: 6,
    occurredAt: "2026-06-10T10:00:00+09:00",
    challengerName: "吉井明久",
    defenderName: "霧島翔子",
    subjectCode: "math",
    subjectLabel: "数学",
    challengerScore: null,
    defenderScore: null,
    winnerName: null,
    status: "waiting",
  },
];

const STATUS_LABEL: Record<BattleLogRow["status"], string> = {
  waiting: "承認待ち",
  active: "進行中",
  finished: "完了",
};

const STATUS_CLASS: Record<BattleLogRow["status"], string> = {
  waiting: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  active: "border-red-400/30 bg-red-400/10 text-red-200",
  finished: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

export function RecordsScreen() {
  const { user } = useCurrentUser();

  if (!user) return null;
  if (user.role !== "school_admin") {
    return <NavPlaceholder role={user.role} href="/records" />;
  }

  return <AdminBattleLog />;
}

function AdminBattleLog() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const filteredBattles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return MOCK_BATTLE_LOGS.filter((battle) => {
      const matchesStatus =
        statusFilter === "all" || battle.status === statusFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          battle.challengerName,
          battle.defenderName ?? "",
          battle.subjectLabel,
        ].some((value) =>
          value.toLocaleLowerCase("ja-JP").includes(normalizedQuery),
        );

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const activeCount = MOCK_BATTLE_LOGS.filter(
    (battle) => battle.status === "active",
  ).length;
  const waitingCount = MOCK_BATTLE_LOGS.filter(
    (battle) => battle.status === "waiting",
  ).length;
  const finishedCount = MOCK_BATTLE_LOGS.filter(
    (battle) => battle.status === "finished",
  ).length;

  return (
    <div className="mx-auto mt-6 flex max-w-7xl flex-col gap-5">
      <Panel>
        <div className="border-b border-sky-400/20 bg-gradient-to-r from-sky-500/15 to-transparent px-6 py-5">
          <div className="flex items-center gap-3">
            <LabelTag variant="info">管理者</LabelTag>
            <h1 className="text-2xl font-black tracking-wide text-white">
              試召戦争ログ
            </h1> 
          </div>
          <p className="mt-2 text-sm text-slate-300">
            全クラス間の試召戦争について、対戦者・科目・スコア・結果を確認できます。
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="総試合数"
            value={MOCK_BATTLE_LOGS.length}
            tone="sky"
          />
          <SummaryCard label="進行中" value={activeCount} tone="red" />
          <SummaryCard label="承認待ち" value={waitingCount} tone="amber" />
          <SummaryCard label="完了" value={finishedCount} tone="emerald" />
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 border-b border-sky-400/20 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block min-w-0 flex-1 lg:max-w-xl">
            <span className="sr-only">ユーザー名または科目で検索</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ユーザー名・科目で検索…"
              className="w-full rounded-md border border-sky-400/25 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
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
                    ? "border-sky-300 bg-sky-400/20 text-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                    : "border-slate-600 bg-slate-800/70 text-slate-300 hover:border-sky-400/50 hover:text-sky-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredBattles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl">⚔️</p>
              <p className="mt-3 text-sm text-slate-400">
                条件に一致する試召戦争ログはありません。
              </p>
            </div>
          ) : (
            <table
              aria-label="試召戦争ログ"
              className="min-w-[980px] w-full text-sm"
            >
              <thead className="border-b border-sky-400/20 bg-slate-900/70 text-left text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-bold">日時</th>
                  <th className="px-5 py-4 font-bold">仕掛け側</th>
                  <th className="px-5 py-4 font-bold">受け側</th>
                  <th className="px-5 py-4 font-bold">科目</th>
                  <th className="px-5 py-4 text-center font-bold">スコア</th>
                  <th className="px-5 py-4 font-bold">結果</th>
                  <th className="px-5 py-4 font-bold">状態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-400/10">
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
  const hasScore =
    battle.challengerScore !== null && battle.defenderScore !== null;
  const result =
    battle.status === "finished" && battle.winnerName
      ? `${battle.winnerName} の勝利`
      : "—";

  return (
    <tr className="bg-slate-950/20 text-slate-200 transition hover:bg-sky-400/5">
      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
        {formatOccurredAt(battle.occurredAt)}
      </td>
      <td className="px-5 py-4 font-bold text-white">
        {battle.challengerName}
      </td>
      <td className="px-5 py-4 font-bold text-white">
        {battle.defenderName ?? "対戦相手未定"}
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex rounded-md border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 font-bold text-violet-200">
          {battle.subjectLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-center font-black text-white">
        {hasScore
          ? `${battle.challengerScore} vs ${battle.defenderScore}`
          : "—"}
      </td>
      <td
        className={`whitespace-nowrap px-5 py-4 font-bold ${
          battle.winnerName ? "text-emerald-300" : "text-slate-500"
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
    sky: "text-sky-300",
    red: "text-red-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  }[tone];

  return (
    <div className="rounded-lg border border-sky-400/15 bg-slate-950/35 px-5 py-4">
      <p className="text-xs font-bold tracking-wider text-slate-400">{label}</p>
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
