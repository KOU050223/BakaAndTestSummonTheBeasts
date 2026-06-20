package battle

import "testing"

// N:N で複数の攻撃対象が範囲内にいる場合、最も近い1体に命中することを検証する。
func TestAttackHitsNearestTarget(t *testing.T) {
	t.Run("範囲内に複数いるとき最も近い相手に命中する", func(t *testing.T) {
		fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 10}}
		mk := func(id string, x float64) *Player {
			p := NewPlayer(id, id, x, 0, map[string]*Summon{
				"math": {Subject: "math", HP: 100, MaxHP: 100, Attack: 30, Defense: 10, Speed: 8},
			})
			p.Summoned = true
			return p
		}
		a := mk("A", 0)
		a.Angle = 0 // +X 方向を向く
		near := mk("near", 1.0)
		far := mk("far", 1.8)
		r := NewRoom("b", fields, map[string]*Player{"A": a, "near": near, "far": far}, DefaultConfig())

		events := r.Step(map[string]Input{"A": {Attack: true}})
		if len(events) != 1 {
			t.Fatalf("命中イベント1件のはず: %d件", len(events))
		}
		if events[0].TargetID != "near" {
			t.Errorf("最も近い near に命中するはず: %s", events[0].TargetID)
		}
		if r.Players["far"].Summons["math"].HP != 100 {
			t.Errorf("遠い far は無傷のはず: %d", r.Players["far"].Summons["math"].HP)
		}
	})
}

// 攻撃は味方（同チーム）にも当たる（「自分以外全員」仕様）。
func TestAttackHitsTeammate(t *testing.T) {
	t.Run("自分以外全員が対象なので同チームにも命中する", func(t *testing.T) {
		fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 10}}
		mk := func(id string, x float64) *Player {
			p := NewPlayer(id, id, x, 0, map[string]*Summon{
				"math": {Subject: "math", HP: 100, MaxHP: 100, Attack: 30, Defense: 10, Speed: 8},
			})
			p.TeamID = "classA"
			p.Summoned = true
			return p
		}
		a := mk("A", 0)
		a.Angle = 0
		mate := mk("mate", 1.0)
		r := NewRoom("b", fields, map[string]*Player{"A": a, "mate": mate}, DefaultConfig())

		events := r.Step(map[string]Input{"A": {Attack: true}})
		if len(events) != 1 || events[0].TargetID != "mate" {
			t.Fatalf("同チームの mate に命中するはず: %+v", events)
		}
	})
}
