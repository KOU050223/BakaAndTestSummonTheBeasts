import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoresScreen } from "./ScoresScreen";

const mockUseCurrentUser = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("../NavPlaceholder", () => ({
  NavPlaceholder: ({ role, href }: { role: string; href: string }) => (
    <h1>{role === "teacher" ? "点数管理" : href}</h1>
  ),
}));

vi.mock("@/lib/api/grading", () => ({
  getMyScores: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));

describe("ScoresScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("生徒には成績・召喚獣ステータスを表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 1, name: "霧島翔子", role: "student" },
    });
    render(<ScoresScreen />);
    expect(
      screen.getByRole("heading", { name: "成績・召喚獣ステータス" }),
    ).toBeInTheDocument();
  });

  it("教師には NavPlaceholder（点数管理）を表示する", () => {
    mockUseCurrentUser.mockReturnValue({
      user: { id: 2, name: "文月学", role: "teacher" },
    });
    render(<ScoresScreen />);
    expect(
      screen.getByRole("heading", { name: "点数管理" }),
    ).toBeInTheDocument();
  });
});
