import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleResultScreen } from "./BattleResultScreen";

describe("BattleResultScreen", () => {
  it("勝者には WIN を表示する", () => {
    render(<BattleResultScreen outcome="win" onBack={vi.fn()} />);
    expect(screen.getByText(/WIN/i)).toBeInTheDocument();
  });

  it("敗者には LOSE を表示する", () => {
    render(<BattleResultScreen outcome="lose" onBack={vi.fn()} />);
    expect(screen.getByText(/LOSE/i)).toBeInTheDocument();
  });

  it("ターン数（tick）を表示する", () => {
    render(<BattleResultScreen outcome="win" finalTick={300} onBack={vi.fn()} />);
    expect(screen.getByText(/300/)).toBeInTheDocument();
  });

  it("戻るボタンで onBack を呼ぶ", async () => {
    const onBack = vi.fn();
    render(<BattleResultScreen outcome="win" onBack={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: /戻る/ }));

    expect(onBack).toHaveBeenCalledOnce();
  });
});
