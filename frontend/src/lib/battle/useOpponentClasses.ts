"use client";

import { $api } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

export type OpponentClass =
  paths["/api/battles/opponent_classes"]["get"]["responses"]["200"]["content"]["application/json"]["classes"][number];

// クラス戦の相手クラス候補一覧（生徒が在籍するクラスのみ）を取得する。
// 平均点・人数などの機密を含まない軽量版で、生徒・教師の宣戦布告画面で使う。
export function useOpponentClasses() {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/battles/opponent_classes",
    {},
    { staleTime: 60 * 1000 },
  );

  return { classes: data?.classes ?? [], isLoading, isError, error };
}
