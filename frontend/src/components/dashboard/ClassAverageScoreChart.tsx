"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import type { ClassSubjectAverage } from "@/lib/api/types";
import { useClasses } from "@/lib/classes/useClasses";
import {
  formatClassAverageScore,
  scoreBarColor,
  scoreBarRatio,
  sortClassesByGradeAndName,
  subjectMaxScore,
} from "@/lib/dashboard/classAverageScore";

const GRADES = [1, 2, 3] as const;

type Grade = (typeof GRADES)[number];

type ClassAverageScoreChartProps = {
  defaultGrade?: Grade;
};

export function ClassAverageScoreChart({ defaultGrade = 2 }: ClassAverageScoreChartProps) {
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const { classes, gradeMaxTotalScore, gradeMaxScoreBySubject, isLoading, isError } =
    useClasses(grade);

  const sortedClasses = useMemo(
    () => sortClassesByGradeAndName(classes ?? []),
    [classes],
  );

  const selectedClass = useMemo(() => {
    if (sortedClasses.length === 0) return null;
    if (selectedClassId && sortedClasses.some((c) => c.id === selectedClassId)) {
      return sortedClasses.find((c) => c.id === selectedClassId) ?? sortedClasses[0];
    }
    return sortedClasses[0];
  }, [sortedClasses, selectedClassId]);

  return (
    <Panel className="p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">クラス別平均スコア</h3>
          <p className="mt-1 text-xs text-slate-400">
            最高点は{formatClassAverageScore(gradeMaxTotalScore)}点
          </p>
        </div>
        <div className="flex gap-2">
          {GRADES.map((g) => {
            const isActive = g === grade;
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGrade(g);
                  setSelectedClassId(null);
                }}
                aria-current={isActive ? "true" : undefined}
                className={`rounded-sm px-3 py-1.5 text-xs font-bold tracking-wide transition-all duration-150 ${
                  isActive
                    ? "border border-sky-400/60 bg-sky-400/15 text-sky-200"
                    : "border border-sky-400/20 text-slate-400 hover:bg-white/5 hover:text-sky-200"
                }`}
              >
                {g}年生
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sky-300">クラス情報を読み込み中…</p>
      ) : isError ? (
        <p className="mt-4 text-red-300">クラス情報の取得に失敗しました。</p>
      ) : sortedClasses.length === 0 ? (
        <p className="mt-4 text-slate-400">{grade}年生のクラス情報がありません。</p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-wide text-slate-400">全教科合計</p>
            {sortedClasses.map((c) => (
              <ScoreBar
                key={c.id}
                label={`${c.name} (${c.studentCount}名)`}
                value={c.averageScore}
                maxValue={gradeMaxTotalScore}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-sky-400/20 pt-4">
            <p className="text-xs font-semibold tracking-wide text-slate-400">教科別平均</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sortedClasses.map((c) => {
                const isActive = selectedClass?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassId(c.id)}
                    aria-pressed={isActive}
                    className={`rounded-sm px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? "border border-violet-400/60 bg-violet-400/15 text-violet-200"
                        : "border border-sky-400/20 text-slate-400 hover:bg-white/5 hover:text-sky-200"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {selectedClass && (
              <div className="mt-4 flex flex-col gap-3">
                {(selectedClass.subjectAverages ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400">
                    {selectedClass.name}にはまだ採点データがありません。
                  </p>
                ) : (
                  (selectedClass.subjectAverages ?? []).map((sa) => (
                    <SubjectAverageBar
                      key={sa.subject}
                      subjectAverage={sa}
                      maxValue={subjectMaxScore(gradeMaxScoreBySubject, sa.subject)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

function ScoreBar({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}) {
  const ratio = scoreBarRatio(value, maxValue);
  const barClass = scoreBarColor(value, maxValue);

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 shrink-0 text-sm text-slate-300">{label}</div>
      <div className="flex-1">
        <div className="h-4 overflow-hidden rounded-sm bg-white/5">
          <div
            className={`h-4 transition-all duration-300 ${barClass}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-white">
        {formatClassAverageScore(value)}
      </div>
    </div>
  );
}

function SubjectAverageBar({
  subjectAverage,
  maxValue,
}: {
  subjectAverage: ClassSubjectAverage;
  maxValue: number;
}) {
  const ratio = scoreBarRatio(subjectAverage.averageScore, maxValue);
  const barClass = scoreBarColor(subjectAverage.averageScore, maxValue);

  return (
    <div className="flex items-center gap-4">
      <div className="w-40 shrink-0 text-sm text-slate-300">{subjectAverage.subjectLabel}</div>
      <div className="flex-1">
        <div className="h-3 overflow-hidden rounded-sm bg-white/5">
          <div
            className={`h-3 transition-all duration-300 ${barClass}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-white">
        {formatClassAverageScore(subjectAverage.averageScore)}
      </div>
    </div>
  );
}
