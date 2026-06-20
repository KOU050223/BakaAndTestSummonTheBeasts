import { NavPlaceholder } from "../NavPlaceholder";

// 教師の「/」タブ（サイドバー: 試験作成）。本実装前は Placeholder。
// TODO: 試験作成 UI を本実装へ置き換える。
export function TeacherDashboard() {
  return <NavPlaceholder role="teacher" href="/" />;
}
