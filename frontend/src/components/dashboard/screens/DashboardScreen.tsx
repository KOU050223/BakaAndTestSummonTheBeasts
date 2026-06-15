"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { StudentDashboard } from "../student/StudentDashboard";
import { TeacherDashboard } from "../teacher/TeacherDashboard";
import { AdminDashboard } from "../admin/AdminDashboard";

// 「ダッシュボード」タブの画面。role に応じて中身を出し分ける。
// 他タブの *Screen と同じ「1タブ＝1画面」の粒度に揃えるためのラッパー。
export function DashboardScreen() {
  // layout 側で認証ガード済みのためキャッシュ共有で即取得できる
  const { user } = useCurrentUser();
  if (!user) return null;

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "school_admin":
      return <AdminDashboard />;
    default:
      // role は student/teacher/school_admin のユニオンなのでここには型上到達しない。
      // 将来 role が増えた場合はこの代入がコンパイルエラーになり、対応漏れに気付ける。
      // 万一未知の role が実行時に届いたら（API とのスキーマ乖離）黙って握りつぶさず明示的に失敗させる。
      return assertNever(user.role);
  }
}

function assertNever(role: never): never {
  throw new Error(`未対応の role です: ${String(role)}`);
}
