import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Placeholder, DEFAULT_PLACEHOLDER_DESCRIPTION } from "./Placeholder";

describe("Placeholder", () => {
  it("タイトルと準備中ラベルを描画する", () => {
    render(<Placeholder title="戦績" />);

    expect(screen.getByRole("heading", { name: "戦績" })).toBeInTheDocument();
    expect(screen.getByText("準備中")).toBeInTheDocument();
  });

  it("description を渡すとその説明文を表示する", () => {
    render(<Placeholder title="戦績" description="近日公開" />);

    expect(screen.getByText("近日公開")).toBeInTheDocument();
  });

  it("description を渡さない場合はデフォルトの説明文を表示する", () => {
    render(<Placeholder title="戦績" />);

    expect(screen.getByText(DEFAULT_PLACEHOLDER_DESCRIPTION)).toBeInTheDocument();
  });
});
