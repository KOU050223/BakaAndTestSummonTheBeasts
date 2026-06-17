import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("Sidebar", () => {
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
});
