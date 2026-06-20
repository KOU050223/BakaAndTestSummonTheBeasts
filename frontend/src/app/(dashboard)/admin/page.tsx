"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { AdminDashboard } from "@/components/dashboard/admin/AdminDashboard";

// 管理者ダッシュボードページ
export default function AdminPage() {
  const { user } = useCurrentUser();

  if (user && user.role !== "school_admin") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-bold text-red-300">この画面には管理者権限が必要です。</p>
      </div>
    );
  }

  return <AdminDashboard />;
}
