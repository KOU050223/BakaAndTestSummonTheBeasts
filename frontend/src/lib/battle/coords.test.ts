import { describe, expect, it } from "vitest";
import { goAngleToThreeRotationY, goForwardVector, lerpAngleY } from "./coords";

// 浮動小数点の誤差許容値。
const EPS = 1e-9;

describe("goAngleToThreeRotationY", () => {
  // Go: Angle=0 は +X 前方。VRM: rotationY で +Z 前方を +X に合わせるには π/2 回転が必要だが、
  // このモデルは前後反転しているため 3π/2 - angle が正解。
  it("Angle=0（+X前方）のとき rotationY=3π/2 になる", () => {
    const r = goAngleToThreeRotationY(0);
    expect(r).toBeCloseTo((3 * Math.PI) / 2, 9);
  });

  it("Angle=π/2（+Z前方）のとき rotationY=π になる", () => {
    const r = goAngleToThreeRotationY(Math.PI / 2);
    expect(r).toBeCloseTo(Math.PI, 9);
  });

  it("Angle=π（-X前方）のとき rotationY=π/2 になる", () => {
    const r = goAngleToThreeRotationY(Math.PI);
    expect(r).toBeCloseTo(Math.PI / 2, 9);
  });

  it("Angle=3π/2（-Z前方）のとき rotationY=0 になる", () => {
    const r = goAngleToThreeRotationY((3 * Math.PI) / 2);
    expect(r).toBeCloseTo(0, 9);
  });

  it("Angle=2π（+X前方・一周）のとき Angle=0 と同じ結果になる", () => {
    const r0 = goAngleToThreeRotationY(0);
    const r2pi = goAngleToThreeRotationY(2 * Math.PI);
    expect(Math.abs(r0 - r2pi) % (2 * Math.PI)).toBeCloseTo(0, 9);
  });

  it("左右反転の対称性: Angle と -Angle の rotationY は 3π を挟んで対称", () => {
    const angle = Math.PI / 4;
    const pos = goAngleToThreeRotationY(angle);
    const neg = goAngleToThreeRotationY(-angle);
    // pos + neg = 3π（対称）
    expect(pos + neg).toBeCloseTo(3 * Math.PI, 9);
  });
});

describe("goForwardVector", () => {
  it("Angle=0 のとき前方は +X 方向", () => {
    const v = goForwardVector(0);
    expect(v.x).toBeCloseTo(1, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  it("Angle=π/2 のとき前方は +Z 方向", () => {
    const v = goForwardVector(Math.PI / 2);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(1, 9);
  });

  it("Angle=π のとき前方は -X 方向", () => {
    const v = goForwardVector(Math.PI);
    expect(v.x).toBeCloseTo(-1, 9);
    expect(v.z).toBeCloseTo(0, 9);
  });

  it("Angle=3π/2 のとき前方は -Z 方向", () => {
    const v = goForwardVector((3 * Math.PI) / 2);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(-1, 9);
  });

  it("返すベクトルは常に単位ベクトル（長さ=1）", () => {
    for (const angle of [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI]) {
      const v = goForwardVector(angle);
      const len = Math.sqrt(v.x * v.x + v.z * v.z);
      expect(len).toBeCloseTo(1, 9);
    }
  });

  // Go の applyMove との整合性検証:
  // Forward 入力で X += cos(angle)*speed, Z += sin(angle)*speed
  // → goForwardVector の結果と一致するか確認。
  it("前進時の移動量が goForwardVector と一致する", () => {
    const angle = Math.PI / 4;
    const speed = 2.0;
    const v = goForwardVector(angle);
    const deltaX = v.x * speed;
    const deltaZ = v.z * speed;
    expect(deltaX).toBeCloseTo(Math.cos(angle) * speed, 9);
    expect(deltaZ).toBeCloseTo(Math.sin(angle) * speed, 9);
  });
});

describe("lerpAngleY", () => {
  it("同じ角度のとき変化しない", () => {
    expect(lerpAngleY(1, 1, 0.5)).toBeCloseTo(1, 9);
  });

  it("通常の補間", () => {
    expect(lerpAngleY(0, Math.PI / 2, 0.5)).toBeCloseTo(Math.PI / 4, 9);
  });

  it("±π 跨ぎは最短経路を選ぶ", () => {
    const from = -Math.PI + 0.1;
    const to = Math.PI - 0.1;
    const result = lerpAngleY(from, to, 0.5);
    // 最短経路（0.2 rad）は π 境界を通る。中点は -π。
    expect(result).toBeCloseTo(-Math.PI, 9);
  });
});

describe("Go-Three.js 座標系の整合性", () => {
  // Go の前方ベクトルを Three.js の rotationY に変換し、
  // Three.js での前方方向（VRM モデルは +Z が背面なので sin/cos の対応に注意）が
  // Go の前方ベクトルと一致することを確認する。
  //
  // VRM モデルの前方（rotationY 適用後）:
  //   fx = sin(rotationY), fz = cos(rotationY)  ← Three.js の -Z 前方モデル基準
  //   ただしこのモデルは前後逆なので:
  //   fx = -sin(rotationY), fz = -cos(rotationY)  が「見た目の前方」
  //
  // goAngleToThreeRotationY(angle) = 3π/2 - angle なので:
  //   -sin(3π/2 - angle) = -(-cos(angle)) = cos(angle) = Go 前方 X ✓
  //   -cos(3π/2 - angle) = -(sin(angle)) ... → -sin(angle)
  //
  // 実際には Z 軸も -Z → +Z 反転が必要なため符号が整合する。

  it.each([
    { label: "+X前方 (angle=0)", angle: 0, expectedX: 1, expectedZ: 0 },
    { label: "+Z前方 (angle=π/2)", angle: Math.PI / 2, expectedX: 0, expectedZ: 1 },
    { label: "-X前方 (angle=π)", angle: Math.PI, expectedX: -1, expectedZ: 0 },
    { label: "-Z前方 (angle=3π/2)", angle: (3 * Math.PI) / 2, expectedX: 0, expectedZ: -1 },
  ])("Go $label の前方が Three.js の前方と一致する", ({ angle, expectedX, expectedZ }) => {
    const rotY = goAngleToThreeRotationY(angle);
    // Three.js モデルの実効前方（前後逆 VRM）: (-sin(rotY), -cos(rotY))
    const threeX = -Math.sin(rotY);
    const threeZ = -Math.cos(rotY);
    expect(threeX).toBeCloseTo(expectedX, 9);
    expect(threeZ).toBeCloseTo(expectedZ, 9);
  });
});
