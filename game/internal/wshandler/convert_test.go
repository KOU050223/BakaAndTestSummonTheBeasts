package wshandler

import (
	"math"
	"testing"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// Rails の place_fields と同じ配置（1科目: リング半径5、フィールド半径3）。
func sampleStartData() *railsclient.StartData {
	return &railsclient.StartData{
		BattleID: "11",
		Fields:   []railsclient.FieldData{{Subject: "math", CenterX: 5, CenterZ: 0, Radius: 3}},
		Players: []railsclient.PlayerData{
			{UserID: "38", Name: "A", TeamID: "classA", Leader: true, Summons: []railsclient.SummonData{{Subject: "math", HP: 140, Attack: 30, Defense: 12, Speed: 8}}},
			{UserID: "39", Name: "B", TeamID: "classB", Leader: true, Summons: []railsclient.SummonData{{Subject: "math", HP: 120, Attack: 25, Defense: 10, Speed: 6}}},
		},
	}
}

func insideField(f battle.Field, x, z float64) bool {
	dx := x - f.CenterX
	dz := z - f.CenterZ
	return math.Hypot(dx, dz) <= f.Radius+1e-9
}

func facingDot(a, b *battle.Player) float64 {
	ax, az := math.Cos(a.Angle), math.Sin(a.Angle)
	bx, bz := math.Cos(b.Angle), math.Sin(b.Angle)
	return ax*bx + az*bz
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
		b := room.Players["39"]
		field := room.Fields[0]

		if !insideField(field, a.X, a.Z) || !insideField(field, b.X, b.Z) {
			t.Errorf("スポーンは先頭フィールド内のはず: A=(%v,%v) B=(%v,%v) field=%+v", a.X, a.Z, b.X, b.Z, field)
		}
		if (a.X-field.CenterX)*(b.X-field.CenterX) >= 0 && field.CenterZ == 0 {
			t.Errorf("別チームはフィールド中心を挟んで配置されるはず: a.X=%v b.X=%v", a.X, b.X)
		}
		if facingDot(a, b) > -0.9 {
			t.Errorf("向かい合わせのはず: dot=%v a.Angle=%v b.Angle=%v", facingDot(a, b), a.Angle, b.Angle)
		}
	})
}

func TestBuildRoomSameTeamSameSide(t *testing.T) {
	t.Run("同チームは同じ陣営に隊列配置される", func(t *testing.T) {
		data := &railsclient.StartData{
			BattleID: "1",
			Fields:   []railsclient.FieldData{{Subject: "math", CenterX: 5, CenterZ: 0, Radius: 3}},
			Players: []railsclient.PlayerData{
				{UserID: "1", Name: "A1", TeamID: "classA", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
				{UserID: "2", Name: "A2", TeamID: "classA", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
				{UserID: "3", Name: "B1", TeamID: "classB", Summons: []railsclient.SummonData{{Subject: "math", HP: 100}}},
			},
		}
		room := buildRoom(data, battle.DefaultConfig())
		a1, a2, b1 := room.Players["1"], room.Players["2"], room.Players["3"]
		field := room.Fields[0]

		if !insideField(field, a1.X, a1.Z) || !insideField(field, a2.X, a2.Z) || !insideField(field, b1.X, b1.Z) {
			t.Errorf("全員フィールド内のはず")
		}
		if math.Abs(a1.Angle-a2.Angle) > 1e-9 {
			t.Errorf("同チームは同じ向きのはず: %v %v", a1.Angle, a2.Angle)
		}
		if (a1.X-field.CenterX)*(b1.X-field.CenterX) >= 0 {
			t.Errorf("別チームはフィールド中心を挟むはず: %v %v", a1.X, b1.X)
		}
		if a1.Z == a2.Z {
			t.Errorf("同チーム内は隊列方向にずらすはず: %v %v", a1.Z, a2.Z)
		}
	})
}

func TestSpawnPositionAndAngleVerticalField(t *testing.T) {
	t.Run("Z 方向に配置されたフィールドでも向かい合わせになる", func(t *testing.T) {
		field := battle.Field{Subject: "english", CenterX: 0, CenterZ: 5, Radius: 3}
		x0, z0, a0 := spawnPositionAndAngle(field, 0, 0)
		x1, z1, a1 := spawnPositionAndAngle(field, 1, 0)

		if !insideField(field, x0, z0) || !insideField(field, x1, z1) {
			t.Fatalf("フィールド内スポーンのはず: (%v,%v) (%v,%v)", x0, z0, x1, z1)
		}
		if z0 >= field.CenterZ || z1 <= field.CenterZ {
			t.Errorf("チームは中心を Z 方向に挟むはず: z0=%v z1=%v centerZ=%v", z0, z1, field.CenterZ)
		}
		dot := math.Cos(a0)*math.Cos(a1) + math.Sin(a0)*math.Sin(a1)
		if dot > -0.9 {
			t.Errorf("向かい合わせのはず: dot=%v", dot)
		}
	})
}

func TestSnapshot(t *testing.T) {
	t.Run("ルームの状態からスナップショットを生成できる", func(t *testing.T) {
		room := buildRoom(sampleStartData(), battle.DefaultConfig())
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
