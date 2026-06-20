import type { Role } from "@/lib/api/types";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};

// サイドバー上のタブのまとまり。セクション単位で見出し付きグループとして表示する。
export type NavSection = {
  // グループ見出し（例: メイン / 試召戦争）
  heading: string;
  items: NavItem[];
};

// ロール別のサイドバー構成。セクションの配列として定義することで、
// セクション数や各セクションの項目数をロールごとに自由に組める
// （Sidebar 側で件数を決め打ちで振り分ける必要がない）。
// 生徒タブは提示されたダッシュボード画像に準拠。
// URL はロール共通（フラットルート）。*Screen 側でロールごとに出し分ける（案B）。
// 未実装画面は Placeholder のまま、title だけ NAV_BY_ROLE の label に合わせる（navLabel）。
export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  student: [
    {
      heading: "メイン",
      items: [
        { label: "ダッシュボード", href: "/", icon: "⚡" },
        { label: "成績・召喚獣ステータス", href: "/scores", icon: "📊" },
        { label: "召喚獣プレビュー", href: "/summon", icon: "🐉" },
        { label: "答案を提出", href: "/submit", icon: "📨" },
      ],
    },
    {
      heading: "試召戦争",
      items: [
        { label: "宣戦布告", href: "/declare-war", icon: "⚔️" },
        { label: "戦績", href: "/records", icon: "🏆" },
      ],
    },
  ],
  teacher: [
    {
      heading: "採点管理",
      items: [
        { label: "試験作成", href: "/", icon: "📝" },
        { label: "点数管理", href: "/scores", icon: "📊" },
        { label: "AI採点", href: "/submit", icon: "📷" },
      ],
    },
    {
      heading: "クラス",
      items: [
        { label: "クラス管理", href: "/classes", icon: "🏫" },
        { label: "生徒一覧", href: "/records", icon: "👤" },
      ],
    },
  ],
  school_admin: [
    {
      heading: "システム管理",
      items: [
        { label: "管理者ダッシュボード", href: "/", icon: "🖥️" },
        { label: "ユーザー管理", href: "/admin/users", icon: "👤" },

        { label: "クラス設定", href: "/admin/classes", icon: "🏫" },
      ],
    },
    {
      heading: "参照",
      items: [
        { label: "全体成績", href: "/scores", icon: "📊" },
        { label: "試召戦争ログ", href: "/records", icon: "⚔️" },
      ],
    },
  ],
};

/** サイドバーの label を href から取得する。案B: Placeholder の title とサイドバーを一致させる単一ソース。 */
export function navLabel(role: Role, href: string): string {
  for (const section of NAV_BY_ROLE[role]) {
    const item = section.items.find((i) => i.href === href);
    if (item) return item.label;
  }
  return "準備中";
}

// ロールの日本語表記。サイドバー左下のバッジなどで使う。
export const ROLE_LABEL: Record<Role, string> = {
  student: "生徒",
  teacher: "教師",
  school_admin: "管理者",
};
