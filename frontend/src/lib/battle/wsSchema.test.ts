import { describe, expect, it } from "vitest";
import {
  buildInputMessage,
  parseServerMessage,
  type InputMessage,
  type StateMessage,
} from "./wsSchema";

describe("wsSchema", () => {
  describe("parseServerMessage", () => {
    it("state メッセージをパースして型付きで返す", () => {
      const raw = {
        type: "state",
        tick: 120,
        fields: [{ subject: "math", centerX: 5.0, centerZ: 0.0, radius: 3.0 }],
        players: {
          "38": {
            x: -1.2,
            z: 0.3,
            angle: 1.57,
            currentSubject: "math",
            summoned: true,
            summons: { math: { hp: 142 }, english: { hp: 100 } },
          },
        },
      };

      const msg = parseServerMessage(JSON.stringify(raw));

      expect(msg.type).toBe("state");
      const state = msg as StateMessage;
      expect(state.tick).toBe(120);
      expect(state.fields[0].subject).toBe("math");
      expect(state.players["38"].summons.math.hp).toBe(142);
      expect(state.players["38"].currentSubject).toBe("math");
    });

    it("currentSubject が null の中立プレイヤーを受け入れる", () => {
      const raw = {
        type: "state",
        tick: 1,
        fields: [],
        players: {
          "38": { x: 0, z: 0, angle: 0, currentSubject: null, summoned: false, summons: {} },
        },
      };

      const msg = parseServerMessage(JSON.stringify(raw)) as StateMessage;

      expect(msg.players["38"].currentSubject).toBeNull();
    });

    it("finished メッセージをパースする", () => {
      const raw = { type: "finished", winnerId: "38", loserId: "39" };

      const msg = parseServerMessage(JSON.stringify(raw));

      expect(msg.type).toBe("finished");
      if (msg.type === "finished") {
        expect(msg.winnerId).toBe("38");
        expect(msg.loserId).toBe("39");
      }
    });

    it("未知の type は例外を投げる", () => {
      expect(() => parseServerMessage(JSON.stringify({ type: "unknown" }))).toThrow();
    });

    it("不正な JSON は例外を投げる", () => {
      expect(() => parseServerMessage("not json")).toThrow();
    });

    it("state の必須フィールド欠損は例外を投げる", () => {
      const raw = { type: "state", tick: 1, fields: [] }; // players 欠損
      expect(() => parseServerMessage(JSON.stringify(raw))).toThrow();
    });
  });

  describe("buildInputMessage", () => {
    it("既定値はすべて false の input メッセージ", () => {
      const msg = buildInputMessage();

      const expected: InputMessage = {
        type: "input",
        move: { forward: false, back: false, left: false, right: false },
        attack: false,
        summon: false,
      };
      expect(msg).toEqual(expected);
    });

    it("指定した押下・トリガーを反映する", () => {
      const msg = buildInputMessage({
        move: { forward: true, back: false, left: false, right: true },
        attack: true,
      });

      expect(msg.move.forward).toBe(true);
      expect(msg.move.right).toBe(true);
      expect(msg.move.back).toBe(false);
      expect(msg.attack).toBe(true);
      expect(msg.summon).toBe(false);
    });
  });
});
