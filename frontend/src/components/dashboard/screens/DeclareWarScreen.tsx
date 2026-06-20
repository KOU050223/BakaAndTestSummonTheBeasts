"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";

// 「/declare-war」タブ。ロールごとにサイドバー label と title を一致させる（案B）。
// TODO: 宣戦布告 API 実装後に本実装へ置き換える。
export function DeclareWarScreen() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return <NavPlaceholder role={user.role} href="/declare-war" />;
}
