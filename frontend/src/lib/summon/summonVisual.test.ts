import { describe, expect, it } from "vitest";
import { summonImage } from "./summonVisual";

describe("summonImage", () => {
  it("未登録の科目はデフォルトの立ち絵にフォールバックする", () => {
    expect(summonImage("math")).toBe("/baka_kirei.png");
    expect(summonImage("unknown")).toBe("/baka_kirei.png");
  });
});
