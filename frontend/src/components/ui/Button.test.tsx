import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("子要素を描画する", () => {
    render(<Button>召喚</Button>);
    expect(screen.getByRole("button", { name: "召喚" })).toBeInTheDocument();
  });

  it("クリックで onClick が呼ばれる", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>送信</Button>);

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disabled のときクリックされない", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        送信
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
