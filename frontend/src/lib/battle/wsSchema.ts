import { z } from "zod";

// WebSocket メッセージスキーマ。
// docs/ws-schema.md が正本。Go 側 game/internal/wshandler/message.go と必ず整合させる。
// zod スキーマは「型推論（TS型）」と「受信時のランタイム検証」を兼ねる。

// --- Client → Server ---

export const moveInputSchema = z.object({
  forward: z.boolean(),
  back: z.boolean(),
  left: z.boolean(),
  right: z.boolean(),
});

export const inputMessageSchema = z.object({
  type: z.literal("input"),
  move: moveInputSchema,
  attack: z.boolean(),
  summon: z.boolean(),
});

export type MoveInput = z.infer<typeof moveInputSchema>;
export type InputMessage = z.infer<typeof inputMessageSchema>;

// --- Server → Client ---

export const fieldStateSchema = z.object({
  subject: z.string(),
  centerX: z.number(),
  centerZ: z.number(),
  radius: z.number(),
});

export const summonStateSchema = z.object({
  hp: z.number(),
});

export const playerStateSchema = z.object({
  x: z.number(),
  z: z.number(),
  angle: z.number(),
  // 所属チーム（クラス）。N:N の陣営表示に使う。1:1では空文字。
  teamId: z.string().optional().default(""),
  // チームリーダーか。
  leader: z.boolean().optional().default(false),
  // 戦闘不能（HP0 で場から除外）か。true のプレイヤーは描画しない。
  defeated: z.boolean().optional().default(false),
  // 中立（どのフィールドにもいない）は null。
  currentSubject: z.string().nullable(),
  summoned: z.boolean(),
  // この tick でクールダウンを通過した攻撃入力があったか（攻撃アニメーションの再生トリガー）。
  attacking: z.boolean(),
  summons: z.record(z.string(), summonStateSchema),
});

export const stateMessageSchema = z.object({
  type: z.literal("state"),
  tick: z.number(),
  fields: z.array(fieldStateSchema),
  players: z.record(z.string(), playerStateSchema),
});

export const finishedMessageSchema = z.object({
  type: z.literal("finished"),
  // N:N の勝敗チーム（クラス）。1:1では空文字になりうる。
  winnerTeam: z.string().optional().default(""),
  loserTeam: z.string().optional().default(""),
  // 後方互換：代表プレイヤーID（1:1表示用）。
  winnerId: z.string(),
  loserId: z.string(),
});

export const serverMessageSchema = z.discriminatedUnion("type", [
  stateMessageSchema,
  finishedMessageSchema,
]);

export type FieldState = z.infer<typeof fieldStateSchema>;
export type SummonState = z.infer<typeof summonStateSchema>;
export type PlayerState = z.infer<typeof playerStateSchema>;
export type StateMessage = z.infer<typeof stateMessageSchema>;
export type FinishedMessage = z.infer<typeof finishedMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;

// 受信した生文字列（WebSocket の MessageEvent.data）を検証してパースする。
// 不正な JSON・未知の type・必須フィールド欠損はいずれも例外を投げる。
export function parseServerMessage(raw: string): ServerMessage {
  const json: unknown = JSON.parse(raw);
  return serverMessageSchema.parse(json);
}

// 送信用 input メッセージを組み立てる。未指定の押下・トリガーは false 既定。
export function buildInputMessage(
  partial?: Partial<Omit<InputMessage, "type" | "move">> & {
    move?: Partial<MoveInput>;
  },
): InputMessage {
  return {
    type: "input",
    move: {
      forward: partial?.move?.forward ?? false,
      back: partial?.move?.back ?? false,
      left: partial?.move?.left ?? false,
      right: partial?.move?.right ?? false,
    },
    attack: partial?.attack ?? false,
    summon: partial?.summon ?? false,
  };
}
