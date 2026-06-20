"use client";

import Link from "next/link";
import { ClassAverageScoreChart } from "@/components/dashboard/ClassAverageScoreChart";
import { Panel } from "@/components/ui/Panel";
import { $api } from "@/lib/api/client";
import { listAnswerSheets } from "@/lib/api/grading";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { navLabel } from "@/lib/dashboard/navigation";
import { useEffect, useMemo, useState } from "react";

type TeacherExam = {
  id: number | string;
  title: string;
  subject: string;
  max_score?: number;
  answer_key_status?: "none" | "processing" | "done";
};

type ExamSheetStats = {
  pending: number;
  ocr_done: number;
  scored: number;
  total: number;
};

const SUBJECT_LABELS: Record<string, string> = {
  english: "英語",
  math: "数学",
  physics: "物理",
  chemistry: "化学",
  biology: "生物",
  earth_science: "地学",
  geography: "地理",
  japanese_history: "日本史",
  world_history: "世界史",
  civics: "公民",
  japanese: "国語",
  informatics: "情報",
};

const ANSWER_KEY_LABELS: Record<string, string> = {
  none: "未設定",
  processing: "OCR中",
  done: "設定済",
};

function subjectLabel(code: string): string {
  return SUBJECT_LABELS[code] ?? code;
}

function StatCard({ title, value, href }: { title: string; value: string; href?: string }) {
  const body = (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-300">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        {href ? <Link href={href}>{body}</Link> : body}
        <div className="text-slate-400">📈</div>
      </div>
    </Panel>
  );
}

function formatProgress(stats: ExamSheetStats | undefined): string {
  if (!stats || stats.total === 0) return "—";
  return `${stats.scored} / ${stats.total}`;
}

// 教師用ダッシュボード。自分が作成した試験と採点状況の概要を表示する。
export function TeacherDashboard() {
  const { user } = useCurrentUser();
  const pageTitle = user ? navLabel(user.role, "/dashboard") : "教師ダッシュボード";

  const { data: examsData, isLoading: examsLoading, isError: examsError } = $api.useQuery(
    "get",
    "/api/exams",
  );
  const { data: battlesData } = $api.useQuery("get", "/api/battles", { refetchInterval: 5000 });

  const exams = useMemo(
    () => (Array.isArray(examsData?.exams) ? (examsData.exams as TeacherExam[]) : []),
    [examsData],
  );

  const [sheetStats, setSheetStats] = useState<{
    pendingGrading: number | null;
    processing: number | null;
    byExam: Record<string, ExamSheetStats>;
  }>({ pendingGrading: null, processing: null, byExam: {} });

  useEffect(() => {
    let mounted = true;

    async function fetchSheetStats() {
      if (exams.length === 0) {
        if (mounted) {
          setSheetStats({ pendingGrading: 0, processing: 0, byExam: {} });
        }
        return;
      }

      try {
        const results = await Promise.all(
          exams.map(async (exam) => {
            const list = await listAnswerSheets(exam.id);
            const stats: ExamSheetStats = {
              pending: list.filter((s) => s.status === "pending").length,
              ocr_done: list.filter((s) => s.status === "ocr_done").length,
              scored: list.filter((s) => s.status === "scored").length,
              total: list.length,
            };
            return { examId: String(exam.id), stats };
          }),
        );

        if (!mounted) return;

        const byExam: Record<string, ExamSheetStats> = {};
        let pendingGrading = 0;
        let processing = 0;
        for (const { examId, stats } of results) {
          byExam[examId] = stats;
          pendingGrading += stats.ocr_done;
          processing += stats.pending;
        }
        setSheetStats({ pendingGrading, processing, byExam });
      } catch {
        if (mounted) {
          setSheetStats({ pendingGrading: null, processing: null, byExam: {} });
        }
      }
    }

    fetchSheetStats();
    return () => {
      mounted = false;
    };
  }, [exams]);

  const examCount = exams.length > 0 ? String(exams.length) : examsLoading ? "—" : "0";
  const battleCount = Array.isArray(battlesData?.battles)
    ? String(battlesData.battles.length)
    : "—";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-wide text-white">{pageTitle}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/exams"
            className="rounded-sm border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200 hover:bg-violet-400/20"
          >
            試験を作成
          </Link>
          <Link
            href="/submit"
            className="rounded-sm border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-400/20"
          >
            AI自動採点
          </Link>
          <Link
            href="/classes"
            className="rounded-sm border border-sky-400/40 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-400/10"
          >
            クラス管理
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="作成した試験" value={examCount} href="/exams" />
        <StatCard
          title="採点待ち"
          value={sheetStats.pendingGrading === null ? "—" : String(sheetStats.pendingGrading)}
          href="/submit"
        />
        <StatCard
          title="処理中"
          value={sheetStats.processing === null ? "—" : String(sheetStats.processing)}
          href="/submit"
        />
        <StatCard title="進行中のバトル" value={battleCount} href="/records" />
      </div>

      <Panel className="mt-8 p-4">
        <h3 className="text-lg font-bold text-white">試験一覧</h3>
        {examsLoading ? (
          <p className="mt-3 text-sky-300">試験一覧を読み込み中…</p>
        ) : examsError ? (
          <p className="mt-3 text-red-300">試験一覧の取得に失敗しました。</p>
        ) : exams.length === 0 ? (
          <p className="mt-3 text-slate-400">まだ試験がありません。「試験を作成」から登録できます。</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sky-400/30 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-3 font-semibold">試験名</th>
                  <th className="px-3 py-3 font-semibold">科目</th>
                  <th className="px-3 py-3 font-semibold">模範解答</th>
                  <th className="px-3 py-3 font-semibold">採点進捗</th>
                  <th className="px-3 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => {
                  const stats = sheetStats.byExam[String(exam.id)];
                  const keyStatus = exam.answer_key_status ?? "none";
                  return (
                    <tr key={exam.id} className="border-b border-sky-400/10 hover:bg-sky-400/5">
                      <td className="px-3 py-3 font-bold text-white">{exam.title}</td>
                      <td className="px-3 py-3 text-slate-300">{subjectLabel(exam.subject)}</td>
                      <td className="px-3 py-3 text-slate-300">
                        {ANSWER_KEY_LABELS[keyStatus] ?? keyStatus}
                      </td>
                      <td className="px-3 py-3 text-slate-300">{formatProgress(stats)}</td>
                      <td className="px-3 py-3">
                        <Link
                          href="/submit"
                          className="rounded-sm border border-sky-400/40 px-3 py-1 text-xs font-bold text-sky-200 hover:bg-sky-400/10"
                        >
                          AI採点へ
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-4">
        <ClassAverageScoreChart />
      </div>

    </div>
  );
}
