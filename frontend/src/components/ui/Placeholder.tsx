import { Panel } from "./Panel";
import { LabelTag } from "./LabelTag";

type PlaceholderProps = {
  title: string;
  description?: string;
};

// 各タブの中身がまだ無い画面、および教師・管理者ダッシュボードの仮表示に使う汎用コンポーネント。
export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <Panel className="mx-auto mt-10 max-w-xl">
      <div className="flex items-center gap-3 border-b border-sky-400/40 bg-gradient-to-r from-sky-400/20 to-sky-400/5 px-5 py-4">
        <LabelTag variant="info">準備中</LabelTag>
        <h1 className="text-xl font-black tracking-wide text-white [text-shadow:0_0_10px_rgba(56,189,248,0.7)]">
          {title}
        </h1>
      </div>
      <div className="px-6 py-10 text-center">
        <p className="text-4xl">🛠️</p>
        <p className="mt-4 text-sm text-slate-300">
          {description ?? "この画面は現在準備中です。召喚獣たちが鋭意制作しています。"}
        </p>
      </div>
    </Panel>
  );
}
