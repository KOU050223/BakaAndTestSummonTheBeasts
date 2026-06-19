import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WaitingOverlay } from "./WaitingOverlay";

describe("WaitingOverlay", () => {
  it("show=true で待機メッセージを表示する", () => {
    render(<WaitingOverlay show />);
    expect(screen.getByText(/相手の入室を待っています/)).toBeInTheDocument();
  });

  it("show=false では何も描画しない", () => {
    const { container } = render(<WaitingOverlay show={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
