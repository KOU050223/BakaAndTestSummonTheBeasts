import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/api/types";
import { DashboardShell } from "./DashboardShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("./UserStatusCard", () => ({
  UserStatusCard: () => <div />,
}));

const studentUser: User = {
  id: 1,
  name: "吉井明久",
  email: "yoshii@fumizuki.ac.jp",
  role: "student",
  created_at: "2026-01-01T00:00:00Z",
  school_class: null,
};

function mockMobileViewport(isMobile: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: isMobile }),
  );
}

describe("DashboardShell", () => {
  beforeEach(() => {
    mockMobileViewport(false);
  });

  it("モバイルではサイドバーとメイン画面を縦に並べる", () => {
    const { container } = render(
      <DashboardShell user={studentUser}>本文</DashboardShell>,
    );

    expect(container.firstElementChild).toHaveClass("flex-col", "sm:flex-row");
  });

  it("モバイルではナビゲーション選択後にサイドバーを閉じる", async () => {
    mockMobileViewport(true);
    const user = userEvent.setup();
    render(<DashboardShell user={studentUser}>本文</DashboardShell>);

    await user.click(screen.getByRole("link", { name: /宣戦布告/ }));

    expect(
      screen.getByRole("button", { name: "ナビゲーションを開く" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("main")).toHaveClass(
      "sm:pl-[var(--dashboard-sidebar-toggle-clearance)]",
    );
  });

  it("デスクトップではナビゲーション選択後もサイドバーを開いたままにする", async () => {
    const user = userEvent.setup();
    render(<DashboardShell user={studentUser}>本文</DashboardShell>);

    await user.click(screen.getByRole("link", { name: /宣戦布告/ }));

    expect(
      screen.getByRole("button", { name: "ナビゲーションを閉じる" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
