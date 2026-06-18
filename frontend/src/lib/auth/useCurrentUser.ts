"use client";

import { $api } from "@/lib/api/client";
import { isUnauthorizedError } from "@/lib/api/errors";

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

  // 401（未認証）と、それ以外の真のエラー（5xx・通信断など）を呼び出し側で
  // 区別できるようにする。前者はログイン画面へ誘導、後者はエラー表示に使う。
  const isUnauthorized = isError && isUnauthorizedError(error);

  return { user: data, isLoading, isError, isUnauthorized, error };
}
