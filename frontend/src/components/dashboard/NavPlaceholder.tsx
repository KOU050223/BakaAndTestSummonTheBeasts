"use client";

import { Placeholder } from "@/components/ui";
import type { Role } from "@/lib/api/types";
import { navLabel } from "@/lib/dashboard/navigation";

type NavPlaceholderProps = {
  role: Role;
  href: string;
};


// 未実装画面用。中身は Placeholder のまま、title だけサイドバー label に合わせる（案B）。
export function NavPlaceholder({ role, href }: NavPlaceholderProps) {
  return <Placeholder title={navLabel(role, href)} />;
}
