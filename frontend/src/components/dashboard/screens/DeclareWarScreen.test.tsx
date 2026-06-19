import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeclareWarScreen } from "./DeclareWarScreen";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: 1, school_class: { id: 10, name: "A" } } }),
}));

vi.mock("@/lib/battle/useClassmates", () => ({
  useClassmates: () => ({
    classmates: [
      { id: 2, name: "明久", grade: 1, totalScore: 0, topSubject: { name: "数学", score: 0 } },
      { id: 3, name: "雄二", grade: 1, totalScore: 0, topSubject: { name: "英語", score: 0 } },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/lib/summon/useSummon", () => ({
  useSummon: () => ({
    summons: [
      { code: "math", label: "数学", hp: 100, attack: 10, defense: 5, speed: 8 },
      { code: "english", label: "英語", hp: 90, attack: 9, defense: 6, speed: 7 },
    ],
    isLoading: false,
  }),
}));

const mutate = vi.fn();
let mutationState = { mutate, isPending: false, error: null as unknown };
vi.mock("@/lib/api/client", () => ({
  $api: { useMutation: () => mutationState },
}));

describe("DeclareWarScreen", () => {
  beforeEach(() => {
    push.mockReset();
    mutate.mockReset();
    mutationState = { mutate, isPending: false, error: null };
  });

  it("相手候補と科目を表示する", () => {
    render(<DeclareWarScreen />);

    expect(screen.getByRole("button", { name: /明久/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /雄二/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "数学" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "英語" })).toBeInTheDocument();
  });

  it("相手未選択・科目未選択では宣戦布告できない", () => {
    render(<DeclareWarScreen />);

    expect(screen.getByRole("button", { name: /宣戦布告/ })).toBeDisabled();
  });

  it("相手と科目を選ぶと宣戦布告でき、opponentId/subjects を送る", async () => {
    render(<DeclareWarScreen />);

    await userEvent.click(screen.getByRole("button", { name: /明久/ }));
    await userEvent.click(screen.getByRole("button", { name: "数学" }));

    const submit = screen.getByRole("button", { name: /宣戦布告/ });
    expect(submit).toBeEnabled();

    await userEvent.click(submit);

    expect(mutate).toHaveBeenCalledWith(
      { body: { opponentId: "2", subjects: ["math"] } },
      expect.anything(),
    );
  });

  it("作成成功でバトル画面へ遷移する", async () => {
    mutate.mockImplementation((_body, opts) => opts.onSuccess({ battleId: "55" }));
    render(<DeclareWarScreen />);

    await userEvent.click(screen.getByRole("button", { name: /明久/ }));
    await userEvent.click(screen.getByRole("button", { name: "数学" }));
    await userEvent.click(screen.getByRole("button", { name: /宣戦布告/ }));

    expect(push).toHaveBeenCalledWith("/wars/55/battle");
  });
});
