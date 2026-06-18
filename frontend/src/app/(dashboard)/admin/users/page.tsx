"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { UserManagementScreen } from "@/components/dashboard";

// 管理者専用のユーザー管理ページ。
// 認証・DashboardShell は (dashboard)/layout.tsx が担う。
// ここでは school_admin 以外を弾く（API 側も authorize_school_admin! で二重に守る）。
export default function AdminUsersPage() {
  const { user } = useCurrentUser();

  if (user && user.role !== "school_admin") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-bold text-red-300">この画面には管理者権限が必要です。</p>
      </div>
    );
  }

  return <UserManagementScreen />;
}
