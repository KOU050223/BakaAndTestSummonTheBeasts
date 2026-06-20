"use client";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { $api } from "@/lib/api/client";

// Minimal types for RecordsScreen
type BattleSummary = { battleId: string; created_at?: string; started_at?: string; updated_at?: string; date?: string; initiatorName?: string; initiator?: string | number; opponentName?: string; scoreA?: number; scoreB?: number; subjectId?: string; subject_label?: string; status?: string };
type BattleResult = { battleId: string; winnerId?: string | number; loserId?: string | number; score?: string } | null;
type User = { id: string | number; name: string };

// 管理者向け: 試召戦争ログ（バトル一覧 + 結果）
export function RecordsScreen() {
  const { data: battlesData, isLoading: battlesLoading } = $api.useQuery("get", "/api/battles");
  const { data: usersData } = $api.useQuery("get", "/api/admin/users");

  const [resultsMap, setResultsMap] = useState<Record<string, BattleResult>>({});
  const [loadingResults, setLoadingResults] = useState(false);

  // Map user id -> name for lookup
  const userNameById = useMemo(() => {
    const m: Record<string, string> = {};
    ((usersData?.users ?? []) as User[]).forEach((u: User) => { m[String(u.id)] = u.name; });
    return m;
  }, [usersData]);

  useEffect(() => {
    let mounted = true;
    async function fetchResults() {
      if (!battlesData?.battles?.length) return;
      setLoadingResults(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
        // limit to first 100 for safety
        const items = (battlesData.battles as BattleSummary[]).slice(0, 100);
        const pairs = await Promise.all(
          items.map((b: BattleSummary) => fetch(`${API_BASE}/api/battles/${b.battleId}/result`, { credentials: "include" }).then((r) => r.ok ? r.json() as BattleResult : null))
        );
        const map: Record<string, BattleResult> = {};
        items.forEach((b: BattleSummary, idx: number) => {
          map[b.battleId] = pairs[idx];
        });
        if (mounted) setResultsMap(map);
      } catch (err) {
          void err;
          if (mounted) setResultsMap({});
      } finally {
        if (mounted) setLoadingResults(false);
      }
    }
    fetchResults();
    return () => { mounted = false; };
  }, [battlesData]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-6">
        <Panel className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">試召戦争ログ</h2>
            <div className="text-sm text-slate-400">全クラス間の試召戦争履歴を表示します</div>
          </div>

          <div className="mt-4">
            {(battlesLoading || loadingResults) ? (
              <p className="text-sky-300">読み込み中…</p>
            ) : !battlesData?.battles?.length ? (
              <p className="text-slate-400">バトルが見つかりません。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-slate-400 text-sm">
                      <th className="px-4 py-3 text-left">日時</th>
                      <th className="px-4 py-3 text-left">仕掛け側</th>
                      <th className="px-4 py-3 text-left">受け側</th>
                      <th className="px-4 py-3 text-left">科目</th>
                      <th className="px-4 py-3 text-center">スコア</th>
                      <th className="px-4 py-3 text-left">結果</th>
                      <th className="px-4 py-3 text-left">状態</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    { (battlesData.battles as BattleSummary[]).map((b: BattleSummary) => {
                      const res = resultsMap[b.battleId];
                      // try to extract participants
                      const initiator = b.initiatorName ?? String(b.initiator ?? userNameById[String(res?.winnerId)] ?? b.opponentName ?? "-");
                      const receiver = b.opponentName ?? userNameById[String(res?.loserId)] ?? "-";
                      const datetime = b.created_at || b.started_at || b.updated_at || b.date || "-";
                      const subject = b.subjectId ?? b.subject_label ?? "-";
                      // score: if result contains scores, show them; else show dash
                      const score = res?.score ? res.score : (b.scoreA && b.scoreB ? `${b.scoreA} vs ${b.scoreB}` : "-");
                      const outcome = res ? (userNameById[String(res.winnerId)] ? `${userNameById[String(res.winnerId)]} の勝利` : "勝敗あり") : (b.status === "in_progress" ? "バトル中" : "—");

                      return (
                        <tr key={b.battleId} className="border-b border-sky-400/8 hover:bg-sky-400/5">
                          <td className="px-4 py-3 text-slate-300">{datetime}</td>
                          <td className="px-4 py-3 font-semibold text-white">{initiator}</td>
                          <td className="px-4 py-3 text-white">{receiver}</td>
                          <td className="px-4 py-3 text-slate-300">{subject}</td>
                          <td className="px-4 py-3 text-center text-white">{score}</td>
                          <td className="px-4 py-3 text-left text-slate-300">{outcome}</td>
                          <td className="px-4 py-3 text-slate-300">{b.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
