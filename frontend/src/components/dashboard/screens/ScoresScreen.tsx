"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Panel, LabelTag } from "@/components/ui";
import { getMyScores } from "@/lib/api/grading";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";

type MyScore = { exam_id: number | string; exam_title: string; subject_label: string; scored_at: string; score: number; max_score: number };
type RankingRow = { user_id: number | string; rank: number; name: string; school_class?: { id?: number | string; name?: string }; total_score: number };

export function ScoresScreen() {
  const { user } = useCurrentUser();
  const { data, isLoading } = useQuery({
    queryKey: ["my_scores"],
    queryFn: getMyScores,
    enabled: user?.role === "student",
  });

  const title =
    user?.role === "student"
      ? "成績・召喚獣ステータス"
      : user?.role === "teacher"
        ? "点数管理"
        : "全体ランキング";

  if (user?.role === "teacher") {
    return <NavPlaceholder role={user.role} href="/scores" />;
  }

  return (
    <Panel className="mx-auto mt-6 max-w-5xl">
      <div className="overflow-hidden rounded-lg border border-sky-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60 shadow-md">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-sky-600/20 bg-gradient-to-r from-sky-800/40 to-sky-900/10">
          <LabelTag variant="info">成績</LabelTag>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        <div className="p-4">
          {isLoading && (
            <p className="text-sky-300 animate-pulse text-center py-10">読み込み中...</p>
          )}

          {/* If user is student, show personal list; otherwise show rankings */}
          {user?.role !== "student" ? (
            <AdminRankings />
          ) : (
            (!isLoading && (!data || data.length === 0) ? (
              <div className="py-10 text-center">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-slate-400 text-sm">まだ採点された試験がありません</p>
              </div>
            ) : (
              data && data.length > 0 && (
                <div className="flex flex-col gap-3">
                  {(data as MyScore[]).map((s: MyScore) => {
                    const pct = s.max_score > 0 ? Math.round((s.score / s.max_score) * 100) : 0;
                    const color = pct >= 80 ? "text-green-300" : pct >= 60 ? "text-yellow-300" : "text-red-400";
                    return (
                      <div key={s.exam_id} className="px-5 py-4 bg-white/3 border border-sky-400/8 rounded-sm flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-white font-bold">{s.exam_title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {s.subject_label} · {new Date(s.scored_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-2xl font-black ${color}`}>{s.score}</span>
                          <span className="text-slate-400 text-sm"> / {s.max_score}</span>
                          <p className={`text-xs font-bold ${color}`}>{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ))
          )}
        </div>
      </div>
    </Panel>
  );
}

function AdminRankings() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin_rankings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/rankings`, { credentials: "include" });
      if (!res.ok) throw new Error("ランキングの取得に失敗しました");
      return (await res.json()) as { rankings: RankingRow[] };
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) return <p className="text-sky-300 animate-pulse text-center py-6">ランキングを読み込み中…</p>;
  if (isError) return <p className="text-red-300 text-center py-6">ランキングの取得に失敗しました</p>;

  const rows = data?.rankings ?? [];

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-md border border-sky-500/20 bg-slate-800/60">
        <div className="px-3 py-2 border-b border-sky-500/10 bg-slate-900/50">
          <p className="text-slate-300 text-sm">成績</p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col className="w-28" />
                <col className="w-[55%]" />
                <col className="w-36" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="text-slate-400 text-sm border-b border-sky-500/10">
                  <th className="py-3 text-left">順位</th>
                  <th className="py-3 text-left">氏名</th>
                  <th className="py-3 text-left">クラス</th>
                  <th className="py-3 text-right">総合点</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(rows as RankingRow[]).map((r: RankingRow) => (
                  <tr key={r.user_id} className="border-b border-sky-500/6 hover:bg-slate-700/30 align-middle">
                    <td className="py-3 align-middle pl-4">
                      <div className="flex items-center justify-start">
                        {renderRankBadge(r.rank)}
                      </div>
                    </td>
                    <td className="py-3 align-middle text-white font-semibold truncate">{r.name}</td>
                    <td className="py-3 align-middle text-slate-300">{r.school_class?.name ?? "-"}</td>
                    <td className="py-3 align-middle text-right text-white font-bold">{Math.round(r.total_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoresScreen;

function renderRankBadge(rank: number | string) {
  const n = Number(rank) || 0;
  if (n === 1) {
    return (
      <span title="1位" className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 text-white flex items-center justify-center font-extrabold text-sm shadow-[0_6px_24px_rgba(255,190,66,0.25)] ring-2 ring-yellow-300">{n}</span>
    );
  }
  if (n === 2) {
    return (
      <span title="2位" className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 flex items-center justify-center font-bold text-sm shadow-[0_4px_18px_rgba(200,200,210,0.12)] ring-1 ring-slate-300">{n}</span>
    );
  }
  if (n === 3) {
    return (
      <span title="3位" className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_18px_rgba(220,140,60,0.14)] ring-1 ring-amber-400">{n}</span>
    );
  }

  if (n > 3 && n <= 10) {
    return (
      <span title={`${n}位`} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">{n}</span>
    );
  }

  // lower ranks: muted, smaller
  return (
    <span title={`${n}位`} className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs border border-slate-600">{n}</span>
  );
}
