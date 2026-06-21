"use client";

import { useState, type ReactNode } from "react";
import type { User } from "@/lib/api/types";
import { dashboardThemeForUser } from "@/lib/dashboard/dashboardTheme";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  user: User;
  children: ReactNode;
};

// 所属クラスのテーマを一度だけ宣言し、配下はセマンティック変数を継承する。
export function DashboardShell({ user, children }: DashboardShellProps) {
  const theme = dashboardThemeForUser(user.role, user.school_class?.name);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      data-theme={theme}
      className="dashboard-theme flex min-h-screen font-[family-name:var(--dashboard-font)] text-[var(--dashboard-text)]"
    >
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <main
        className={`min-w-0 flex-1 overflow-y-auto p-6 transition-[padding] duration-300 ${
          isSidebarOpen
            ? ""
            : "pl-[var(--dashboard-sidebar-toggle-clearance)]"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
