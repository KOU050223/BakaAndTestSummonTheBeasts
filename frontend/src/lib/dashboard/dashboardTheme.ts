export const DASHBOARD_THEMES = ["a", "b", "c", "d", "e", "f"] as const;

export type DashboardTheme = (typeof DASHBOARD_THEMES)[number];
export type AppDashboardTheme = DashboardTheme | "admin";

const CLASS_NAME_PATTERN =
  /(?:^|[^A-Z])([A-F])(?:\s*(?:クラス|class))?(?:$|[^A-Z])/i;

/**
 * APIが返す「F」「Fクラス」などの表記を、見た目専用のテーマIDへ変換する。
 * 未所属・未知の表記は、初期デザインであるFクラスへ安全にフォールバックする。
 */
export function dashboardThemeFromClassName(
  className?: string | null,
): DashboardTheme {
  const match = className?.trim().match(CLASS_NAME_PATTERN);

  return (match?.[1]?.toLowerCase() as DashboardTheme | undefined) ?? "f";
}

export function dashboardThemeForUser(
  role: string,
  className?: string | null,
): AppDashboardTheme {
  return role === "school_admin" || role === "teacher"
    ? "admin"
    : dashboardThemeFromClassName(className);
}
