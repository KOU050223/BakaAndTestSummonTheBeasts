"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { DashboardShell } from "@/components/dashboard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isError } = useCurrentUser();

  // 未認証（/api/me が 401 などで失敗）ならログイン画面へ。
  // client.ts の onResponse でも 401 をリダイレクトするが、取得前のレースや
  // ローディング状態を含めてここでも明示的にガードする。
  useEffect(() => {
    if (isError) {
      router.replace("/login");
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d2447] to-[#0a3a5c]">
        <p className="animate-pulse text-lg font-bold tracking-widest text-sky-300 [text-shadow:0_0_12px_rgba(56,189,248,0.7)]">
          召喚中...
        </p>
      </div>
    );
  }

  // 未認証・リダイレクト待ちの間は何も描画しない
  if (!user) {
    return null;
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
