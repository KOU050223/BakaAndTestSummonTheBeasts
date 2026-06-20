package battle

import "testing"

// チーム全滅で決着する N:N の勝敗判定を検証する。
func newTeamRoom() *Room {
	fields := []Field{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 10}}
	mk := func(id, team string, hp int) *Player {
		p := NewPlayer(id, id, 0, 0, map[string]*Summon{
			"math": {Subject: "math", HP: hp, MaxHP: 100, Attack: 30, Defense: 10, Speed: 8},
		})
		p.TeamID = team
		p.Summoned = true
		return p
	}
	players := map[string]*Player{
		"A1": mk("A1", "classA", 100),
		"A2": mk("A2", "classA", 100),
		"B1": mk("B1", "classB", 100),
		"B2": mk("B2", "classB", 100),
	}
	return NewRoom("battle_team", fields, players, DefaultConfig())
}

func TestTeamVictoryRequiresWholeTeamDefeat(t *testing.T) {
	t.Run("片方のチームの1人が脱落しても決着しない", func(t *testing.T) {
		r := newTeamRoom()
		r.Players["B1"].Summons["math"].HP = 0
		r.checkVictory()
		if r.Finished {
			t.Error("チームに生存者がいる間は決着しないはず")
		}
	})

	t.Run("片方のチーム全員が脱落すると相手チームの勝ち", func(t *testing.T) {
		r := newTeamRoom()
		r.Players["B1"].Summons["math"].HP = 0
		r.Players["B2"].Summons["math"].HP = 0
		r.checkVictory()
		if !r.Finished {
			t.Fatal("チーム全滅で決着するはず")
		}
		if r.WinnerTeam != "classA" || r.LoserTeam != "classB" {
			t.Errorf("勝者classA・敗者classBのはず: winner=%s loser=%s", r.WinnerTeam, r.LoserTeam)
		}
	})
}

func TestTeamVictoryByLeaderDefeat(t *testing.T) {
	t.Run("リーダーが撃破されるとチーム全滅前でも敗北する", func(t *testing.T) {
		r := newTeamRoom()
		r.LeaderRule = true
		r.Players["B1"].Leader = true
		r.Players["B1"].Summons["math"].HP = 0 // リーダーのみ脱落、B2 は生存
		r.checkVictory()
		if !r.Finished {
			t.Fatal("リーダー撃破ルールでは決着するはず")
		}
		if r.WinnerTeam != "classA" || r.LoserTeam != "classB" {
			t.Errorf("勝者classA・敗者classBのはず: winner=%s loser=%s", r.WinnerTeam, r.LoserTeam)
		}
	})
}
