import { describe, expect, it } from "vitest";
import {
  dashboardThemeForUser,
  dashboardThemeFromClassName,
} from "./dashboardTheme";

describe("dashboardThemeFromClassName", () => {
  it.each([
    ["Aクラス", "a"],
    ["B", "b"],
    ["  c class  ", "c"],
    ["Fクラス", "f"],
  ])("%s をテーマ %s に変換する", (className, expected) => {
    expect(dashboardThemeFromClassName(className)).toBe(expected);
  });

  it.each([null, undefined, "", "特進科"])(
    "%s は初期テーマのFクラスへフォールバックする",
    (className) => {
      expect(dashboardThemeFromClassName(className)).toBe("f");
    },
  );
});

describe("dashboardThemeForUser", () => {
  it("管理者には所属クラスと独立した専用テーマを返す", () => {
    expect(dashboardThemeForUser("school_admin", null)).toBe("admin");
  });

  it("教師には暫定的に管理者と同じテーマを返す", () => {
    expect(dashboardThemeForUser("teacher", null)).toBe("admin");
  });

  it("生徒には所属クラスのテーマを返す", () => {
    expect(dashboardThemeForUser("student", "Bクラス")).toBe("b");
  });
});
