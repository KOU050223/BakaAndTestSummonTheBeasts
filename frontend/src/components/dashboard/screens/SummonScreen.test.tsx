import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SummonScreen } from "./SummonScreen";
import type { Summon } from "@/lib/summon/useSummon";
import type { ScoreSummary } from "@/lib/summon/useMyScores";

const mockUseCurrentUser = vi.fn();
const mockUseSummon = vi.fn();
const mockUseMyScores = vi.fn();

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));
vi.mock("@/lib/summon/useSummon", () => ({
  useSummon: () => mockUseSummon(),
}));
vi.mock("@/lib/summon/useMyScores", () => ({
  useMyScores: () => mockUseMyScores(),
}));
// next/image は素の img に置き換える（jsdom 用）
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const SUMMONS: Summon[] = [
  { code: "english", label: "英語", hp: 147, attack: 38, defense: 14, speed: 9 },
  { code: "math", label: "数学", hp: 144, attack: 35, defense: 13, speed: 9 },
];

function summary(partial?: Partial<ScoreSummary>): ScoreSummary {
  return {
    scores: [],
    bySubject: {
      english: { exam_id: 1, exam_title: "英語", subject: "english", subject_label: "英語", score: 94, max_score: 100, scored_at: "2026-01-01T00:00:00Z" },
    },
    total: 182,
    max: 200,
    ...partial,
  };
}

function setup({
  user = { id: 4, name: "霧島翔子", role: "student" },
  summon = { summons: SUMMONS, isLoading: false, isError: false },
  scores = { summary: summary(), isLoading: false, isError: false },
} = {}) {
  mockUseCurrentUser.mockReturnValue({ user });
  mockUseSummon.mockReturnValue(summon);
  mockUseMyScores.mockReturnValue(scores);
  return render(<SummonScreen />);
}

describe("SummonScreen", () => {
  beforeEach(() => {
    mockUseCurrentUser.mockReset();
    mockUseSummon.mockReset();
    mockUseMyScores.mockReset();
  });

  it("ローディング中は召喚中表示を出す", () => {
    setup({ summon: { summons: [], isLoading: true, isError: false } });
    expect(screen.getByText("召喚中...")).toBeInTheDocument();
  });

  it("取得失敗時はエラー文言を出す", () => {
    setup({ summon: { summons: [], isLoading: false, isError: true } });
    expect(screen.getByText("召喚獣ステータスの取得に失敗しました")).toBeInTheDocument();
  });

  it("召喚獣が無いときは空状態を出す", () => {
    setup({ summon: { summons: [], isLoading: false, isError: false } });
    expect(
      screen.getByText(/まだ召喚獣がいません/),
    ).toBeInTheDocument();
  });

  it("初期表示は先頭科目（英語）の召喚獣・教科・点数を中央に出す", () => {
    setup();
    // 召喚獣画像（先頭=英語）
    expect(screen.getByAltText("英語の召喚獣")).toBeInTheDocument();
    // 生徒名ラベル
    expect(screen.getByText("霧島翔子")).toBeInTheDocument();
    // 英語の点数（94）は中央ステージと点数一覧の両方に出る
    expect(screen.getAllByText("94").length).toBeGreaterThan(0);
    // 総合点（182）が表示される
    expect(screen.getByText("182")).toBeInTheDocument();
  });

  it("科目タブをクリックすると中央の召喚獣が切り替わる", () => {
    setup();
    // 数学タブ（aria-pressed=false のボタン）をクリック
    const mathTab = screen
      .getAllByRole("button", { name: "数学" })
      .find((b) => b.getAttribute("aria-pressed") !== null)!;
    fireEvent.click(mathTab);

    expect(screen.getByAltText("数学の召喚獣")).toBeInTheDocument();
    // 数学は bySubject に無いので点数は未受験（—）
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("点数のない科目は一覧で未受験と表示する", () => {
    setup();
    // 点数一覧（各教科の点数）の中で数学行に「未受験」がある
    const list = screen.getByRole("list");
    expect(within(list).getByText("未受験")).toBeInTheDocument();
  });
});
