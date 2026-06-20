import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavPlaceholder } from "./NavPlaceholder";

describe("NavPlaceholder", () => {
  it("教師の / は試験作成と表示する", () => {
    render(<NavPlaceholder role="teacher" href="/" />);
    expect(screen.getByRole("heading", { name: "試験作成" })).toBeInTheDocument();
    expect(screen.getByText(/準備中/)).toBeInTheDocument();
  });

  it("生徒の /records は戦績と表示する", () => {
    render(<NavPlaceholder role="student" href="/records" />);
    expect(screen.getByRole("heading", { name: "戦績" })).toBeInTheDocument();
  });
});
