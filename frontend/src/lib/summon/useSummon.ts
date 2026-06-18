"use client";

import { $api } from "@/lib/api/client";

// 召喚獣ステータス（科目1体ぶん）。API レスポンスの summons の値に対応する。
export type SummonStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

// 科目コードをキー、ステータスを値に持つマップ。
export type SummonMap = Record<string, SummonStats>;

// 指定生徒の召喚獣ステータスを取得する。
// 点数登録時にバックエンドで再計算・永続化された SummonStatus の実データを返す。
// studentId が未指定の間はリクエストしない（自分のIDが確定してから呼ぶ用途）。
export function useSummon(studentId: number | undefined) {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/students/{id}/summon",
    { params: { path: { id: studentId ?? 0 } } },
    {
      enabled: studentId != null,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  return {
    summons: (data?.summons ?? {}) as SummonMap,
    isLoading,
    isError,
    error,
  };
}
