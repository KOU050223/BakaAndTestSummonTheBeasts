"use client";

type WaitingOverlayProps = {
  // 相手未入室・接続待ちの間 true。
  show: boolean;
};

// 相手の入室を待つ間、3D シーンの上に重ねる全面オーバーレイ。
export function WaitingOverlay({ show }: WaitingOverlayProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-slate-950/70 text-white backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-sky-400" />
      <p className="text-lg font-bold">相手の入室を待っています…</p>
    </div>
  );
}
