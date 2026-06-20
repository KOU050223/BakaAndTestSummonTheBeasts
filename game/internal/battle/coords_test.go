package battle

import (
	"math"
	"testing"
)

const eps = 1e-9

// almostEqual は誤差 eps 以内なら等しいとみなす。
func almostEqual(a, b float64) bool {
	return math.Abs(a-b) < eps
}

// newMoveRoom は原点・指定角度のプレイヤー1人と広大な math フィールドを持つ Room を作る。
func newMoveRoom(angle float64) *Room {
	fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 1000}}
	p := NewPlayer("P", "テスト", 0, 0, map[string]*Summon{
		"math": {Subject: "math", HP: 100, MaxHP: 100, Attack: 10, Defense: 0, Speed: 0},
	})
	p.Angle = angle
	return NewRoom("test", fields, map[string]*Player{"P": p}, DefaultConfig())
}

// TestMoveDirections は前後左右入力それぞれについて、
// Go の座標系（Angle=0 で +X 前方）通りに位置が変化することを検証する。
func TestMoveDirections(t *testing.T) {
	cfg := DefaultConfig()
	speed := cfg.MoveBase // 速度0の召喚獣なので基礎速度のみ

	t.Run("Angle=0（+X前方）で前進するとXが増加しZは変化しない", func(t *testing.T) {
		r := newMoveRoom(0)
		r.Step(map[string]Input{"P": {Forward: true}})
		p := r.Players["P"]
		if !almostEqual(p.X, speed) {
			t.Errorf("X=%v want %v", p.X, speed)
		}
		if !almostEqual(p.Z, 0) {
			t.Errorf("Z=%v want 0", p.Z)
		}
	})

	t.Run("Angle=0（+X前方）で後退するとXが減少しZは変化しない", func(t *testing.T) {
		r := newMoveRoom(0)
		r.Step(map[string]Input{"P": {Back: true}})
		p := r.Players["P"]
		if !almostEqual(p.X, -speed) {
			t.Errorf("X=%v want %v", p.X, -speed)
		}
		if !almostEqual(p.Z, 0) {
			t.Errorf("Z=%v want 0", p.Z)
		}
	})

	t.Run("Angle=π/2（+Z前方）で前進するとZが増加しXは変化しない", func(t *testing.T) {
		r := newMoveRoom(math.Pi / 2)
		r.Step(map[string]Input{"P": {Forward: true}})
		p := r.Players["P"]
		if !almostEqual(p.X, 0) {
			t.Errorf("X=%v want 0", p.X)
		}
		if !almostEqual(p.Z, speed) {
			t.Errorf("Z=%v want %v", p.Z, speed)
		}
	})

	t.Run("Angle=π（-X前方）で前進するとXが減少しZは変化しない", func(t *testing.T) {
		r := newMoveRoom(math.Pi)
		r.Step(map[string]Input{"P": {Forward: true}})
		p := r.Players["P"]
		if !almostEqual(p.X, -speed) {
			t.Errorf("X=%v want %v", p.X, -speed)
		}
		if !almostEqual(p.Z, 0) {
			t.Errorf("Z=%v want 0", p.Z)
		}
	})

	t.Run("Angle=3π/2（-Z前方）で前進するとZが減少しXは変化しない", func(t *testing.T) {
		r := newMoveRoom(3 * math.Pi / 2)
		r.Step(map[string]Input{"P": {Forward: true}})
		p := r.Players["P"]
		if !almostEqual(p.X, 0) {
			t.Errorf("X=%v want 0", p.X)
		}
		if !almostEqual(p.Z, -speed) {
			t.Errorf("Z=%v want %v", p.Z, -speed)
		}
	})

	t.Run("前進と後退は逆方向に同量移動する", func(t *testing.T) {
		angle := math.Pi / 3
		rFwd := newMoveRoom(angle)
		rBwd := newMoveRoom(angle)
		rFwd.Step(map[string]Input{"P": {Forward: true}})
		rBwd.Step(map[string]Input{"P": {Back: true}})
		if !almostEqual(rFwd.Players["P"].X, -rBwd.Players["P"].X) {
			t.Errorf("前進と後退でXが逆方向のはず: fwd=%v bwd=%v", rFwd.Players["P"].X, rBwd.Players["P"].X)
		}
		if !almostEqual(rFwd.Players["P"].Z, -rBwd.Players["P"].Z) {
			t.Errorf("前進と後退でZが逆方向のはず: fwd=%v bwd=%v", rFwd.Players["P"].Z, rBwd.Players["P"].Z)
		}
	})
}

// TestTurnDirections は左右旋回入力が Angle を正しく変化させることを検証する。
func TestTurnDirections(t *testing.T) {
	cfg := DefaultConfig()

	t.Run("Left 入力で Angle が減少する", func(t *testing.T) {
		r := newMoveRoom(0)
		before := r.Players["P"].Angle
		r.Step(map[string]Input{"P": {Left: true}})
		after := r.Players["P"].Angle
		if after >= before {
			t.Errorf("Left で Angle が減少するはず: %v -> %v", before, after)
		}
		if !almostEqual(before-after, cfg.TurnRate) {
			t.Errorf("旋回量=%v want %v", before-after, cfg.TurnRate)
		}
	})

	t.Run("Right 入力で Angle が増加する", func(t *testing.T) {
		r := newMoveRoom(0)
		before := r.Players["P"].Angle
		r.Step(map[string]Input{"P": {Right: true}})
		after := r.Players["P"].Angle
		if after <= before {
			t.Errorf("Right で Angle が増加するはず: %v -> %v", before, after)
		}
		if !almostEqual(after-before, cfg.TurnRate) {
			t.Errorf("旋回量=%v want %v", after-before, cfg.TurnRate)
		}
	})

	t.Run("Left と Right を同時に入力すると正味の旋回はゼロになる", func(t *testing.T) {
		r := newMoveRoom(0)
		before := r.Players["P"].Angle
		r.Step(map[string]Input{"P": {Left: true, Right: true}})
		after := r.Players["P"].Angle
		if !almostEqual(before, after) {
			t.Errorf("左右同時入力で角度変化なしのはず: %v -> %v", before, after)
		}
	})

	t.Run("Right で steps tick 旋回すると Angle = steps*TurnRate になる", func(t *testing.T) {
		r := newMoveRoom(0)
		steps := 63 // 任意の整数
		for i := 0; i < steps; i++ {
			r.Step(map[string]Input{"P": {Right: true}})
		}
		want := float64(steps) * cfg.TurnRate
		got := r.Players["P"].Angle
		if !almostEqual(got, want) {
			t.Errorf("Angle=%v want %v", got, want)
		}
	})
}

// TestMoveAfterTurn は旋回後の前進が新しい向きに沿っていることを検証する。
func TestMoveAfterTurn(t *testing.T) {
	t.Run("右旋回後に前進すると新しい+X寄り方向に進む", func(t *testing.T) {
		r := newMoveRoom(0) // 初期: +X 前方
		r.Step(map[string]Input{"P": {Right: true}}) // Angle 増加（+Z 方向へ旋回）
		angleAfterTurn := r.Players["P"].Angle
		r.Step(map[string]Input{"P": {Forward: true}})
		p := r.Players["P"]
		expectedX := math.Cos(angleAfterTurn) * r.Config.MoveBase
		expectedZ := math.Sin(angleAfterTurn) * r.Config.MoveBase
		if !almostEqual(p.X, expectedX) {
			t.Errorf("旋回後前進のX=%v want %v", p.X, expectedX)
		}
		if !almostEqual(p.Z, expectedZ) {
			t.Errorf("旋回後前進のZ=%v want %v", p.Z, expectedZ)
		}
	})
}
