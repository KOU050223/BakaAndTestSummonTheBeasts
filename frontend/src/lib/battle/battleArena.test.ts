import { describe, expect, it } from "vitest";
import { ARENA_GRID_MARGIN, computeArenaBounds, computeGridHalfExtent } from "./battleArena";

describe("computeArenaBounds", () => {
  it("Rails 1科目配置 (5,0,r=3) を包含する", () => {
    const bounds = computeArenaBounds([
      { subject: "math", centerX: 5, centerZ: 0, radius: 3 },
    ]);
    expect(bounds.centerX).toBe(5);
    expect(bounds.centerZ).toBe(0);
    expect(bounds.halfExtent).toBeGreaterThanOrEqual(5);
    expect(5 + 3).toBeLessThanOrEqual(bounds.centerX + bounds.halfExtent);
    expect(5 - 3).toBeGreaterThanOrEqual(bounds.centerX - bounds.halfExtent);
  });

  it("フィールドなしは原点中心の既定サイズ", () => {
    const bounds = computeArenaBounds([]);
    expect(bounds.centerX).toBe(0);
    expect(bounds.centerZ).toBe(0);
    expect(bounds.halfExtent).toBe(8);
  });
});

describe("computeGridHalfExtent", () => {
  it("フィールド半径 + 10 が半辺長", () => {
    expect(computeGridHalfExtent(3)).toBe(3 + ARENA_GRID_MARGIN);
    expect(computeGridHalfExtent(0)).toBe(ARENA_GRID_MARGIN);
  });
});
