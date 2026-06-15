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
    <aside className="flex w-64 shrink-0 flex-col border-r border-sky-400/30 bg-[rgba(8,22,46,0.92)] backdrop-blur-md">
      {/* ブランド */}
      <div className="flex items-center gap-2.5 border-b border-sky-400/30 px-5 py-4">
        <span className="text-2xl">📚</span>
        <div className="flex flex-col leading-tight">
          <span className="text-base font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
            試験召喚システム
          </span>
          <span className="text-[0.6rem] tracking-[0.3em] text-slate-400/70">
            SHIKEN SHOUKAN
          </span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <NavSection
            key={section.heading}
            label={section.heading}
            items={section.items}
            pathname={pathname}
          />
        ))}
      </nav>

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
    <div className="mb-4">
      <p className="px-3 pb-1.5 text-[0.65rem] font-bold tracking-[0.25em] text-slate-400/60">
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
                    ? "border border-sky-400/60 bg-sky-400/15 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                    : "border border-transparent text-slate-300 hover:bg-white/5 hover:text-sky-200"
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
