"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";

// 「/records」タブ。ロールごとにサイドバー label と title を一致させる（案B）。
// TODO: 戦績・生徒一覧 API 実装後に本実装へ置き換える。
export function RecordsScreen() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return <NavPlaceholder role={user.role} href="/records" />;
}
