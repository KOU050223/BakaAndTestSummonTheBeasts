"use client";

import { $api } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

export type BattleListItem =
  paths["/api/battles"]["get"]["responses"]["200"]["content"]["application/json"]["battles"][number];

// 自分が参加している（または作成した）バトル一覧を取得する。
// 相手が作成した waiting バトルへの入室導線として使う。
// refetchInterval で軽くポーリングし、相手が作成した直後のバトルにも気づけるようにする。
export function useBattles() {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/battles",
    {},
    {
      refetchInterval: 5000,
    },
  );

  return { battles: data?.battles ?? [], isLoading, isError, error };
}
