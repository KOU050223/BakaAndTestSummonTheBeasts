"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { DashboardShell } from "@/components/dashboard";

// ダーク系背景の全画面ラッパー（ローディング／エラー表示で共用）
function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d2447] to-[#0a3a5c]">
      {children}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return (
      <FullScreen>
        <p className="animate-pulse text-lg font-bold tracking-widest text-sky-300 [text-shadow:0_0_12px_rgba(56,189,248,0.7)]">
          召喚中...
        </p>
      </FullScreen>
    );
  }

  // 未認証（401）のリダイレクトは client.ts の onResponse middleware が
  // status を見て /login へ飛ばす（取得前のレースもそこで捌かれる）。
  // ここで isError 全般を /login に飛ばすと、5xx や通信エラーまで
  // ログイン画面送りになってしまうため、認証エラーとそれ以外を区別する。
  // 401 はリダイレクト中なので何も描画しない。それ以外のエラーはその旨を表示する。
  if (isError) {
    return (
      <FullScreen>
        <p className="text-sm text-red-300">
          ユーザー情報の取得に失敗しました。時間をおいて再度お試しください。
        </p>
      </FullScreen>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
