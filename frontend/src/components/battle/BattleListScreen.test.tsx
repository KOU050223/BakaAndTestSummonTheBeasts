import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleListScreen } from "./BattleListScreen";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

let battlesState: { battles: unknown[]; isLoading: boolean } = { battles: [], isLoading: false };
vi.mock("@/lib/battle/useBattles", () => ({
  useBattles: () => battlesState,
}));

describe("BattleListScreen", () => {
  beforeEach(() => {
    push.mockReset();
    battlesState = { battles: [], isLoading: false };
  });

  it("バトルが無ければ空メッセージを表示する", () => {
    render(<BattleListScreen />);
    expect(screen.getByText(/対戦中・待機中のバトルはありません/)).toBeInTheDocument();
  });

  it("待機中・対戦中のバトルを相手名つきで表示する", () => {
    battlesState = {
      battles: [
        { battleId: "1", subjects: ["math"], status: "waiting", opponentName: "明久" },
        { battleId: "2", subjects: ["english"], status: "active", opponentName: "雄二" },
      ],
      isLoading: false,
    };

    render(<BattleListScreen />);

    expect(screen.getByText(/明久/)).toBeInTheDocument();
    expect(screen.getByText(/雄二/)).toBeInTheDocument();
  });

  it("終了済みバトルは入室導線に出さない", () => {
    battlesState = {
      battles: [{ battleId: "9", subjects: ["math"], status: "finished", opponentName: "終わった人" }],
      isLoading: false,
    };

    render(<BattleListScreen />);

    expect(screen.queryByText(/終わった人/)).not.toBeInTheDocument();
    expect(screen.getByText(/対戦中・待機中のバトルはありません/)).toBeInTheDocument();
  });

  it("入室ボタンでバトル画面へ遷移する", async () => {
    battlesState = {
      battles: [{ battleId: "7", subjects: ["math"], status: "waiting", opponentName: "明久" }],
      isLoading: false,
    };

    render(<BattleListScreen />);
    await userEvent.click(screen.getByRole("button", { name: /入室/ }));

    expect(push).toHaveBeenCalledWith("/wars/7/battle");
  });
});
