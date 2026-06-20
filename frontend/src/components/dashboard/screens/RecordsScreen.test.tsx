import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
      "school_admin:/records": "試召戦争ログ",
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

  it("管理者には試召戦争ログを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 3, name: "管理者", role: "school_admin" },
    });
    render(<RecordsScreen />);
    expect(
      screen.getByRole("heading", { name: "試召戦争ログ" }),
    ).toBeInTheDocument();
  });
});
