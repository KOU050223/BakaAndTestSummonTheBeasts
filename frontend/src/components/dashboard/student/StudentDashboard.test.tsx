import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentDashboard } from "./StudentDashboard";

const mockUseCurrentUser = vi.fn();
const mockUseMyScores = vi.fn();
const mockUseSummon = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/lib/summon/useMyScores", () => ({
  useMyScores: () => mockUseMyScores(),
}));

vi.mock("@/lib/summon/useSummon", () => ({
  useSummon: () => mockUseSummon(),
}));

describe("StudentDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      user: {
        id: 1,
        name: "吉井明久",
        role: "student",
        school_class: { id: 6, name: "Fクラス" },
      },
    });
    mockUseMyScores.mockReturnValue({
      summary: {
        scores: [
          {
            exam_id: 1,
            exam_title: "数学 小テスト1",
            subject: "math",
            subject_label: "数学",
            score: 31,
            max_score: 100,
            scored_at: "2026-06-18T00:00:00Z",
          },
          {
            exam_id: 2,
            exam_title: "英語 小テスト1",
            subject: "english",
            subject_label: "英語",
            score: 37,
            max_score: 100,
            scored_at: "2026-06-17T00:00:00Z",
          },
        ],
        bySubject: {},
        total: 68,
        max: 200,
      },
      isLoading: false,
      isError: false,
    });
    mockUseSummon.mockReturnValue({
      summons: [
        {
          code: "math",
          label: "数学",
          hp: 116,
          attack: 19,
          defense: 8,
          speed: 4,
        },
        {
          code: "english",
          label: "英語",
          hp: 119,
          attack: 20,
          defense: 9,
          speed: 4,
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  it("生徒の概要・成績・召喚獣・主要導線を表示する", () => {
    render(<StudentDashboard />);

    expect(
      screen.getByRole("heading", { name: "吉井明久さん、おかえりなさい" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Fクラス")).toBeInTheDocument();
    expect(screen.getByText("68 / 200")).toBeInTheDocument();
    expect(screen.getByText("数学 小テスト1")).toBeInTheDocument();
    expect(screen.getByText("吉井明久の召喚獣")).toBeInTheDocument();
    expect(screen.queryByText("2 体")).not.toBeInTheDocument();
    expect(screen.queryByText("科目ごとの仲間")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /成績を確認/ }),
    ).toHaveAttribute("href", "/scores");
    expect(
      screen.getByRole("link", { name: /召喚獣を見る/ }),
    ).toHaveAttribute("href", "/summon");
    expect(
      screen.getByRole("link", { name: /答案を提出/ }),
    ).toHaveAttribute("href", "/submit");
  });
});
