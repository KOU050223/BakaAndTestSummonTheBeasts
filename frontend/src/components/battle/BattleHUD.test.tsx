import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BattleHUD } from "./BattleHUD";
import type { PlayerState } from "@/lib/battle/wsSchema";

const self: PlayerState = {
  x: 0,
  z: 0,
  angle: 0,
  currentSubject: "math",
  summoned: false,
  summons: { math: { hp: 142 }, english: { hp: 100 } },
};

function setup(overrides: Partial<React.ComponentProps<typeof BattleHUD>> = {}) {
  const props = {
    self,
    onMoveChange: vi.fn(),
    onAttack: vi.fn(),
    onSummon: vi.fn(),
    ...overrides,
  };
  render(<BattleHUD {...props} />);
  return props;
}

describe("BattleHUD", () => {
  it("科目別 HP を日本語ラベルで表示する", () => {
    setup();

    expect(screen.getByText(/数学/)).toBeInTheDocument();
    expect(screen.getByText(/142/)).toBeInTheDocument();
    expect(screen.getByText(/英語/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("攻撃ボタンで onAttack を呼ぶ", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: "攻撃" }));

    expect(props.onAttack).toHaveBeenCalledOnce();
  });

  it("サモンボタンで onSummon を呼ぶ", async () => {
    const props = setup();

    await userEvent.click(screen.getByRole("button", { name: "サモン" }));

    expect(props.onSummon).toHaveBeenCalledOnce();
  });

  it("移動ボタンの押下/離しで onMoveChange に方向と真偽を渡す", () => {
    const props = setup();
    const up = screen.getByRole("button", { name: "前" });

    fireEvent.pointerDown(up); // 押下
    expect(props.onMoveChange).toHaveBeenCalledWith("forward", true);

    props.onMoveChange.mockClear();
    fireEvent.pointerUp(up); // 離し
    expect(props.onMoveChange).toHaveBeenCalledWith("forward", false);
  });

  it("currentSubject が null（中立）のときフィールド外の注意を表示する", () => {
    setup({ self: { ...self, currentSubject: null } });

    expect(screen.getByText(/フィールド外/)).toBeInTheDocument();
  });
});
