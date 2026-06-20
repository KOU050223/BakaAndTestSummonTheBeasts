"use client";

import Link from "next/link";
import { ClassAverageScoreChart } from "@/components/dashboard/ClassAverageScoreChart";
import { Panel } from "@/components/ui/Panel";
import { $api } from "@/lib/api/client";
import { listAnswerSheets } from "@/lib/api/grading";
import { useEffect, useState } from "react";

// Minimal local types to avoid `any` in this file
type Exam = { id: number | string; status?: string };
type BattleSummary = { battleId: string };
type BattleResultLog = { turn: number; actorId: string | number; action: string; targetId: string | number; damage: number };
type BattleResult = { battleId: string; logs?: BattleResultLog[] };
type User = { id: number | string; name: string };

// NOTE: このコンポーネントはクライアントコンポーネントで、$api.useQuery を用いて
// サーバーのエンドポイントから統計を取得します。httpOnly Cookie を使った認証を前提。

function StatCard({ title, value, href, onClick }: { title: string; value: string; href?: string; onClick?: () => void }) {
  const body = (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        {onClick ? (
          <button onClick={onClick} className="text-left w-full">
            {body}
          </button>
        ) : href ? (
          <Link href={href}>{body}</Link>
        ) : (
          body
        )}
        <div className="text-slate-400">📈</div>
      </div>
    </Panel>
  );
}

// バトルログは下部でまとめて取得・表示します。

// 管理者用ダッシュボードの画面（簡易実装）
export function AdminDashboard() {
  // /api/admin/users がユーザー統計を返す（管理者専用）
  const { data: usersData, isLoading: usersLoading, isError: usersError } = $api.useQuery(
    "get",
    "/api/admin/users"
  );

  const { data: examsData } = $api.useQuery("get", "/api/exams");
  // 5秒毎にポーリングして進行中バトル数を自動更新する
  const { data: battlesData } = $api.useQuery("get", "/api/battles", { refetchInterval: 5000 });

  // (クラス別表示は管理者画面から外すため削除)

  const stats = {
    users: usersData?.stats?.total_count?.toString() ?? "—",
    // 公開済み試験のみをカウント。exams オブジェクトに status フィールドがない場合は全件を表示。
    exams: Array.isArray(examsData?.exams)
      ? String(
          (examsData.exams as Exam[]).some((e: Exam) => typeof e.status !== "undefined")
            ? (examsData.exams as Exam[]).filter((e: Exam) => e.status === "published").length
            : (examsData.exams as Exam[]).length
        )
      : "—",
    wars: Array.isArray(battlesData?.battles) ? String(battlesData.battles.length) : "—",
  };

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    async function fetchPending() {
      if (!examsData?.exams?.length) {
        setPendingCount(0);
        return;
      }
      try {
        const counts = await Promise.all(
          (examsData.exams as Exam[]).map(async (e: Exam) => {
            const list = await listAnswerSheets(e.id);
            return list.filter((s) => s.status === "ocr_done").length;
          }),
        );
        const total = counts.reduce((a, b) => a + b, 0);
        if (mounted) setPendingCount(total);
      } catch (_err) {
        void _err;
        if (mounted) setPendingCount(null);
      }
    }
    fetchPending();
    return () => {
      mounted = false;
    };
  }, [examsData]);

  // 最近のバトルからログを取得して表示する
  const [battleLogs, setBattleLogs] = useState<{ battleId: string; turn: number; text: string }[] | null>(null);
  useEffect(() => {
    let mounted = true;
    async function fetchLogs() {
      if (!battlesData?.battles?.length) {
        if (mounted) setBattleLogs([]);
        return;
      }
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
        const ids = (battlesData.battles as BattleSummary[]).slice(0, 5).map((b: BattleSummary) => b.battleId);
        const results = await Promise.all(
          ids.map(async (id: string) => {
            const r = await fetch(`${API_BASE}/api/battles/${id}/result`, { credentials: "include" });
            if (!r.ok) return null;
            const json = await r.json();
            return json as BattleResult;
          }),
        );
        const lines: { battleId: string; turn: number; text: string }[] = [];
        results.forEach((res: BattleResult | null) => {
          if (!res || !res.logs) return;
          res.logs.forEach((log: BattleResultLog) => {
            const actor = (usersData?.users as User[] | undefined)?.find((u: User) => String(u.id) === String(log.actorId))?.name ?? String(log.actorId);
            const target = (usersData?.users as User[] | undefined)?.find((u: User) => String(u.id) === String(log.targetId))?.name ?? String(log.targetId);
            lines.push({
              battleId: res.battleId,
              turn: log.turn,
              text: `ターン${log.turn}: ${actor} ${log.action} ${target} — ${log.damage}ダメージ`,
            });
          });
        });
        if (mounted) setBattleLogs(lines);
      } catch (_err) {
        void _err;
        if (mounted) setBattleLogs([]);
      }
    }
    fetchLogs();
    return () => { mounted = false; };
  }, [battlesData, usersData]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-8 flex items-center gap-3">
        <StatCard title="公開済み試験数
        " value={stats.exams} href="/admin/exams" />
        <h1 className="text-2xl font-black tracking-wide text-white">管理者ダッシュボード</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="ユーザー数" value={stats.users} href="/admin/users" />
        <StatCard title="公開済み試験数" value={stats.exams} href="/admin/exams" />
        <StatCard title="採点待ち" value={pendingCount === null ? "—" : String(pendingCount)} href="/admin/exams" />
        <StatCard title="進行中のバトル" value={stats.wars} href="/records" />
      </div>

      {(usersLoading || usersError) && (
        <div className="mt-4">
          {usersLoading ? (
            <p className="text-sky-300">ユーザー統計を読み込み中…</p>
          ) : (
            <p className="text-red-300">ユーザー統計の取得に失敗しました。</p>
          )}
        </div>
      )}

      <div className="mt-8">
        <ClassAverageScoreChart />

        <div className="mt-4">
          <Panel className="p-4">
            <h3 className="text-lg font-bold text-white">最近のアクティビティ</h3>
            <div className="mt-3 max-h-64 overflow-y-auto bg-[rgba(0,0,0,0.03)] p-3">
              {battleLogs === null ? (
                <p className="text-slate-400">読み込み中…</p>
              ) : battleLogs.length === 0 ? (
                <p className="text-slate-400">最近のアクティビティはありません。</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm font-mono text-slate-200">
                  {battleLogs.map((l, idx) => (
                    <li key={`${l.battleId}-${idx}`} className="px-2 py-1 rounded-sm bg-[rgba(255,255,255,0.02)]">
                      <span className="text-sky-300">[{l.battleId}]</span> {l.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        {/* ユーザー一覧は専用ページ (/admin/users) に移動しました */}

        <div className="mt-8">
          <Panel className="p-6">
            <h2 className="text-lg font-bold text-white">運用メモ</h2>
            <p className="mt-2 text-sm text-slate-300">
              管理者向けの詳しい操作はここに後で追加します。現状はシードデータを用いた確認用ダッシュボードです。
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
