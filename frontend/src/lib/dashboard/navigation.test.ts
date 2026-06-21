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

  it("生徒は7つのタブを持つ（メイン4 + 試召戦争3）", () => {
    const labels = flatItems(NAV_BY_ROLE.student).map((item) => item.label);
    expect(labels).toEqual([
      "ダッシュボード",
      "成績・召喚獣ステータス",
      "召喚獣プレビュー",
      "答案を提出",
      "宣戦布告",
      "バトル",
      "戦績",
    ]);
  });

  it("各ロールの先頭タブはログイン直後の着地点を指す", () => {
    expect(flatItems(NAV_BY_ROLE.student)[0].href).toBe("/");
    expect(flatItems(NAV_BY_ROLE.teacher)[0].href).toBe("/dashboard");
    expect(flatItems(NAV_BY_ROLE.school_admin)[0].href).toBe("/");
  });

  it("管理者のクラス設定は /classes を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const classSetting = adminItems.find((item) => item.label === "クラス設定");
    expect(classSetting?.href).toBe("/classes");
  });

  it("教師の先頭タブは教師ダッシュボード", () => {
    const labels = flatItems(NAV_BY_ROLE.teacher).map((item) => item.label);
    expect(labels[0]).toBe("教師ダッシュボード");
  });

  it("教師ダッシュボードは /dashboard を指す", () => {
    const teacherItems = flatItems(NAV_BY_ROLE.teacher);
    const dashboard = teacherItems.find((item) => item.label === "教師ダッシュボード");
    expect(dashboard?.href).toBe("/dashboard");
  });

  it("管理者の全体成績は /scores を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const overallScores = adminItems.find((item) => item.label === "全体成績");
    expect(overallScores?.href).toBe("/scores");
  });

  it("管理者の試召戦争ログは /records を指す", () => {
    const adminItems = flatItems(NAV_BY_ROLE.school_admin);
    const battleLog = adminItems.find((item) => item.label === "試召戦争ログ");
    expect(battleLog?.href).toBe("/records");
  });
});

describe("navLabel", () => {
  it("ロールと href からサイドバー label を返す", () => {
    expect(navLabel("teacher", "/exams")).toBe("試験作成");
    expect(navLabel("teacher", "/dashboard")).toBe("教師ダッシュボード");
    expect(navLabel("teacher", "/scores")).toBe("点数管理");
    expect(navLabel("teacher", "/records")).toBe("試召戦争ログ");
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
