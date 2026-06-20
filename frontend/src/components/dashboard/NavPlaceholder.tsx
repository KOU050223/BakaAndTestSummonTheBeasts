"use client";

import { Placeholder } from "@/components/ui";
import type { Role } from "@/lib/api/types";
import { navLabel } from "@/lib/dashboard/navigation";

type NavPlaceholderProps = {
  role: Role;
  href: string;
};

export function NavPlaceholder({ role, href }: NavPlaceholderProps) {
  return <Placeholder title={navLabel(role, href)} />;
}
