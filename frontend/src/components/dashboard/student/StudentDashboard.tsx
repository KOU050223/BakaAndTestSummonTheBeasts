import { NavPlaceholder } from "../NavPlaceholder";

// 生徒の「/」タブ（サイドバー: ダッシュボード）。本実装前は Placeholder。
export function StudentDashboard() {
  return <NavPlaceholder role="student" href="/" />;
}
