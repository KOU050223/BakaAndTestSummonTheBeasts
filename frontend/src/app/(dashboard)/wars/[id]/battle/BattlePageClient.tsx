"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useWsToken } from "@/lib/battle/useWsToken";
import { useBattleStore } from "@/lib/battle/battleStore";
import { Placeholder } from "@/components/ui";

const BattleScreen = dynamic(
  () => import("@/components/battle/BattleScreen").then((m) => m.BattleScreen),
  { ssr: false },
);

export function BattlePageClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { token, isLoading: tokenLoading, isError: tokenError } = useWsToken(params.id);
  const reset = useBattleStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [params.id, reset]);

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
