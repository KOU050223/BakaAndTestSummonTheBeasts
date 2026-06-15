"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { ROLE_LABEL } from "@/lib/dashboard/navigation";
import { LabelTag } from "@/components/ui";

type UserStatusCardProps = {
  user: User;
};

// TODO: /api/me に所属クラス情報が無いため暫定固定。API 拡張後に user 由来へ置き換える。
const FALLBACK_AFFILIATION = "文月学園 ・ 2年";

export function UserStatusCard({ user }: UserStatusCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: logout, isPending } = $api.useMutation(
    "delete",
    "/api/auth/logout",
    {
      onSettled() {
        // 認証ユーザー（/api/me）や前ユーザーのデータ（召喚獣ステータス等）が
        // キャッシュに残ると、同一セッションで別アカウントにログインした際に
        // 前ユーザーの情報が staleTime の間表示され得る。全キャッシュを破棄する。
        queryClient.clear();
        // Cookie 削除に失敗してもクライアント側はログイン画面へ戻す
        router.replace("/login");
      },
    },
  );

  // 名前の先頭1文字をアバター代わりに表示する
  const initial = user.name.trim().charAt(0) || "?";

  return (
    <div className="border-t border-sky-400/30 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-base font-black text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]">
          {initial}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-white">
            {user.name}
          </span>
          <span className="flex items-center gap-1.5 text-[0.7rem] text-slate-400/80">
            <LabelTag variant="info">{ROLE_LABEL[user.role]}</LabelTag>
            <span className="truncate">{FALLBACK_AFFILIATION}</span>
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => logout({})}
        disabled={isPending}
        className="mt-3 w-full rounded-sm border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold tracking-wide text-red-300 transition-all duration-150 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "ログアウト中..." : "ログアウト"}
      </button>
    </div>
  );
}
