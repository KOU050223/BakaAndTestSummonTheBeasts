// Go サーバーの座標系と Three.js の座標系の変換ユーティリティ。
//
// Go 座標系:
//   - Angle=0 は +X 方向が前方
//   - 左回転（Left 入力）で Angle 減少、右回転（Right 入力）で Angle 増加
//   - 前進(Forward)で X += cos(Angle)*speed, Z += sin(Angle)*speed
//
// Three.js 座標系:
//   - rotationY=0 はモデルの前方が -Z 方向
//   - ただし今回使用する VRM モデルは前方が +Z のため実質 rotationY=0 で +Z が前方
//   - Y 軸正方向を上として左手系

/**
 * Go サーバーの Angle（ラジアン）を Three.js の rotationY に変換する。
 *
 * Go: Angle=0 → +X 前方
 * VRM モデル: rotationY=0 → +Z 前方（モデル固有）
 *
 * +X と +Z は π/2 ずれており、かつ Go の右回転（Angle 増加）と
 * Three.js の左手系 Y 軸回転は反対方向なので符号を反転する。
 *
 * 導出:
 *   VRM の前方ベクトルは (sin(rotationY), 0, cos(rotationY))
 *   Go の前方ベクトルは (cos(angle), 0, sin(angle))
 *   一致条件: sin(rotationY) = cos(angle), cos(rotationY) = sin(angle)
 *   → rotationY = π/2 - angle
 *
 *   ただしこの VRM は前後が逆（+Z が背面）なので π を加算:
 *   → rotationY = 3π/2 - angle
 */
export function goAngleToThreeRotationY(angle: number): number {
  return (3 * Math.PI) / 2 - angle;
}

/**
 * Go の前進方向ベクトルを返す（単位ベクトル）。
 * angle=0 のとき +X 方向。
 */
export function goForwardVector(angle: number): { x: number; z: number } {
  return { x: Math.cos(angle), z: Math.sin(angle) };
}
