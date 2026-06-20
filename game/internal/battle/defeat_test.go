package battle

import "testing"

func mkPlayer(id, team string, x float64, hp int) *Player {
	p := NewPlayer(id, id, x, 0, map[string]*Summon{
		"math": {Subject: "math", HP: hp, MaxHP: 100, Attack: 30, Defense: 0, Speed: 8},
	})
	p.TeamID = team
	p.Summoned = true
	return p
}

func defeatTestRoom(players map[string]*Player) *Room {
	fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 20}}
	return NewRoom("b", fields, players, DefaultConfig())
}

// 生存プレイヤーのチームが1つになったら決着する（チーム全滅ベース）。
func TestVictoryWhenOneTeamRemains(t *testing.T) {
	t.Run("相手チーム全員が脱落すると決着し残ったチームの勝ち", func(t *testing.T) {
		r := defeatTestRoom(map[string]*Player{
			"A1": mkPlayer("A1", "classA", 0, 100),
			"A2": mkPlayer("A2", "classA", 1, 100),
			"B1": mkPlayer("B1", "classB", 2, 0), // 脱落
			"B2": mkPlayer("B2", "classB", 3, 0), // 脱落
		})
		r.checkVictory()
		if !r.Finished {
			t.Fatal("相手チーム全滅で決着するはず")
		}
		if r.WinnerTeam != "classA" || r.LoserTeam != "classB" {
			t.Errorf("勝者classA・敗者classB: winner=%s loser=%s", r.WinnerTeam, r.LoserTeam)
		}
	})

	t.Run("両チームに生存者がいる間は決着しない", func(t *testing.T) {
		r := defeatTestRoom(map[string]*Player{
			"A1": mkPlayer("A1", "classA", 0, 100),
			"B1": mkPlayer("B1", "classB", 1, 0), // 1人脱落
			"B2": mkPlayer("B2", "classB", 2, 50),
		})
		r.checkVictory()
		if r.Finished {
			t.Error("相手チームに生存者がいるので決着しないはず")
		}
	})
}

// バグ再現の回帰テスト：同一チームしかいない場面でも全滅すれば決着する。
func TestVictorySameTeamAllDefeated(t *testing.T) {
	t.Run("唯一のチームが全滅したら決着する（引き分け／全滅）", func(t *testing.T) {
		r := defeatTestRoom(map[string]*Player{
			"A1": mkPlayer("A1", "classA", 0, 0),
			"A2": mkPlayer("A2", "classA", 1, 0),
		})
		r.checkVictory()
		if !r.Finished {
			t.Fatal("全員脱落なら決着するはず")
		}
	})

	t.Run("唯一のチームに生存者がいる間は決着しない", func(t *testing.T) {
		r := defeatTestRoom(map[string]*Player{
			"A1": mkPlayer("A1", "classA", 0, 100),
			"A2": mkPlayer("A2", "classA", 1, 0),
		})
		r.checkVictory()
		if r.Finished {
			t.Error("生存者がいる単一チームでは決着しないはず")
		}
	})
}

// 脱落プレイヤーは攻撃対象にならない。
func TestDefeatedPlayerNotTargeted(t *testing.T) {
	t.Run("HP0の相手は攻撃対象にならず、生存中の相手に命中する", func(t *testing.T) {
		dead := mkPlayer("dead", "classB", 0.5, 0) // 近いが脱落済み
		alive := mkPlayer("alive", "classB", 1.0, 100)
		a := mkPlayer("A", "classA", 0, 100)
		a.Angle = 0
		r := defeatTestRoom(map[string]*Player{"A": a, "dead": dead, "alive": alive})

		events := r.Step(map[string]Input{"A": {Attack: true}})
		if len(events) != 1 {
			t.Fatalf("命中1件のはず: %d件", len(events))
		}
		if events[0].TargetID != "alive" {
			t.Errorf("脱落者ではなく生存者に命中するはず: %s", events[0].TargetID)
		}
	})
}

// 脱落プレイヤーは行動（移動・攻撃）しない。
func TestDefeatedPlayerCannotAct(t *testing.T) {
	t.Run("HP0のプレイヤーは前進入力でも動かない", func(t *testing.T) {
		dead := mkPlayer("dead", "classA", 0, 0)
		// 決着しないよう別チームの生存者を置く。
		other := mkPlayer("other", "classB", 5, 100)
		r := defeatTestRoom(map[string]*Player{"dead": dead, "other": other})
		startX := dead.X
		r.Step(map[string]Input{"dead": {Forward: true}})
		if dead.X != startX {
			t.Errorf("脱落者は移動しないはず: %v -> %v", startX, dead.X)
		}
	})
}
