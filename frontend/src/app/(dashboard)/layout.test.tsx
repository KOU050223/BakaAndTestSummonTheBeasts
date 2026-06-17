import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";
import type { User } from "@/lib/api/types";

const mockUseCurrentUser = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
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
  });

  it("ローディング中は召喚中表示を出す", () => {
    mockUseCurrentUser.mockReturnValue({ user: undefined, isLoading: true, isError: false });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByText("召喚中...")).toBeInTheDocument();
  });

  // 401（未認証）の /login リダイレクトは client.ts の onResponse middleware が
  // status を見て担う。layout は isError 全般を /login に飛ばすと 5xx や通信エラーも
  // ログイン送りになるため、エラー時はシェルを出さずエラー表示に留める。
  it("取得エラー時はシェルを描画せずエラーメッセージを表示する", () => {
    mockUseCurrentUser.mockReturnValue({ user: undefined, isLoading: false, isError: true });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByText(/取得に失敗しました/)).toBeInTheDocument();
    expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
  });

  it("認証済みならシェルと子を描画する", () => {
    mockUseCurrentUser.mockReturnValue({ user: studentUser, isLoading: false, isError: false });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByTestId("shell")).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });
});
