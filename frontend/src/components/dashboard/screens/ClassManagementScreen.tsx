"use client";

import { useMemo, useState } from "react";
import { Panel, Button, LabelTag } from "@/components/ui";
import {
  useClasses,
  useClassStudents,
  useChangeStudentClass,
  useGradeStudents,
  useApplyAssignments,
  useSetClassLeader,
  type StudentWithClass,
} from "@/lib/classes/useClasses";
import type { ClassSummary, ClassStudent } from "@/lib/api/types";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { navLabel } from "@/lib/dashboard/navigation";

// 学年切り替えタブで扱う学年。
const GRADES = [1, 2, 3] as const;

// クラスカードのプログレスバーで使う満点（平均スコアの正規化用）。
// 最高クラスでもバーが振り切れない程度に少し上を取る。
const SCORE_BAR_MAX = 10000;

// 学年全生徒を総合スコア降順に並べ、上位ブロックから A, B, C… へ連続配分する。
// 本作の世界観は成績順クラス編成（A=最上位 … F=最下位）なので、ラウンドロビン
// ではなくブロック配分にする。戻り値は {studentId, classId} の配列。
function computeAssignmentsByScore(
  students: StudentWithClass[],
  gradeClasses: ClassSummary[],
) {
  const ordered = [...students].sort((a, b) => b.totalScore - a.totalScore);
  return ordered.map((s, i) => {
    const classIndex = Math.floor((i * gradeClasses.length) / ordered.length);
    return { studentId: s.id, classId: gradeClasses[classIndex].id };
  });
}

// クラス管理画面（教師・管理者）。
// 学年でクラスを絞り込み、クラスカードを選ぶと下に生徒一覧を表示する。
// クラス変更・自動振り分けはいずれも API 経由で DB に即時反映する。
export function ClassManagementScreen() {
  const { user } = useCurrentUser();
  const pageTitle = user ? navLabel(user.role, "/classes") : "クラス管理";
  const [grade, setGrade] = useState<(typeof GRADES)[number]>(2);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const { classes, isLoading, isError } = useClasses(grade);
  const { changeClass } = useChangeStudentClass();
  const { applyAssignments, isPending: isAssigning } = useApplyAssignments();

  // 学年内のクラス（A〜F順を保証）。選択中クラスが無ければ先頭を既定にする。
  const gradeClasses = useMemo(() => classes ?? [], [classes]);
  const activeClassId =
    selectedClassId && gradeClasses.some((c) => c.id === selectedClassId)
      ? selectedClassId
      : (gradeClasses[0]?.id ?? null);
  const activeClass = gradeClasses.find((c) => c.id === activeClassId) ?? null;

  const { setLeader, isPending: isSettingLeader } = useSetClassLeader(activeClassId ?? undefined);

  // 選択クラスの生徒（StudentTable 表示用）。
  const {
    students,
    isLoading: isStudentsLoading,
    isError: isStudentsError,
  } = useClassStudents(activeClassId ?? undefined);

  // 自動振り分けの対象は学年内の全生徒。全クラス分を並列取得して集約する。
  const classIds = useMemo(() => gradeClasses.map((c) => c.id), [gradeClasses]);
  const { students: gradeStudents, isLoading: isGradeStudentsLoading } =
    useGradeStudents(classIds);

  const handleSelectGrade = (g: (typeof GRADES)[number]) => {
    setGrade(g);
    setSelectedClassId(null);
  };

  // スコアで自動振り分け：学年全生徒を成績順にブロック配分し、バルク PATCH で
  // DB に一括反映する。成功時はフックの invalidate で一覧・集計が再取得される。
  // 学年全生徒のロード完了前に実行すると一部生徒が欠けるため、ロード中は弾く。
  const handleAssignByScore = () => {
    if (isGradeStudentsLoading) return;
    if (gradeStudents.length === 0 || gradeClasses.length === 0) return;
    applyAssignments(computeAssignmentsByScore(gradeStudents, gradeClasses));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        title={pageTitle}
        grade={grade}
        onAssignByScore={handleAssignByScore}
        isAssigning={isAssigning}
        disabled={isAssigning || isGradeStudentsLoading}
      />

      {/* 学年切り替え */}
      <GradeTabs grade={grade} onChange={handleSelectGrade} />

      {/* クラスカード */}
      {isLoading ? (
        <p className="animate-pulse text-sm font-bold tracking-widest text-[#f1ddb0]">
          クラスを読み込み中...
        </p>
      ) : isError ? (
        <p className="text-sm text-red-300">
          クラス一覧の取得に失敗しました。時間をおいて再度お試しください。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gradeClasses.map((c) => (
              <ClassCard
                key={c.id}
                schoolClass={c}
                isActive={c.id === activeClassId}
                onSelect={() => setSelectedClassId(c.id)}
              />
            ))}
          </div>

          {/* 選択クラスの生徒一覧 */}
          {activeClass && (
            <StudentTable
              className={activeClass.name}
              students={students}
              isLoading={isStudentsLoading}
              isError={isStudentsError}
              gradeClasses={gradeClasses}
              currentClassId={activeClass.id}
              onChangeClass={changeClass}
              onSetLeader={setLeader}
              isSettingLeader={isSettingLeader}
            />
          )}
        </>
      )}
    </div>
  );
}

function Header({
  title,
  grade,
  onAssignByScore,
  isAssigning,
  disabled,
}: {
  title: string;
  grade: number;
  onAssignByScore: () => void;
  isAssigning: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-wide text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[#f1ddb0]">
          {grade}年生のクラスをスコアに応じて振り分けできます
        </p>
      </div>
      <Button onClick={onAssignByScore} disabled={disabled}>
        {isAssigning ? "振り分け中..." : "🔄 スコアで自動振り分け"}
      </Button>
    </div>
  );
}

function GradeTabs({
  grade,
  onChange,
}: {
  grade: number;
  onChange: (g: (typeof GRADES)[number]) => void;
}) {
  return (
    <div className="flex gap-2">
      {GRADES.map((g) => {
        const isActive = g === grade;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-sm px-4 py-2 text-sm font-bold tracking-wide transition-all duration-150 ${
              isActive
                ? "border border-[#e2c27e] bg-[#6d211b] text-white shadow-md"
                : "border border-[#9a7044] bg-[#f3e3ba] text-[#352315] hover:bg-white"
            }`}
          >
            {g}年生
          </button>
        );
      })}
    </div>
  );
}

function ClassCard({
  schoolClass,
  isActive,
  onSelect,
}: {
  schoolClass: ClassSummary;
  isActive: boolean;
  onSelect: () => void;
}) {
  const ratio = Math.min(schoolClass.averageScore / SCORE_BAR_MAX, 1);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={`theme-card flex flex-col gap-3 rounded-sm border-2 p-5 text-left transition-all duration-150 ${
        isActive
          ? "border-[#7a1f18] bg-white/90 shadow-[0_7px_16px_rgba(45,24,12,0.25)]"
          : "border-[#8f704c] bg-white/70 hover:border-[#7a1f18] hover:bg-white/90"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xl font-black tracking-wide text-[var(--dashboard-text)]">
          {schoolClass.name}
        </span>
        <span className="text-xs font-semibold text-[var(--dashboard-muted)]">
          {schoolClass.studentCount}名
        </span>
      </div>
      <div className="text-sm text-[var(--dashboard-muted)]">
        平均スコア{" "}
        <span className="font-mono text-lg font-bold text-[#5f2119]">
          {schoolClass.averageScore.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--dashboard-bar-bg)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7a1f18] to-[#c49a4b]"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </button>
  );
}

function StudentTable({
  className,
  students,
  isLoading,
  isError,
  gradeClasses,
  currentClassId,
  onChangeClass,
  onSetLeader,
  isSettingLeader,
}: {
  className: string;
  students: ClassStudent[] | undefined;
  isLoading: boolean;
  isError: boolean;
  gradeClasses: ClassSummary[];
  currentClassId: number;
  onChangeClass: (studentId: number, classId: number) => void;
  onSetLeader: (studentId: number | null) => void;
  isSettingLeader: boolean;
}) {
  return (
    <Panel className="p-6">
      <h2 className="mb-4 text-lg font-black tracking-wide text-[var(--dashboard-text)]">
        {className} ― 生徒一覧
      </h2>

      {isLoading ? (
        <p className="animate-pulse text-sm font-bold tracking-widest text-[var(--dashboard-accent)]">
          生徒を読み込み中...
        </p>
      ) : isError ? (
        <p className="text-sm text-red-800">
          生徒一覧の取得に失敗しました。時間をおいて再度お試しください。
        </p>
      ) : !students || students.length === 0 ? (
        <p className="text-sm text-[var(--dashboard-muted)]">このクラスに生徒はいません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--dashboard-border)] bg-[var(--dashboard-table-header-bg)] text-left text-xs font-bold tracking-wide text-[var(--dashboard-table-header-text)]">
                <th className="px-3 py-2">氏名</th>
                <th className="px-3 py-2">総合スコア</th>
                <th className="px-3 py-2">最高科目</th>
                <th className="px-3 py-2">現在のクラス</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  currentClassName={className}
                  currentClassId={currentClassId}
                  gradeClasses={gradeClasses}
                  onChangeClass={(targetClassId) =>
                    onChangeClass(s.id, targetClassId)
                  }
                  onSetLeader={onSetLeader}
                  isSettingLeader={isSettingLeader}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function StudentRow({
  student,
  currentClassName,
  currentClassId,
  gradeClasses,
  onChangeClass,
  onSetLeader,
  isSettingLeader,
}: {
  student: ClassStudent;
  currentClassName: string;
  currentClassId: number;
  gradeClasses: ClassSummary[];
  onChangeClass: (classId: number) => void;
  onSetLeader: (studentId: number | null) => void;
  isSettingLeader: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (

    <tr className="border-b border-gray-200 text-gray-900">
      <td className="px-3 py-3 font-semibold">
        <span className="flex items-center gap-2">
          {student.name}
          {student.leader && (
            <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-400/40">
              クラス代表
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-3 font-mono font-bold text-sky-700">
        {student.totalScore.toLocaleString()}
      </td>
      <td className="px-3 py-3 text-gray-700">
        {student.topSubject.name} {student.topSubject.score}点
      </td>
      <td className="px-3 py-3">
        <LabelTag>{currentClassName}</LabelTag>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <select
              autoFocus
              defaultValue={currentClassId}
              onChange={(e) => {
                if (e.target.value) onChangeClass(Number(e.target.value));
                setEditing(false);
              }}
              onBlur={() => setEditing(false)}
              className="rounded-sm border border-sky-400/40 bg-[rgba(8,22,46,0.95)] px-2 py-1 text-sm text-slate-100"
            >
              {gradeClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-sm border border-sky-400 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 transition-colors hover:bg-sky-100"
            >
              クラス変更
            </button>
          )}
          {student.leader ? (
            <button
              type="button"
              disabled={isSettingLeader}
              onClick={() => onSetLeader(null)}
              className="rounded-sm border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              解除
            </button>
          ) : (
            <button
              type="button"
              disabled={isSettingLeader}
              onClick={() => onSetLeader(student.id)}
              className="rounded-sm border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              クラス代表に設定
            </button>
          )}
        </div>

      </td>
    </tr>
  );
}
