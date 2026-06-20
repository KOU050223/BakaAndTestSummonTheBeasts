package wshandler

import (
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// 初期配置：プレイヤーをフィールド中心円の内側に向かい合わせで置く暫定値。
const initialSpawnRadius = 2.0

// buildRoom は Rails の start-data からドメインの Room を構築する。
func buildRoom(data *railsclient.StartData, cfg battle.Config) *battle.Room {
	fields := make([]battle.Field, len(data.Fields))
	for i, f := range data.Fields {
		fields[i] = battle.Field{Subject: f.Subject, CenterX: f.CenterX, CenterZ: f.CenterZ, Radius: f.Radius}
	}

	players := make(map[string]*battle.Player, len(data.Players))
	for i, pd := range data.Players {
		summons := make(map[string]*battle.Summon, len(pd.Summons))
		for _, s := range pd.Summons {
			summons[s.Subject] = &battle.Summon{
				Subject: s.Subject,
				HP:      s.HP,
				MaxHP:   s.HP,
				Attack:  s.Attack,
				Defense: s.Defense,
				Speed:   s.Speed,
			}
		}
		// 2人を左右に振り分けて配置する（暫定）。
		x := -initialSpawnRadius
		if i == 1 {
			x = initialSpawnRadius
		}
		players[pd.UserID] = battle.NewPlayer(pd.UserID, pd.Name, x, 0, summons)
	}

	return battle.NewRoom(data.BattleID, fields, players, cfg)
}

// snapshot は Room の現在状態を StateMessage に変換する。
func snapshot(r *battle.Room) StateMessage {
	fields := make([]FieldState, len(r.Fields))
	for i, f := range r.Fields {
		fields[i] = FieldState{Subject: f.Subject, CenterX: f.CenterX, CenterZ: f.CenterZ, Radius: f.Radius}
	}

	players := make(map[string]PlayerState, len(r.Players))
	for id, p := range r.Players {
		summons := make(map[string]SummonState, len(p.Summons))
		for subject, s := range p.Summons {
			summons[subject] = SummonState{HP: s.HP}
		}

		var current *string
		if subject := p.CurrentSubject(r.Fields); subject != "" {
			current = &subject
		}

		players[id] = PlayerState{
			X:              p.X,
			Z:              p.Z,
			Angle:          p.Angle,
			CurrentSubject: current,
			Summoned:       p.Summoned,
			Attacking:      p.Attacking,
			Summons:        summons,
		}
	}

	return StateMessage{Type: "state", Tick: r.Tick, Fields: fields, Players: players}
}

// toInput は WebSocket の InputMessage をドメインの Input に変換する。
func toInput(m InputMessage) battle.Input {
	return battle.Input{
		Forward: m.Move.Forward,
		Back:    m.Move.Back,
		Left:    m.Move.Left,
		Right:   m.Move.Right,
		Attack:  m.Attack,
		Summon:  m.Summon,
	}
}
