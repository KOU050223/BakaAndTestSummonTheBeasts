"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { $api } from "@/lib/api/client";
import { Panel } from "@/components/ui/Panel";
import Link from "next/link";

export default function AdminExamsPage() {
  const { user } = useCurrentUser();

  if (user && user.role !== "school_admin") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-bold text-red-300">この画面には管理者権限が必要です。</p>
      </div>
    );
  }

  const { data, isLoading, isError } = $api.useQuery("get", "/api/exams");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-6">
        <h1 className="text-2xl font-black text-white">試験管理</h1>
        <p className="mt-1 text-sm text-slate-300">登録済みの試験一覧を参照します。</p>
      </div>

      <Panel className="mt-6">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sky-300">読み込み中…</p>
        ) : isError ? (
          <p className="px-5 py-10 text-center text-red-300">試験一覧の取得に失敗しました。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-400/30 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3 font-semibold">試験名</th>
                  <th className="px-5 py-3 font-semibold">科目</th>
                  <th className="px-5 py-3 font-semibold">作成者</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {data?.exams.map((e) => (
                  <tr key={e.id} className="border-b border-sky-400/10 hover:bg-sky-400/5">
                    <td className="px-5 py-3 font-bold text-white">{e.title}</td>
                    <td className="px-5 py-3 text-slate-300">{e.subjectId}</td>
                    <td className="px-5 py-3 text-slate-300">{e.createdBy}</td>
                    <td className="px-5 py-3">
                      <Link href={`/teacher/exams/${e.id}/scores`} className="rounded-sm border border-sky-400/40 px-3 py-1 text-xs font-bold text-sky-200">
                        点数入力へ
                      </Link>
                    </td>
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
