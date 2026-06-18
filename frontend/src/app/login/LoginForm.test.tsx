import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

// useMutation の戻り値を差し替えてエラー状態を再現する。
const mockUseMutation = vi.fn();

vi.mock("@/lib/api/client", () => ({
  $api: {
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: vi.fn() }),
}));

function setMutationError(error: unknown) {
  mockUseMutation.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error,
  });
}

describe("LoginForm のエラー表示", () => {
  beforeEach(() => {
    mockUseMutation.mockReset();
  });

  it("エラーが無ければアラートを出さない", () => {
    setMutationError(null);
    render(<LoginForm />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("401 は認証エラーの文言を出す", () => {
    setMutationError({
      error: { code: "unauthorized", message: "メールアドレスまたはパスワードが正しくありません", details: {} },
    });
    render(<LoginForm />);
    expect(screen.getByText("メールアドレスまたはパスワードが正しくありません")).toBeInTheDocument();
    expect(screen.getByText("code: unauthorized")).toBeInTheDocument();
  });

  it("ネットワークエラーは接続確認のヒントを出す（バックエンド未起動の切り分け用）", () => {
    setMutationError(new Error("Failed to fetch"));
    render(<LoginForm />);
    expect(screen.getByText("サーバーに接続できませんでした")).toBeInTheDocument();
    expect(screen.getByText(/バックエンド/)).toBeInTheDocument();
  });

  it("500 系はサーバーエラーとして DB 確認のヒントを出す", () => {
    setMutationError({
      error: { code: "internal_server_error", message: "サーバーでエラーが発生しました", details: {} },
    });
    render(<LoginForm />);
    expect(screen.getByText(/DB に接続できているか/)).toBeInTheDocument();
  });

  it("422 はフィールド別エラーを各入力欄に出す", () => {
    setMutationError({
      error: {
        code: "validation_error",
        message: "入力内容を確認してください",
        details: { email: ["は不正です"], password: ["は短すぎます"] },
      },
    });
    render(<LoginForm />);
    expect(screen.getByText(/は不正です/)).toBeInTheDocument();
    expect(screen.getByText(/は短すぎます/)).toBeInTheDocument();
  });
});
