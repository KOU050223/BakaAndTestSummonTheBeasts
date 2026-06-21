import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import type { User } from "@/lib/api/types";

const mockUsePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// UserStatusCard は $api に依存するためここではスタブ化する
vi.mock("./UserStatusCard", () => ({
  UserStatusCard: () => <div data-testid="user-status" />,
}));

const studentUser: User = {
  id: 1,
  name: "吉井明久",
  email: "yoshii@fumizuki.ac.jp",
  role: "student",
  created_at: "2026-01-01T00:00:00Z",
  school_class: null,
};

const schoolAdminUser: User = {
  ...studentUser,
  id: 2,
  name: "管理者",
  email: "admin@fumizuki.ac.jp",
  role: "school_admin",
};

describe("Sidebar", () => {
  it("ボタンでサイドバーを閉じるよう通知する", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<Sidebar user={studentUser} isOpen onToggle={onToggle} />);

    const button = screen.getByRole("button", { name: "ナビゲーションを閉じる" });
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("閉じている場合は再表示ボタンだけを表示する", () => {
    render(<Sidebar user={studentUser} isOpen={false} onToggle={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "ナビゲーションを開く" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("ロールに対応するタブを描画する（生徒は5タブ）", () => {
    render(<Sidebar user={studentUser} />);

    expect(screen.getByRole("link", { name: /ダッシュボード/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /成績・召喚獣ステータス/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /答案を提出/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /宣戦布告/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /戦績/ })).toBeInTheDocument();
  });

  it("現在のパスのタブを aria-current=page で強調する", () => {
    mockUsePathname.mockReturnValue("/scores");
    render(<Sidebar user={studentUser} />);

    const active = screen.getByRole("link", { name: /成績・召喚獣ステータス/ });
    expect(active).toHaveAttribute("aria-current", "page");

    const inactive = screen.getByRole("link", { name: /答案を提出/ });
    expect(inactive).not.toHaveAttribute("aria-current");
  });

  it("管理者には全体成績へのリンクを表示する", () => {
    render(<Sidebar user={schoolAdminUser} />);

    expect(screen.getByRole("link", { name: /全体成績/ })).toHaveAttribute(
      "href",
      "/scores",
    );
  });

  it("管理者には試召戦争ログへのリンクを表示する", () => {
    render(<Sidebar user={schoolAdminUser} />);

    expect(
      screen.getByRole("link", { name: /試召戦争ログ/ }),
    ).toHaveAttribute("href", "/records");
  });
});
