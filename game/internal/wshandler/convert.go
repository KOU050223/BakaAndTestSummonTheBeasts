package wshandler

import (
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// 初期配置：プレイヤーをフィールド中心円の内側に向かい合わせで置く暫定値。
const initialSpawnRadius = 2.0

// spawnRowGap は同チーム内で隊列を作る際の Z 方向の間隔。
const spawnRowGap = 1.5

// teamSpawnIndex は出現順にチームへ通し番号を振る（陣営の左右割り当てに使う）。
func teamSpawnIndex(players []railsclient.PlayerData) map[string]int {
	index := make(map[string]int)
	next := 0
	for _, pd := range players {
		team := pd.TeamID
		if team == "" {
			team = pd.UserID
		}
		if _, ok := index[team]; !ok {
			index[team] = next
			next++
		}
	}
	return index
}

// buildRoom は Rails の start-data からドメインの Room を構築する。
func buildRoom(data *railsclient.StartData, cfg battle.Config) *battle.Room {
	fields := make([]battle.Field, len(data.Fields))
	for i, f := range data.Fields {
		fields[i] = battle.Field{Subject: f.Subject, CenterX: f.CenterX, CenterZ: f.CenterZ, Radius: f.Radius}
	}

	players := make(map[string]*battle.Player, len(data.Players))
	// チームごとに並び順を割り当て、同チームを同じ側へ縦に並べて配置する。
	teamIndex := teamSpawnIndex(data.Players)
	teamSlot := make(map[string]int)
	for _, pd := range data.Players {
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

		team := pd.TeamID
		if team == "" {
			team = pd.UserID // 無所属は1人チーム扱い。
		}
		// チームごとに X 方向（陣営）を分け、Z 方向に隊列を作る。
		side := -initialSpawnRadius
		if teamIndex[team]%2 == 1 {
			side = initialSpawnRadius
		}
		z := float64(teamSlot[team]) * spawnRowGap
		teamSlot[team]++

		p := battle.NewPlayer(pd.UserID, pd.Name, side, z, summons)
		p.TeamID = pd.TeamID
		p.Leader = pd.Leader
		players[pd.UserID] = p
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
			TeamID:         p.TeamID,
			Leader:         p.Leader,
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
