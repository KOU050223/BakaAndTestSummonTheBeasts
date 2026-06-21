"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/lib/api/types";
import { NAV_BY_ROLE, type NavItem } from "@/lib/dashboard/navigation";
import { UserStatusCard } from "./UserStatusCard";

type SidebarProps = {
  user: User;
  isOpen?: boolean;
  onToggle?: () => void;
};

export function Sidebar({
  user,
  isOpen = true,
  onToggle = () => undefined,
}: SidebarProps) {
  const pathname = usePathname();
  const sections = NAV_BY_ROLE[user.role];

  return (
    <aside
      data-state={isOpen ? "open" : "closed"}
      className={`dashboard-sidebar relative z-10 flex shrink-0 flex-col bg-[var(--dashboard-sidebar)] backdrop-blur-[var(--dashboard-blur)] transition-[width,border-color] duration-300 ease-in-out ${
        isOpen
          ? "w-64 border-r border-[var(--dashboard-border)]"
          : "w-0 border-r border-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "ナビゲーションを閉じる" : "ナビゲーションを開く"}
        aria-expanded={isOpen}
        className={`dashboard-sidebar-toggle absolute top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-sidebar)] text-[var(--dashboard-text)] shadow-md transition-[left,right,transform] duration-300 hover:bg-[var(--dashboard-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dashboard-accent)] ${
          isOpen ? "-right-4" : "left-3"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="flex min-h-0 w-64 flex-1 flex-col overflow-hidden">
          {/* ブランド */}
          <div className="dashboard-sidebar-brand flex items-center gap-2.5 border-b border-[var(--dashboard-border)] px-5 py-4 pr-8">
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
        </div>
      )}
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
