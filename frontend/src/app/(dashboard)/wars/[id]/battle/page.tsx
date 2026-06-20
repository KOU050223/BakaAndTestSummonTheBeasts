"use client";

import { useParams, useRouter } from "next/navigation";
import { BattleScreen } from "@/components/battle/BattleScreen";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useWsToken } from "@/lib/battle/useWsToken";
import { Placeholder } from "@/components/ui";

// 試召戦争のバトル画面。
// BattleScreen が 3D シーン・HUD・WebSocket 同期を統合する。
// WS 接続用 JWT は GET /api/battles/:id/token で取得する（参加者本人のみ発行される）。
export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { token, isLoading: tokenLoading, isError: tokenError } = useWsToken(params.id);

  if (userLoading || tokenLoading) return <Placeholder title="バトルに接続中…" />;
  if (tokenError || !token) return <Placeholder title="このバトルに参加できません" />;
  if (!user) return <Placeholder title="ユーザー情報を取得できませんでした" />;

  return (
    <div className="h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl bg-slate-900">
      <BattleScreen
        battleId={params.id}
        token={token}
        currentUserId={String(user.id)}
        onExit={() => router.push(`/wars/${params.id}/result`)}
      />
    </div>
  );
}
