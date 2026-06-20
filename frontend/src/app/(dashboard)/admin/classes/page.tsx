"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { $api } from "@/lib/api/client";
import { Panel } from "@/components/ui/Panel";

export default function AdminClassesPage() {
  const { user } = useCurrentUser();

  if (user && user.role !== "school_admin") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-bold text-red-300">この画面には管理者権限が必要です。</p>
      </div>
    );
  }

  const { data, isLoading, isError } = $api.useQuery("get", "/api/classes");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-6">
        <h1 className="text-2xl font-black text-white">クラス管理</h1>
        <p className="mt-1 text-sm text-slate-300">クラス一覧と平均点・生徒数を確認します。</p>
      </div>

      <Panel className="mt-6">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sky-300">読み込み中…</p>
        ) : isError ? (
          <p className="px-5 py-10 text-center text-red-300">クラス一覧の取得に失敗しました。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-400/30 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">クラス名</th>
                  <th className="px-5 py-3 font-semibold">学年</th>
                  <th className="px-5 py-3 font-semibold">平均点</th>
                  <th className="px-5 py-3 font-semibold">生徒数</th>
                </tr>
              </thead>
              <tbody>
                {data?.classes.map((c) => (
                  <tr key={c.id} className="border-b border-sky-400/10 hover:bg-sky-400/5">
                    <td className="px-5 py-3 font-bold text-white">{c.name}</td>
                    <td className="px-5 py-3 text-slate-300">{c.grade}</td>
                    <td className="px-5 py-3 text-slate-300">{c.averageScore.toFixed(1)}</td>
                    <td className="px-5 py-3 text-slate-300">{c.studentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
