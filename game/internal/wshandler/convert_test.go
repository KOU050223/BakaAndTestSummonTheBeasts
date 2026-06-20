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
			{UserID: "38", Name: "A", Summons: []railsclient.SummonData{{Subject: "math", HP: 140, Attack: 30, Defense: 12, Speed: 8}}},
			{UserID: "39", Name: "B", Summons: []railsclient.SummonData{{Subject: "math", HP: 120, Attack: 25, Defense: 10, Speed: 6}}},
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
