import { describe, expect, it } from "vitest";
import { NAV_BY_ROLE, ROLE_LABEL, type NavSection } from "./navigation";

// セクションをまたいで全タブを平坦化する
const flatItems = (sections: NavSection[]) =>
  sections.flatMap((section) => section.items);

describe("NAV_BY_ROLE", () => {
  it("3ロール分のタブ定義を持つ", () => {
    expect(Object.keys(NAV_BY_ROLE).sort()).toEqual([
      "school_admin",
      "student",
      "teacher",
    ]);
  });

  it("各ロールは見出し付きセクションに分かれている", () => {
    for (const sections of Object.values(NAV_BY_ROLE)) {
      expect(sections.length).toBeGreaterThan(0);
      for (const section of sections) {
        expect(section.heading).toBeTruthy();
        expect(section.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("生徒は画像どおり5つのタブを持つ", () => {
    const labels = flatItems(NAV_BY_ROLE.student).map((item) => item.label);
    expect(labels).toEqual([
      "ダッシュボード",
      "成績・召喚獣ステータス",
      "答案を提出",
      "宣戦布告",
      "戦績",
    ]);
  });

  it("各ロールの先頭タブはトップ（/）を指す", () => {
    // 先頭ラベルはロールごとに異なる（生徒=ダッシュボード, 教師=試験作成 等）が、
    // どのロールでも先頭タブは / を指す（ログイン直後の着地点）。
    for (const sections of Object.values(NAV_BY_ROLE)) {
      const first = flatItems(sections)[0];
      expect(first.href).toBe("/");
    }
  });
});

describe("ROLE_LABEL", () => {
  it("ロールを日本語表記にマッピングする", () => {
    expect(ROLE_LABEL.student).toBe("生徒");
    expect(ROLE_LABEL.teacher).toBe("教師");
    expect(ROLE_LABEL.school_admin).toBe("管理者");
  });
});
