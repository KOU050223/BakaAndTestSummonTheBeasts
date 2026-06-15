"use client";

import { $api } from "@/lib/api/client";

// 認証ユーザー情報を取得する共通フック。
// retry: false で 401 のときに無限リトライさせない（未認証なら即エラー扱いにする）。
// staleTime を長めに取り、layout と各 page から呼んでもキャッシュを共有して
// 追加リクエストが飛ばないようにする。
export function useCurrentUser() {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/me",
    {},
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  return { user: data, isLoading, isError, error };
}
