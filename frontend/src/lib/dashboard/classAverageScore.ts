import type { ClassSummary } from "@/lib/api/types";

// averageScore / subjectAverages.averageScore はいずれも全教科合計ベースの整数。

export function formatClassAverageScore(score: number): string {
  return Math.round(score).toLocaleString("ja-JP");
}

/** スコアを上限値で正規化したバー比率（0〜1）。 */
export function scoreBarRatio(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.min(value / maxValue, 1);
}

/** 相対位置に応じたバー色。 */
export function scoreBarColor(value: number, maxValue: number): string {
  if (maxValue <= 0) return "bg-slate-500";
  const ratio = value / maxValue;
  if (ratio >= 0.75) return "bg-emerald-400";
  if (ratio >= 0.5) return "bg-amber-400";
  return "bg-red-500";
}

export function sortClassesByGradeAndName(classes: ClassSummary[]): ClassSummary[] {
  return [...classes].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return a.name.localeCompare(b.name, "ja");
  });
}

/** 教科別最高点マップから該当教科の上限を返す（未定義なら 0）。 */
export function subjectMaxScore(
  gradeMaxScoreBySubject: Record<string, number> | undefined,
  subject: string,
): number {
  return gradeMaxScoreBySubject?.[subject] ?? 0;
}
