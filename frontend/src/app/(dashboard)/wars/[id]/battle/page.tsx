"use client";

import { useParams, useRouter } from "next/navigation";
import { BattleScreen } from "@/components/battle/BattleScreen";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

// 試召戦争のバトル画面。
// BattleScreen が 3D シーン・HUD・WebSocket 同期を統合する。
// NOTE: WS 用 JWT の発行 API は未整備（フェーズ2c 後のバトル作成フローで対応）。
// 現状はデモトークンで接続し、サーバー側の認証実装と合わせて差し替える。
export default function BattlePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  return (
    <div className="h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl bg-slate-900">
      {!isLoading && user && (
        <BattleScreen
          battleId={params.id}
          token="demo-token"
          currentUserId={String(user.id)}
          onExit={() => router.push(`/wars/${params.id}/result`)}
        />
      )}
    </div>
  );
}
