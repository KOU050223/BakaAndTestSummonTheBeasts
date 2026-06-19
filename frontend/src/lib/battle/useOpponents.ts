"use client";

import { $api } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

export type Opponent =
  paths["/api/battles/opponents"]["get"]["responses"]["200"]["content"]["application/json"]["opponents"][number];

// 対戦相手の候補一覧（自分と同じクラスの生徒、自分は除く）を取得する。
// 除外・クラス絞り込みはバックエンド（GET /api/battles/opponents）が行う。
export function useOpponents() {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/battles/opponents",
    {},
    { staleTime: 60 * 1000 },
  );

  return { opponents: data?.opponents ?? [], isLoading, isError, error };
}
