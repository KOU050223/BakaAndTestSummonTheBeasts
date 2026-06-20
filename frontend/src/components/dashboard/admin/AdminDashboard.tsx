import { NavPlaceholder } from "../NavPlaceholder";

// 管理者の「/」タブ（サイドバー: 管理者ダッシュボード）。本実装前は Placeholder。
// TODO: 管理者向けのユーザー・学校管理 UI を本実装へ置き換える。
export function AdminDashboard() {
  return <NavPlaceholder role="school_admin" href="/" />;
}
