"use client";

import { $api } from "@/lib/api/client";

// Go Game Server への WebSocket 接続に使う JWT を取得する。
// httpOnly Cookie の認証トークンは JS から読めないため、バトル参加者本人が
// GET /api/battles/:id/token で別途発行してもらう（バックエンドが参加者を検証）。
// battleId が未確定の間はリクエストしない。
export function useWsToken(battleId: string | undefined) {
  const { data, isLoading, isError, error } = $api.useQuery(
    "get",
    "/api/battles/{id}/token",
    { params: { path: { id: battleId ?? "" } } },
    {
      enabled: battleId != null,
      retry: false,
      // トークンは短命だが、画面表示中の再取得は不要なので少しキャッシュする。
      staleTime: 60 * 1000,
    },
  );

  return { token: data?.token, isLoading, isError, error };
}
