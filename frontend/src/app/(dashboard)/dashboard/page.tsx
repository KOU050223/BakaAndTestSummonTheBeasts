"use client";

import { TeacherDashboard } from "@/components/dashboard/teacher/TeacherDashboard";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

export default function TeacherDashboardPage() {
  const { user } = useCurrentUser();

  if (user && user.role !== "teacher") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-lg font-bold text-red-300">この画面には教師権限が必要です。</p>
      </div>
    );
  }

  return <TeacherDashboard />;
}
