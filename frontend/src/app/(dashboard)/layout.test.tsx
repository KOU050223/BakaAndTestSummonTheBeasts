import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";
import type { User } from "@/lib/api/types";

const mockReplace = vi.fn();
const mockUseCurrentUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  usePathname: () => "/",
}));

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
};

describe("DashboardLayout 認証ガード", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("ローディング中は召喚中表示を出す", () => {
    mockUseCurrentUser.mockReturnValue({ user: undefined, isLoading: true, isError: false });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByText("召喚中...")).toBeInTheDocument();
  });

  it("未認証（isError）なら /login へリダイレクトする", () => {
    mockUseCurrentUser.mockReturnValue({ user: undefined, isLoading: false, isError: true });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("認証済みならシェルと子を描画する", () => {
    mockUseCurrentUser.mockReturnValue({ user: studentUser, isLoading: false, isError: false });
    render(<DashboardLayout>本文</DashboardLayout>);
    expect(screen.getByTestId("shell")).toBeInTheDocument();
    expect(screen.getByText("本文")).toBeInTheDocument();
  });
});
