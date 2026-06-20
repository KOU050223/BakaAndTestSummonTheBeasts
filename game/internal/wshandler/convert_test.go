package wshandler

import (
	"testing"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

func sampleStartData() *railsclient.StartData {
	return &railsclient.StartData{
		BattleID: "11",
		Fields:   []railsclient.FieldData{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 5}},
		Players: []railsclient.PlayerData{
			{UserID: "38", Name: "A", TeamID: "classA", Leader: true, Summons: []railsclient.SummonData{{Subject: "math", HP: 140, Attack: 30, Defense: 12, Speed: 8}}},
			{UserID: "39", Name: "B", TeamID: "classB", Leader: true, Summons: []railsclient.SummonData{{Subject: "math", HP: 120, Attack: 25, Defense: 10, Speed: 6}}},
		},
	}
}

func TestBuildRoom(t *testing.T) {
	t.Run("開始データからルームを構築できる", func(t *testing.T) {
		room := buildRoom(sampleStartData(), battle.DefaultConfig())

		if room.BattleID != "11" {
			t.Errorf("battleID mismatch: %s", room.BattleID)
		}
		if len(room.Fields) != 1 || room.Fields[0].Subject != "math" {
			t.Errorf("fields not built: %+v", room.Fields)
		}
		if len(room.Players) != 2 {
			t.Fatalf("expected 2 players, got %d", len(room.Players))
		}
		a := room.Players["38"]
		if a == nil || a.Summons["math"].HP != 140 {
			t.Errorf("player A summon not built: %+v", a)
		}
		if a.TeamID != "classA" || !a.Leader {
			t.Errorf("player A team/leader not built: team=%s leader=%v", a.TeamID, a.Leader)
		}
		// 別チームは左右の陣営に振り分けられる（X 符号が逆）。
		b := room.Players["39"]
		if (a.X < 0) == (b.X < 0) {
			t.Errorf("別チームは別陣営に配置されるはず: a.X=%v b.X=%v", a.X, b.X)
		}
	})
}

func TestBuildRoomSameTeamSameSide(t *testing.T) {
	t.Run("同チームは同じ陣営に隊列配置される", func(t *testing.T) {
		data := &railsclient.StartData{
			BattleID: "1",
			Fields:   []railsclient.FieldData{{Subject: "math", CenterX: 0, CenterZ: 0, Radius: 5}},
			Players: []railsclient.PlayerData{
				{UserID: "1", Name: "A1", TeamID: "classA", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
				{UserID: "2", Name: "A2", TeamID: "classA", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
				{UserID: "3", Name: "B1", TeamID: "classB", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
			},
		}
		room := buildRoom(data, battle.DefaultConfig())
		a1, a2, b1 := room.Players["1"], room.Players["2"], room.Players["3"]
		if (a1.X < 0) != (a2.X < 0) {
			t.Errorf("同チームA1/A2は同じ陣営のはず: %v %v", a1.X, a2.X)
		}
		if (a1.X < 0) == (b1.X < 0) {
			t.Errorf("別チームB1は反対陣営のはず: %v %v", a1.X, b1.X)
		}
		if a1.Z == a2.Z {
			t.Errorf("同チーム内は Z でずらして隊列にするはず: %v %v", a1.Z, a2.Z)
		}
	})
}

func TestSnapshot(t *testing.T) {
	t.Run("ルームの状態からスナップショットを生成できる", func(t *testing.T) {
		room := buildRoom(sampleStartData(), battle.DefaultConfig())
		// プレイヤーをフィールド中心へ寄せる（spawnは±2なので半径5の内側）。
		state := snapshot(room)

		if state.Type != "state" {
			t.Errorf("type should be state: %s", state.Type)
		}
		if len(state.Players) != 2 {
			t.Fatalf("expected 2 players in snapshot")
		}
		pa := state.Players["38"]
		if pa.Summons["math"].HP != 140 {
			t.Errorf("snapshot hp mismatch: %d", pa.Summons["math"].HP)
		}
		// spawn (-2,0) は math フィールド(半径5)内なので currentSubject が math。
		if pa.CurrentSubject == nil || *pa.CurrentSubject != "math" {
			t.Errorf("currentSubject should be math: %v", pa.CurrentSubject)
		}
	})
}

func TestSnapshotNeutral(t *testing.T) {
	t.Run("中立地帯では現在科目が設定されない", func(t *testing.T) {
		room := buildRoom(sampleStartData(), battle.DefaultConfig())
		room.Players["38"].X = 100 // 中立地帯へ
		state := snapshot(room)
		if state.Players["38"].CurrentSubject != nil {
			t.Error("中立地帯では currentSubject は nil のはず")
		}
	})
}

func TestToInput(t *testing.T) {
	t.Run("入力メッセージをゲーム入力へ変換できる", func(t *testing.T) {
		in := toInput(InputMessage{
			Type:   "input",
			Move:   MoveInput{Forward: true, Right: true},
			Attack: true,
		})
		if !in.Forward || !in.Right || !in.Attack || in.Summon {
			t.Errorf("input conversion wrong: %+v", in)
		}
	})
}
