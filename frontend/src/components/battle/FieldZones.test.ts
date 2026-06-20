import { describe, expect, it } from "vitest";
import { fieldColor } from "./FieldZones";

describe("fieldColor", () => {
  it("既知の科目に固有色を返す", () => {
    expect(fieldColor("math")).toBe("#38bdf8");
    expect(fieldColor("english")).toBe("#f59e0b");
  });

  it("未定義の科目はフォールバックのグレーを返す", () => {
    expect(fieldColor("unknown")).toBe("#94a3b8");
  });
});
