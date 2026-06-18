import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";
import type { User } from "@/lib/api/types";

const mockUseCurrentUser = vi.fn();
const mockReplace = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

// DashboardShell は $api 依存の子を持つためスタブ化する
vi.mock("@/components/dashboard", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  ),
}));

const studentUser: User = {
  id: 1,
  name: "吉井明久",
  email: "yoshii@fumizuki.ac.jp",
  role: "student",
  created_at: "2026-01-01T00:00:00Z",
  school_class: null,
};

describe("DashboardLayout 認証ガード", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset();
    mockReplace.mockReset();
  });

  it("ローディング中は召喚中表示を出す", () => {
    mockUseCurrentUser.mockReturnValue({
      user: undefined,
      isLoading: true,
      isError: false,
      isUnauthorized: false,
    });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByText("召喚中...")).toBeInTheDocument();
  });

  // 401（未認証）はログイン画面へ確実に遷移させる（初回アクセス時に
  // エラー画面で止まらず /login へ飛ぶことを保証する）。
  it("未認証(401)なら /login へリダイレクトしシェルもエラーも出さない", () => {
    mockUseCurrentUser.mockReturnValue({
      user: undefined,
      isLoading: false,
      isError: true,
      isUnauthorized: true,
    });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
    expect(screen.queryByText(/取得に失敗しました/)).not.toBeInTheDocument();
  });

  // 401 以外のエラー（5xx・通信断）は /login に飛ばさず、その旨を表示する。
  it("401 以外の取得エラーはリダイレクトせずエラーメッセージを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: undefined,
      isLoading: false,
      isError: true,
      isUnauthorized: false,
    });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText(/取得に失敗しました/)).toBeInTheDocument();
    expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
  });

  it("認証済みならシェルと子を描画する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: studentUser,
      isLoading: false,
      isError: false,
      isUnauthorized: false,
    });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByTestId("shell")).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });
});
