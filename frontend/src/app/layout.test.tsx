import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata } from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

describe("RootLayout", () => {
  it("日本語の字形が選ばれるよう文書言語を日本語にする", () => {
    const layout = RootLayout({ children: <main>本文</main> });

    expect(layout.props.lang).toBe("ja");
  });

  it("正式なサイトタイトルと説明を公開する", () => {
    expect(metadata).toMatchObject({
      title: {
        default: "試験召喚システム",
        template: "%s | 試験召喚システム",
      },
      description:
        "試験の成績から召喚獣を育て、クラス対抗の試召戦争を楽しみながら学べる教育支援プラットフォーム。",
      applicationName: "試験召喚システム",
    });
  });

  it("サイトURLとcanonical URLを公開する", () => {
    expect(metadata.metadataBase?.toString()).toBe("https://bakatest.uomi.site/");
    expect(metadata.alternates).toMatchObject({ canonical: "/" });
  });

  it("SNS共有用の日本語メタデータを公開する", () => {
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      locale: "ja_JP",
      siteName: "試験召喚システム",
      url: "/",
      title: "試験召喚システム",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: "試験召喚システム",
    });
  });

  it("サイトアイコンとWebアプリマニフェストを公開する", () => {
    expect(metadata.icons).toMatchObject({
      icon: [
        { url: "/site-icon.ico", sizes: "any" },
        { url: "/site-icon.svg", type: "image/svg+xml" },
      ],
    });
    expect(metadata.manifest).toBe("/manifest.webmanifest");
  });
});
