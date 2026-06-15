"use client";

import type { ReactNode } from "react";
import type { User } from "@/lib/api/types";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  user: User;
  children: ReactNode;
};

// サイドバー（左固定）＋メイン領域 の共通シェル。
// 背景はログイン画面と同じダーク系グラデーションで世界観を統一する。
export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0d2447] to-[#0a3a5c]">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
