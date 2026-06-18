"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyScores, type MyScore } from "@/lib/api/grading";

// 召喚獣プレビューで使う、生徒自身の点数集計。
// - bySubject: 科目コード → その科目の直近スコア（召喚獣ステータスと突き合わせる用途）
// - total / max: 全科目の点数合計と満点合計（総合点表示用途）
export type ScoreSummary = {
  scores: MyScore[];
  bySubject: Record<string, MyScore>;
  total: number;
  max: number;
};

// 生徒の点数一覧を取得し、召喚獣プレビュー用に集計する。
// student 以外は /api/scores が空になるため、呼び出し側で生徒判定して enabled を渡す。
export function useMyScores(enabled: boolean) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my_scores"],
    queryFn: getMyScores,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const scores = data ?? [];

  // 同一科目に複数試験がある場合は scored_at が新しいものを採用する（直近の成績を映す）。
  const bySubject: Record<string, MyScore> = {};
  for (const s of scores) {
    const current = bySubject[s.subject];
    if (!current || new Date(s.scored_at) > new Date(current.scored_at)) {
      bySubject[s.subject] = s;
    }
  }

  const total = scores.reduce((sum, s) => sum + s.score, 0);
  const max = scores.reduce((sum, s) => sum + s.max_score, 0);

  return {
    summary: { scores, bySubject, total, max } satisfies ScoreSummary,
    isLoading,
    isError,
  };
}
