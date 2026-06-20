import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeclareWarScreen } from "./DeclareWarScreen";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ user: { id: 1, school_class: { id: 10, name: "A" } } }),
}));

vi.mock("@/lib/battle/useOpponents", () => ({
  useOpponents: () => ({
    opponents: [
      { id: 2, name: "明久" },
      { id: 3, name: "雄二" },
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

vi.mock("@/lib/battle/useOpponentClasses", () => ({
  useOpponentClasses: () => ({
    classes: [
      { id: 10, name: "A組", grade: 2 },
      { id: 20, name: "B組", grade: 2 },
    ],
    isLoading: false,
  }),
}));

const soloMutate = vi.fn();
const classMutate = vi.fn();
let soloState = { mutate: soloMutate, isPending: false, error: null as unknown };
let classState = { mutate: classMutate, isPending: false, error: null as unknown };
vi.mock("@/lib/api/client", () => ({
  $api: {
    // path で個人戦/クラス戦のモックを出し分ける。
    useMutation: (_method: string, path: string) =>
      path === "/api/battles/declare_war" ? classState : soloState,
  },
}));

describe("DeclareWarScreen", () => {
  beforeEach(() => {
    push.mockReset();
    soloMutate.mockReset();
    classMutate.mockReset();
    soloState = { mutate: soloMutate, isPending: false, error: null };
    classState = { mutate: classMutate, isPending: false, error: null };
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

    expect(soloMutate).toHaveBeenCalledWith(
      { body: { opponentId: "2", subjects: ["math"] } },
      expect.anything(),
    );
  });

  it("作成成功でバトル画面へ遷移する", async () => {
    soloMutate.mockImplementation((_body, opts) => opts.onSuccess({ battleId: "55" }));
    render(<DeclareWarScreen />);

    await userEvent.click(screen.getByRole("button", { name: /明久/ }));
    await userEvent.click(screen.getByRole("button", { name: "数学" }));
    await userEvent.click(screen.getByRole("button", { name: /宣戦布告/ }));

    expect(push).toHaveBeenCalledWith("/wars/55/battle");
  });

  it("クラス戦モードで相手クラスを選ぶと declare_war に defenderClassId/subjects を送る", async () => {
    classMutate.mockImplementation((_body, opts) => opts.onSuccess({ battleId: "77" }));
    render(<DeclareWarScreen />);

    // クラス戦モードへ切り替える（自クラス id=10 は候補から除外される）。
    await userEvent.click(screen.getByRole("button", { name: /クラス戦/ }));
    await userEvent.click(screen.getByRole("button", { name: /B組/ }));
    await userEvent.click(screen.getByRole("button", { name: "数学" }));
    await userEvent.click(screen.getByRole("button", { name: /宣戦布告/ }));

    expect(classMutate).toHaveBeenCalledWith(
      { body: { defenderClassId: "20", subjects: ["math"] } },
      expect.anything(),
    );
    expect(push).toHaveBeenCalledWith("/wars/77/battle");
  });

  it("クラス戦では自分の所属クラスは相手候補に出ない", async () => {
    render(<DeclareWarScreen />);
    await userEvent.click(screen.getByRole("button", { name: /クラス戦/ }));

    // 自クラス(id=10, A組)は除外、B組のみ表示。
    expect(screen.queryByRole("button", { name: /A組/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /B組/ })).toBeInTheDocument();
  });
});
