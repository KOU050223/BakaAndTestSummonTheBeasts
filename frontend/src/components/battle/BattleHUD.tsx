"use client";

import type { PlayerState } from "@/lib/battle/wsSchema";
import { subjectLabel } from "@/lib/battle/subjectLabel";

type MoveDirection = "forward" | "back" | "left" | "right";

type BattleHUDProps = {
  // 自分のプレイヤー state（科目別 HP・現在フィールドなど）。
  self: PlayerState;
  // 移動ボタンの押下/離しを通知（押しっぱなし対応）。
  onMoveChange: (direction: MoveDirection, pressed: boolean) => void;
  // 攻撃トリガー。
  onAttack: () => void;
  // 召喚トリガー。
  onSummon: () => void;
};

// 移動方向ボタン。押下で pressed=true、離す/カーソルが外れたら false を通知する。
function MoveButton({
  label,
  direction,
  onMoveChange,
}: {
  label: string;
  direction: MoveDirection;
  onMoveChange: (direction: MoveDirection, pressed: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={() => onMoveChange(direction, true)}
      onPointerUp={() => onMoveChange(direction, false)}
      onPointerLeave={() => onMoveChange(direction, false)}
      className="h-12 w-12 select-none rounded-lg bg-slate-700/80 text-lg font-bold text-white active:bg-sky-500"
    >
      {label}
    </button>
  );
}

// バトルの操作 UI（HUD）。3D シーンの上に重ねて表示する。
// 左下：方向パッド（前後左右）、右下：攻撃・サモン、上部：科目別 HP。
export function BattleHUD({ self, onMoveChange, onAttack, onSummon }: BattleHUDProps) {
  const subjects = Object.entries(self.summons);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-white">
      {/* 上部：科目別 HP */}
      <div className="pointer-events-auto flex flex-wrap gap-2">
        {subjects.map(([subject, { hp }]) => {
          const active = self.currentSubject === subject;
          return (
            <div
              key={subject}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold backdrop-blur ${
                active ? "bg-sky-500/80" : "bg-slate-800/70"
              }`}
            >
              <span className="mr-2">{subjectLabel(subject)}</span>
              <span className="tabular-nums">{hp}</span>
            </div>
          );
        })}
      </div>

      {/* 中立（フィールド外）の注意 */}
      {self.currentSubject === null && (
        <div className="pointer-events-none self-center rounded-md bg-amber-600/80 px-4 py-2 text-sm font-bold">
          フィールド外：召喚・攻撃できません
        </div>
      )}

      {/* 下部：操作系 */}
      <div className="flex items-end justify-between">
        {/* 方向パッド */}
        <div className="pointer-events-auto grid grid-cols-3 gap-1">
          <span />
          <MoveButton label="前" direction="forward" onMoveChange={onMoveChange} />
          <span />
          <MoveButton label="左" direction="left" onMoveChange={onMoveChange} />
          <span />
          <MoveButton label="右" direction="right" onMoveChange={onMoveChange} />
          <span />
          <MoveButton label="後" direction="back" onMoveChange={onMoveChange} />
          <span />
        </div>

        {/* アクション */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={onSummon}
            className="h-14 w-20 rounded-full bg-indigo-500 font-bold text-white active:bg-indigo-600"
          >
            サモン
          </button>
          <button
            type="button"
            onClick={onAttack}
            className="h-16 w-20 rounded-full bg-red-500 font-bold text-white active:bg-red-600"
          >
            攻撃
          </button>
        </div>
      </div>
    </div>
  );
}
