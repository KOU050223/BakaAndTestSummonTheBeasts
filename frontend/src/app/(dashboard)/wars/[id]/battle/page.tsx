import { BattleScene } from "@/components/battle/BattleScene";

// 試召戦争のバトル画面。
// フェーズ1 では 3D シーン（VRM 召喚獣2体）の表示確認のみ。
// フェーズ2 以降で BattleScreen（HUD・WebSocket 接続）へ差し替える。
export default function BattlePage() {
  return (
    <div className="h-[calc(100vh-8rem)] w-full overflow-hidden rounded-xl bg-slate-900">
      <BattleScene />
    </div>
  );
}
