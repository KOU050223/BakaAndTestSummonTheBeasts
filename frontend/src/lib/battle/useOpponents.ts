"use client";

import { $api } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

export type Opponent =
  paths["/api/battles/opponents"]["get"]["responses"]["200"]["content"]["application/json"]["opponents"][number];

// 対戦相手の候補一覧（自分以外の生徒全員、クラスを問わない）を取得する。
// 自分の除外はバックエンド（GET /api/battles/opponents）が行う。
export function useOpponents() {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/battles/opponents",
    {},
    { staleTime: 60 * 1000 },
  );

  return { opponents: data?.opponents ?? [], isLoading, isError, error };
}
