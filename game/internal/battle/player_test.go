package battle

import (
	"math"
	"testing"
)

func TestDamage(t *testing.T) {
	cases := []struct {
		attack, defense, want int
	}{
		{30, 12, 18},
		{10, 10, 1}, // 同値でも最低1
		{5, 20, 1},  // 防御過剰でも最低1
		{40, 0, 40},
	}
	for _, c := range cases {
		if got := Damage(c.attack, c.defense); got != c.want {
			t.Errorf("Damage(%d,%d)=%d want %d", c.attack, c.defense, got, c.want)
		}
	}
}

func TestPlayerDefeated(t *testing.T) {
	p := NewPlayer("1", "A", 0, 0, map[string]*Summon{
		"math":    {Subject: "math", HP: 100},
		"english": {Subject: "english", HP: 0}, // 1つでも0なら敗北
	})
	if !p.Defeated() {
		t.Error("いずれか1科目が0なら敗北のはず")
	}

	alive := NewPlayer("2", "B", 0, 0, map[string]*Summon{
		"math": {Subject: "math", HP: 1},
	})
	if alive.Defeated() {
		t.Error("全科目HP>0なら敗北でないはず")
	}
}

func TestActiveSummon(t *testing.T) {
	fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 3}}
	p := NewPlayer("1", "A", 0, 0, map[string]*Summon{
		"math": {Subject: "math", HP: 100},
	})

	if s := p.ActiveSummon(fields); s == nil || s.Subject != "math" {
		t.Error("mathフィールド内ではmath召喚獣が有効のはず")
	}

	// フィールド外（中立）では nil
	p.X, p.Z = 10, 10
	if s := p.ActiveSummon(fields); s != nil {
		t.Error("中立地帯では有効召喚獣なしのはず")
	}
}

func TestInAttackRange(t *testing.T) {
	// attacker は原点で +X 方向（angle=0）を向く。
	attacker := NewPlayer("1", "A", 0, 0, nil)
	attacker.Angle = 0

	front := NewPlayer("2", "B", 1, 0, nil) // 正面1m
	back := NewPlayer("3", "C", -1, 0, nil) // 真後ろ1m
	far := NewPlayer("4", "D", 5, 0, nil)   // 正面だが5m先

	rangeDist, frontDot := 2.0, 0.5

	if !InAttackRange(attacker, front, rangeDist, frontDot) {
		t.Error("正面・範囲内は命中のはず")
	}
	if InAttackRange(attacker, back, rangeDist, frontDot) {
		t.Error("背後は命中しないはず")
	}
	if InAttackRange(attacker, far, rangeDist, frontDot) {
		t.Error("範囲外は命中しないはず")
	}
}

func TestInAttackRangeFacing(t *testing.T) {
	// 90度横（angle=0で +Z 方向にいる相手）は frontDot=0.5 では外れる。
	attacker := NewPlayer("1", "A", 0, 0, nil)
	attacker.Angle = 0
	side := NewPlayer("2", "B", 0, 1, nil)

	if InAttackRange(attacker, side, 2.0, 0.5) {
		t.Error("真横（dot=0）はfrontDot=0.5で命中しないはず")
	}
	// attacker が +Z を向けば命中する。
	attacker.Angle = math.Pi / 2
	if !InAttackRange(attacker, side, 2.0, 0.5) {
		t.Error("+Zを向けば命中するはず")
	}
}
