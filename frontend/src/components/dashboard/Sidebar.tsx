"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/api/types";
import { NAV_BY_ROLE, type NavItem } from "@/lib/dashboard/navigation";
import { UserStatusCard } from "./UserStatusCard";

type SidebarProps = {
  user: User;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const sections = NAV_BY_ROLE[user.role];

  return (
    <aside className="dashboard-sidebar flex w-64 shrink-0 flex-col border-r border-[var(--dashboard-border)] bg-[var(--dashboard-sidebar)] backdrop-blur-[var(--dashboard-blur)]">
      {/* ブランド */}
      <div className="dashboard-sidebar-brand flex items-center gap-2.5 border-b border-[var(--dashboard-border)] px-5 py-4">
        <span className="dashboard-sidebar-brand-icon text-2xl">📚</span>
        <div className="flex flex-col leading-tight">
          <span className="dashboard-sidebar-brand-title text-base font-black tracking-wide text-[var(--dashboard-text)]">
            試験召喚システム
          </span>
          <span className="dashboard-sidebar-brand-subtitle text-[0.6rem] tracking-[0.3em] text-[var(--dashboard-muted)] opacity-70">
            SHIKEN SHOUKAN
          </span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="dashboard-sidebar-nav flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <NavSection
            key={section.heading}
            label={section.heading}
            items={section.items}
            pathname={pathname}
          />
        ))}
      </nav>

      {user.role === "school_admin" && (
        <span
          aria-hidden="true"
          className="admin-sidebar-secret px-5 pb-2 text-right text-xl"
          title="管理者ダッシュボード"
        >
          🕶️
        </span>
      )}

      {/* ログイン状況 */}
      <UserStatusCard user={user} />
    </aside>
  );
}

type NavSectionProps = {
  label: string;
  items: NavItem[];
  pathname: string;
};

function NavSection({ label, items, pathname }: NavSectionProps) {
  return (
    <div className="dashboard-nav-section mb-4">
      <p className="dashboard-nav-heading px-3 pb-1.5 text-[0.65rem] font-bold tracking-[0.25em] text-[var(--dashboard-muted)] opacity-60">
        {label}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "border border-[var(--dashboard-border)] bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]"
                    : "border border-transparent text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-accent-soft)] hover:text-[var(--dashboard-accent)]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
