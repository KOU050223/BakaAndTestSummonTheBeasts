"use client";

import { $api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

export type Classmate = components["schemas"]["ClassStudent"];

// 対戦相手の候補として、自分と同じクラスの生徒一覧を取得する（自分自身は除く）。
// classId が未確定（自分のクラス未取得）の間はリクエストしない。
export function useClassmates(classId: number | undefined, selfId: number | undefined) {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/classes/{class_id}/students",
    { params: { path: { class_id: classId ?? 0 } } },
    {
      enabled: classId != null,
      staleTime: 60 * 1000,
    },
  );

  const classmates = (data?.students ?? []).filter((s) => s.id !== selfId);

  return { classmates, isLoading, isError, error };
}
