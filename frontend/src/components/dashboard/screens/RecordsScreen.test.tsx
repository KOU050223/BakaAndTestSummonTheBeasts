import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, within } from "@testing-library/react";
import { RecordsScreen } from "./RecordsScreen";

const mockUseCurrentUser = vi.fn();
const mockUseBattles = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/lib/battle/useBattles", () => ({
  useBattles: () => mockUseBattles(),
}));

vi.mock("../NavPlaceholder", () => ({
  NavPlaceholder: ({ role, href }: { role: string; href: string }) => {
    const titles: Record<string, string> = {
      "student:/records": "戦績",
      "teacher:/records": "試召戦争ログ",
      "school_admin:/records": "試召戦争ログ",
    };
    return <h1>{titles[`${role}:${href}`] ?? href}</h1>;
  },
}));

describe("RecordsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBattles.mockReturnValue({
      battles: [
        {
          battleId: "42",
          subjects: ["math"],
          status: "finished",
          participantsLabel: "2年Aクラス vs 2年Bクラス",
          winnerName: null,
          winnerTeamName: "2年Aクラス",
          turnCount: 6,
          createdAt: "2026-06-21T06:00:00+09:00",
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  it("生徒には戦績を表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 1, name: "霧島翔子", role: "student" },
    });
    render(<RecordsScreen />);
    expect(screen.getByRole("heading", { name: "戦績" })).toBeInTheDocument();
    expect(screen.getByText("2年Aクラス vs 2年Bクラス")).toBeInTheDocument();
  });

  it("検索欄の入力文字とプレースホルダーを黒で表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 1, name: "霧島翔子", role: "student" },
    });
    render(<RecordsScreen />);

    expect(
      screen.getByRole("searchbox", { name: "ユーザー名または科目で検索" }),
    ).toHaveClass("text-black", "placeholder:text-black");
  });

  it("状態フィルターの文字を黒で表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 1, name: "霧島翔子", role: "student" },
    });
    render(<RecordsScreen />);

    for (const name of ["すべて", "進行中", "承認待ち", "完了"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("text-black");
    }
  });

  it("教師には試召戦争ログを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 2, name: "文月学", role: "teacher" },
    });
    render(<RecordsScreen />);

    expect(screen.getByRole("heading", { name: "試召戦争ログ" })).toBeInTheDocument();
    expect(screen.getByText("2年Aクラス の勝利")).toBeInTheDocument();
  });

  it("管理者には試召戦争ログを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 3, name: "管理者", role: "school_admin" },
    });
    render(<RecordsScreen />);
    expect(
      screen.getByRole("heading", { name: "試召戦争ログ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "対戦" })).toBeInTheDocument();
    expect(screen.getByText("数学")).toBeInTheDocument();
    expect(screen.getByText("6ターン")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "詳細" })).toHaveAttribute("href", "/wars/42/result");
    expect(
      within(
        screen.getByRole("table", { name: "試召戦争ログ" }),
      ).getAllByText("完了").length,
    ).toBeGreaterThan(0);
  });
});
