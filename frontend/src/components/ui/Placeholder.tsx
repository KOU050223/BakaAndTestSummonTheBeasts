import { Panel } from "./Panel";
import { LabelTag } from "./LabelTag";

type PlaceholderProps = {
  title: string;
  description?: string;
};

// description 未指定時のデフォルト文言（テストからも参照する）
export const DEFAULT_PLACEHOLDER_DESCRIPTION =
  "この画面は現在準備中です。召喚獣たちが鋭意制作しています。";

// 各タブの中身がまだ無い画面、および教師・管理者ダッシュボードの仮表示に使う汎用コンポーネント。
export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <Panel className="authority-panel-content mx-auto mt-10 max-w-xl">
      <div className="authority-panel-header flex items-center gap-3 border-b px-5 py-4">
        <LabelTag variant="info">準備中</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-[var(--dashboard-text)]">
          {title}
        </h1>
      </div>
      <div className="px-6 py-10 text-center">
        <p className="text-4xl">🛠️</p>
        <p className="mt-4 text-sm text-[var(--dashboard-muted)]">
          {description ?? DEFAULT_PLACEHOLDER_DESCRIPTION}
        </p>
      </div>
    </Panel>
  );
}
