"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";

export function RecordsScreen() {
  const { user } = useCurrentUser();

  if (!user) return null;

  return <NavPlaceholder role={user.role} href="/records" />;
}
