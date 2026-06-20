"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { NavPlaceholder } from "../NavPlaceholder";
import { useEffect, useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { $api } from "@/lib/api/client";

export function RecordsScreen() {
  const { user } = useCurrentUser();

  if (!user) return null;

  return <NavPlaceholder role={user.role} href="/records" />;
}
