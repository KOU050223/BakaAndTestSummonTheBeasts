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
  title?: string;
  maximumLabel?: string;
};

export function ClassAverageScoreChart({
  defaultGrade = 2,
  title = "クラス別平均スコア",
  maximumLabel = "最高点は",
}: ClassAverageScoreChartProps) {
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
          <h3 className="text-lg font-bold text-[var(--dashboard-text)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--dashboard-muted)]">
            {maximumLabel}{formatClassAverageScore(gradeMaxTotalScore)}点
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
                    ? "border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white"
                    : "border border-[var(--dashboard-border)] text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-accent-soft)] hover:text-[var(--dashboard-text)]"
                }`}
              >
                {g}年生
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="mt-4 text-[var(--dashboard-accent)]">クラス情報を読み込み中…</p>
      ) : isError ? (
        <p className="mt-4 text-red-300">クラス情報の取得に失敗しました。</p>
      ) : sortedClasses.length === 0 ? (
        <p className="mt-4 text-[var(--dashboard-muted)]">{grade}年生のクラス情報がありません。</p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-wide text-[var(--dashboard-muted)]">全教科合計</p>
            {sortedClasses.map((c) => (
              <ScoreBar
                key={c.id}
                label={`${c.name} (${c.studentCount}名)`}
                value={c.averageScore}
                maxValue={gradeMaxTotalScore}
              />
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--dashboard-border)]/25 pt-4">
            <p className="text-xs font-semibold tracking-wide text-[var(--dashboard-muted)]">教科別平均</p>
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
                        ? "border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent)] text-white"
                        : "border border-[var(--dashboard-border)] text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-accent-soft)] hover:text-[var(--dashboard-text)]"
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
                  <p className="text-sm text-[var(--dashboard-muted)]">
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
      <div className="w-40 shrink-0 text-sm text-[var(--dashboard-muted)]">{label}</div>
      <div className="flex-1">
        <div className="h-4 overflow-hidden rounded-sm bg-black/10">
          <div
            className={`h-4 transition-all duration-300 ${barClass}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-[var(--dashboard-text)]">
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
      <div className="w-40 shrink-0 text-sm text-[var(--dashboard-muted)]">{subjectAverage.subjectLabel}</div>
      <div className="flex-1">
        <div className="h-3 overflow-hidden rounded-sm bg-black/10">
          <div
            className={`h-3 transition-all duration-300 ${barClass}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <div className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-[var(--dashboard-text)]">
        {formatClassAverageScore(subjectAverage.averageScore)}
      </div>
    </div>
  );
}
