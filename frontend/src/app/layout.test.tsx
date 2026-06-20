import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("RootLayout", () => {
  it("日本語の字形が選ばれるよう文書言語を日本語にする", () => {
    const layout = RootLayout({ children: <main>本文</main> });

    expect(layout.props.lang).toBe("ja");
  });
});
