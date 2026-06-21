package battle

import (
	"math"
	"testing"
)

// テスト用に、math フィールドが原点を覆う Room を作る。
func newTestRoom() *Room {
	fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 5}}
	a := NewPlayer("A", "プレイヤーA", 0, 0, map[string]*Summon{
		"math": {Subject: "math", HP: 100, MaxHP: 100, Attack: 30, Defense: 10, Speed: 8},
	})
	b := NewPlayer("B", "プレイヤーB", 1, 0, map[string]*Summon{
		"math": {Subject: "math", HP: 100, MaxHP: 100, Attack: 20, Defense: 5, Speed: 4},
	})
	a.Angle = 0 // A は +X 方向（B のいる方向）を向く
	return NewRoom("battle_1", fields, map[string]*Player{"A": a, "B": b}, DefaultConfig())
}

func TestStepMove(t *testing.T) {
	t.Run("前進入力でX座標が増加する", func(t *testing.T) {
		r := newTestRoom()
		startX := r.Players["A"].X
		r.Step(map[string]Input{"A": {Forward: true}})
		if r.Players["A"].X <= startX {
			t.Errorf("前進でXが増えるはず: %v -> %v", startX, r.Players["A"].X)
		}
	})
}

func TestStepAttackHit(t *testing.T) {
	t.Run("召喚後の攻撃が命中するとダメージを与える", func(t *testing.T) {
		r := newTestRoom()
		r.Players["A"].Summoned = true
		events := r.Step(map[string]Input{"A": {Attack: true}})

		if len(events) != 1 {
			t.Fatalf("命中イベント1件のはず: %d件", len(events))
		}
		// ダメージ = max(1, 30-5) = 25
		if events[0].Damage != 25 {
			t.Errorf("ダメージ25のはず: %d", events[0].Damage)
		}
		if r.Players["B"].Summons["math"].HP != 75 {
			t.Errorf("B の HP は 75 のはず: %d", r.Players["B"].Summons["math"].HP)
		}
	})
}

func TestStepAttackRequiresSummoned(t *testing.T) {
	t.Run("召喚していなければ攻撃できない", func(t *testing.T) {
		r := newTestRoom()
		// Summoned していないと攻撃不可
		events := r.Step(map[string]Input{"A": {Attack: true}})
		if len(events) != 0 {
			t.Errorf("未召喚では攻撃不可のはず: %d件", len(events))
		}
	})
}

func TestStepAttackCooldown(t *testing.T) {
	t.Run("クールダウン中は連続で攻撃できない", func(t *testing.T) {
		r := newTestRoom()
		r.Players["A"].Summoned = true

		r.Step(map[string]Input{"A": {Attack: true}})           // 命中
		events := r.Step(map[string]Input{"A": {Attack: true}}) // クールダウン中
		if len(events) != 0 {
			t.Errorf("クールダウン中は攻撃できないはず: %d件", len(events))
		}
		if r.Players["A"].Attacking {
			t.Error("クールダウン中は attacking フラグを立てない")
		}
	})

	t.Run("クールダウン通過後の攻撃入力で attacking が立つ", func(t *testing.T) {
		r := newTestRoom()
		r.Players["A"].Summoned = true

		r.Step(map[string]Input{"A": {Attack: true}})
		if !r.Players["A"].Attacking {
			t.Fatal("初回攻撃で attacking が立つはず")
		}

		// クールダウンを消化する（命中時 cd = 30-8 = 22 tick）
		for r.cooldowns["A"] > 0 {
			r.Step(map[string]Input{})
		}

		r.Step(map[string]Input{"A": {Attack: true}})
		if !r.Players["A"].Attacking {
			t.Error("クールダウン後の攻撃で attacking が立つはず")
		}
	})
}

func TestStepAttackCooldownOnMiss(t *testing.T) {
	t.Run("空振りでもクールダウンが付き連続攻撃できない", func(t *testing.T) {
		r := newTestRoom()
		r.Players["A"].Summoned = true
		r.Players["A"].Angle = math.Pi // B と逆を向く → 範囲内でも正面外

		r.Step(map[string]Input{"A": {Attack: true}})
		if r.cooldowns["A"] == 0 {
			t.Fatal("空振りでもクールダウンが付くはず")
		}
		if !r.Players["A"].Attacking {
			t.Error("空振りでも attacking が立つはず")
		}

		events := r.Step(map[string]Input{"A": {Attack: true}})
		if len(events) != 0 {
			t.Errorf("クールダウン中は攻撃できないはず: %d件", len(events))
		}
		if r.Players["A"].Attacking {
			t.Error("クールダウン中は attacking フラグを立てない")
		}
	})
}

func TestRoomCooldown(t *testing.T) {
	t.Run("素早さに反比例し下限を下回らない", func(t *testing.T) {
		r := newTestRoom()
		fast := &Summon{Speed: 8}
		slow := &Summon{Speed: 0}
		veryFast := &Summon{Speed: 100}

		if got := r.cooldown(fast); got != 22 {
			t.Errorf("Speed 8 → cd 22 のはず: %d", got)
		}
		if got := r.cooldown(slow); got != 30 {
			t.Errorf("Speed 0 → cd 30 のはず: %d", got)
		}
		if got := r.cooldown(veryFast); got != r.Config.CooldownMin {
			t.Errorf("下限 %d のはず: %d", r.Config.CooldownMin, got)
		}
	})
}

func TestStepSummonOnlyInField(t *testing.T) {
	t.Run("中立地帯では召喚できない", func(t *testing.T) {
		r := newTestRoom()
		// A を中立地帯へ移動させる。
		r.Players["A"].X, r.Players["A"].Z = 100, 100
		r.Step(map[string]Input{"A": {Summon: true}})
		if r.Players["A"].Summoned {
			t.Error("中立地帯では召喚できないはず")
		}
	})
}

func TestStepVictory(t *testing.T) {
	t.Run("相手のHPをゼロにすると勝敗が決まる", func(t *testing.T) {
		r := newTestRoom()
		r.Players["A"].Summoned = true
		r.Players["B"].Summons["math"].HP = 10 // 1撃で倒れる量

		r.Step(map[string]Input{"A": {Attack: true}})

		if !r.Finished {
			t.Fatal("HP0で決着するはず")
		}
		if r.WinnerID != "A" || r.LoserID != "B" {
			t.Errorf("勝者A・敗者Bのはず: winner=%s loser=%s", r.WinnerID, r.LoserID)
		}
	})
}

func TestStepNoOpAfterFinish(t *testing.T) {
	t.Run("対戦終了後はtickが進まない", func(t *testing.T) {
		r := newTestRoom()
		r.Finished = true
		tick := r.Tick
		r.Step(map[string]Input{"A": {Forward: true}})
		if r.Tick != tick {
			t.Error("終了後はtickが進まないはず")
		}
	})
}

// 苦手科目フィールドで撃破され即敗北するシナリオ（仕様の核）。
func TestStepWeakSubjectInstantLoss(t *testing.T) {
	t.Run("苦手科目フィールドで撃破されると即座に敗北する", func(t *testing.T) {
		fields := []Field{{Subject: "english", CenterX: 0, CenterZ: 0, Radius: 5}}
		a := NewPlayer("A", "A", 0, 0, map[string]*Summon{
			"english": {Subject: "english", HP: 100, Attack: 40, Defense: 10, Speed: 10},
		})
		// B は英語が苦手（HP低い）。
		b := NewPlayer("B", "B", 1, 0, map[string]*Summon{
			"english": {Subject: "english", HP: 5, Attack: 5, Defense: 0, Speed: 0},
		})
		a.Angle = 0
		a.Summoned = true
		r := NewRoom("b", fields, map[string]*Player{"A": a, "B": b}, DefaultConfig())

		r.Step(map[string]Input{"A": {Attack: true}})
		if !r.Finished || r.WinnerID != "A" {
			t.Error("苦手科目フィールドで撃破され即敗北するはず")
		}
	})
}
