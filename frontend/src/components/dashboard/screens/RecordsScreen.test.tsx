import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, within } from "@testing-library/react";
import { RecordsScreen } from "./RecordsScreen";

const mockUseCurrentUser = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("../NavPlaceholder", () => ({
  NavPlaceholder: ({ role, href }: { role: string; href: string }) => {
    const titles: Record<string, string> = {
      "student:/records": "戦績",
      "teacher:/records": "生徒一覧",
      "school_admin:/records": "召喚獣戦争ログ",
    };
    return <h1>{titles[`${role}:${href}`] ?? href}</h1>;
  },
}));

describe("RecordsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生徒には戦績を表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 1, name: "霧島翔子", role: "student" },
    });
    render(<RecordsScreen />);
    expect(screen.getByRole("heading", { name: "戦績" })).toBeInTheDocument();
  });

  it("教師には生徒一覧を表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 2, name: "文月学", role: "teacher" },
    });
    render(<RecordsScreen />);

    expect(
      screen.getByRole("heading", { name: "生徒一覧" }),
    ).toBeInTheDocument();
  });

  it("管理者には召喚獣戦争ログを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 3, name: "管理者", role: "school_admin" },
    });
    render(<RecordsScreen />);
    expect(
      screen.getByRole("heading", { name: "召喚獣戦争ログ" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "仕掛け側" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "受け側" })).toBeInTheDocument();
    expect(screen.getAllByText("吉井明久").length).toBeGreaterThan(0);
    expect(screen.getAllByText("霧島翔子").length).toBeGreaterThan(0);
    expect(screen.getAllByText("数学").length).toBeGreaterThan(0);
    expect(screen.getByText("50 vs 0")).toBeInTheDocument();
    expect(screen.getByText("吉井明久 の勝利")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("table", { name: "試召戦争ログ" }),
      ).getAllByText("完了").length,
    ).toBeGreaterThan(0);
  });
});
