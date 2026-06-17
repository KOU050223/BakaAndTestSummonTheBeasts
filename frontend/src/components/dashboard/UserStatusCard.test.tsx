import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserStatusCard } from "./UserStatusCard";
import type { User } from "@/lib/api/types";

const mockReplace = vi.fn();
const mockClear = vi.fn();

// useMutation に渡された onSettled を捕捉し、mutate 実行時に発火させることで
// ログアウト後処理（キャッシュクリア＋リダイレクト）を検証できるようにする。
let capturedOnSettled: (() => void) | undefined;
const mockMutate = vi.fn(() => capturedOnSettled?.());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mockClear }),
}));

vi.mock("@/lib/api/client", () => ({
  $api: {
    useMutation: (
      _method: string,
      _path: string,
      options?: { onSettled?: () => void },
    ) => {
      capturedOnSettled = options?.onSettled;
      return { mutate: mockMutate, isPending: false };
    },
  },
}));

const studentUser: User = {
  id: 1,
  name: "吉井明久",
  email: "yoshii@fumizuki.ac.jp",
  role: "student",
  created_at: "2026-01-01T00:00:00Z",
  school_class: null,
};

describe("UserStatusCard", () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockReplace.mockClear();
    mockClear.mockClear();
  });

  it("ユーザー名とロール日本語を表示する", () => {
    render(<UserStatusCard user={studentUser} />);

    expect(screen.getByText("吉井明久")).toBeInTheDocument();
    expect(screen.getByText("生徒")).toBeInTheDocument();
  });

  it("ログアウトボタン押下で logout mutation を呼ぶ", async () => {
    const user = userEvent.setup();
    render(<UserStatusCard user={studentUser} />);

    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    expect(mockMutate).toHaveBeenCalledOnce();
  });

  it("ログアウト後にキャッシュをクリアしてからログイン画面へ遷移する", async () => {
    const user = userEvent.setup();
    render(<UserStatusCard user={studentUser} />);

    await user.click(screen.getByRole("button", { name: "ログアウト" }));

    // 前ユーザーの /api/me などが残らないよう全キャッシュを破棄する
    expect(mockClear).toHaveBeenCalledOnce();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
