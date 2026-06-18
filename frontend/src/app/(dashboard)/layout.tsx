"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, isLoading, isError, isUnauthorized } = useCurrentUser();

  // 未認証（401）なら確実にログイン画面へ遷移させる。
  // client.ts の middleware（window.location.href）だけに任せると、フルページ遷移が
  // 走る前に下の isError 分岐が描画され「取得に失敗しました」が見えてしまうため、
  // ここで Next.js のルーターによる即時 replace を行いレースを断つ。
  useEffect(() => {
    if (isUnauthorized) {
      router.replace("/login");
    }
  }, [isUnauthorized, router]);

  if (isLoading) {
    return (
      <FullScreen>
        <p className="animate-pulse text-lg font-bold tracking-widest text-sky-300 [text-shadow:0_0_12px_rgba(56,189,248,0.7)]">
          召喚中...
        </p>
      </FullScreen>
    );
  }

  // 401（未認証）はログイン画面へリダイレクト中なので何も描画しない。
  if (isUnauthorized) {
    return null;
  }

  // 401 以外のエラー（5xx・通信断など）はログイン送りにせず、その旨を表示する。
  // 「ログインへ飛ぶべきなのか／サーバーが落ちているのか」を区別できるよう文言を分ける。
  if (isError) {
    return (
      <FullScreen>
        <div className="flex max-w-sm flex-col items-center gap-2 px-4 text-center">
          <p className="text-sm font-bold text-red-300">
            ユーザー情報の取得に失敗しました
          </p>
          <p className="text-xs text-red-300/70">
            サーバーに接続できないか、サーバー側でエラーが発生しています。時間をおいて再度お試しください。
          </p>
        </div>
      </FullScreen>
    );
  }

  if (!user) {
    return null;
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
