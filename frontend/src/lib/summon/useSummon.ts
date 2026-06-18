"use client";

import { $api } from "@/lib/api/client";
import type { components, paths } from "@/lib/api/schema";

// 召喚獣ステータス（科目1体ぶん）。API レスポンスの summons の要素に対応する。
// 科目コード（code）と表示用ラベル（label）はバックエンドの Subject ドメインが出典。
export type Summon =
  paths["/api/students/{id}/summon"]["get"]["responses"]["200"]["content"]["application/json"]["summons"][number];

// User 型（id を取り出す用途）。
export type User = components["schemas"]["User"];

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
    summons: data?.summons ?? [],
    isLoading,
    isError,
    error,
  };
}
