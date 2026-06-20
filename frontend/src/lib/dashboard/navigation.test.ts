import { describe, expect, it } from "vitest";
import {
  NAV_BY_ROLE,
  ROLE_LABEL,
  navLabel,
  type NavSection,
} from "./navigation";

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

  it("生徒は6つのタブを持つ（メイン4 + 試召戦争2）", () => {
    const labels = flatItems(NAV_BY_ROLE.student).map((item) => item.label);
    expect(labels).toEqual([
      "ダッシュボード",
      "成績・召喚獣ステータス",
      "召喚獣プレビュー",
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

  it("管理者のクラス設定は /classes を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const classSetting = adminItems.find((item) => item.label === "クラス設定");
    expect(classSetting?.href).toBe("/classes");
  });

  it("管理者の全体成績は /scores を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const overallScores = adminItems.find((item) => item.label === "全体成績");
    expect(overallScores?.href).toBe("/scores");
  });

  it("管理者の試召戦争ログは /records を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const battleLog = adminItems.find(
      (item) => item.label === "試召戦争ログ",
    );
    expect(battleLog?.href).toBe("/records");
  });
});

describe("navLabel", () => {
  it("ロールと href からサイドバー label を返す", () => {
    expect(navLabel("teacher", "/")).toBe("試験作成");
    expect(navLabel("teacher", "/scores")).toBe("点数管理");
    expect(navLabel("teacher", "/records")).toBe("生徒一覧");
    expect(navLabel("student", "/records")).toBe("戦績");
    expect(navLabel("school_admin", "/classes")).toBe("クラス設定");
    expect(navLabel("school_admin", "/scores")).toBe("全体成績");
    expect(navLabel("school_admin", "/records")).toBe("試召戦争ログ");
  });

  it("ナビに無い href は準備中を返す", () => {
    expect(navLabel("school_admin", "/summon")).toBe("準備中");
  });
});

describe("ROLE_LABEL", () => {
  it("ロールを日本語表記にマッピングする", () => {
    expect(ROLE_LABEL.student).toBe("生徒");
    expect(ROLE_LABEL.teacher).toBe("教師");
    expect(ROLE_LABEL.school_admin).toBe("管理者");
  });
});
