"use client";

import { useParams, useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { BattleResultScreen } from "@/components/battle/BattleResultScreen";
import { Placeholder } from "@/components/ui";

// 試召戦争の結果画面。
// /api/battles/:id/result から勝敗・ターン数を取得し、自分視点で表示する。
export default function BattleResultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data, isLoading, isError } = $api.useQuery(
    "get",
    "/api/battles/{id}/result",
    { params: { path: { id: params.id } } },
  );

  if (isLoading) return <Placeholder title="読み込み中…" />;
  if (isError || !data || !user) return <Placeholder title="結果を取得できませんでした" />;

  const outcome = data.winnerId === String(user.id) ? "win" : "lose";

  return (
    <div className="h-[calc(100vh-8rem)] w-full">
      <BattleResultScreen
        outcome={outcome}
        finalTick={data.turnCount}
        onBack={() => router.push("/declare-war")}
      />
    </div>
  );
}
