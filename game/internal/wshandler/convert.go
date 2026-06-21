package wshandler

import (
	"math"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/battle"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
)

// spawnRowGap は同チーム内で隊列を作る際の、向きに垂直な方向の間隔。
const spawnRowGap = 1.5

// spawnInwardRatio はフィールド半径に対する、中心からチーム配置点までの距離の比率。
const spawnInwardRatio = 0.55

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

// pickSpawnField は初期スポーンに使うフィールドを選ぶ（Rails の先頭科目フィールド）。
func pickSpawnField(fields []battle.Field) battle.Field {
	if len(fields) == 0 {
		return battle.Field{CenterX: 0, CenterZ: 0, Radius: 3}
	}
	return fields[0]
}

// fieldSpawnAxis はフィールド中心からバトルアリーナ中心（原点）への方位角。
// チームはこの軸上で向かい合わせに配置する。
func fieldSpawnAxis(field battle.Field) float64 {
	if field.CenterX == 0 && field.CenterZ == 0 {
		return 0
	}
	return math.Atan2(field.CenterZ, field.CenterX)
}

func spawnOffsetDistance(field battle.Field) float64 {
	offset := field.Radius * spawnInwardRatio
	if offset < 0.8 {
		return 0.8
	}
	if offset > 2.0 {
		return 2.0
	}
	return offset
}

// spawnPositionAndAngle はフィールド内の向かい合わせ位置と Go Angle を返す。
func spawnPositionAndAngle(field battle.Field, teamSide int, row int) (x, z, angle float64) {
	axis := fieldSpawnAxis(field)
	offset := spawnOffsetDistance(field)
	perp := axis + math.Pi/2

	var sideAngle float64
	if teamSide%2 == 0 {
		sideAngle = axis + math.Pi
		angle = axis
	} else {
		sideAngle = axis
		angle = axis + math.Pi
	}

	rowOffset := float64(row) * spawnRowGap
	x = field.CenterX + math.Cos(sideAngle)*offset + math.Cos(perp)*rowOffset
	z = field.CenterZ + math.Sin(sideAngle)*offset + math.Sin(perp)*rowOffset
	return x, z, angle
}

// buildRoom は Rails の start-data からドメインの Room を構築する。
func buildRoom(data *railsclient.StartData, cfg battle.Config) *battle.Room {
	fields := make([]battle.Field, len(data.Fields))
	for i, f := range data.Fields {
		fields[i] = battle.Field{Subject: f.Subject, CenterX: f.CenterX, CenterZ: f.CenterZ, Radius: f.Radius}
	}

	spawnField := pickSpawnField(fields)

	players := make(map[string]*battle.Player, len(data.Players))
	// チームごとに並び順を割り当て、先頭フィールド内で向かい合わせに配置する。
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
		side := teamIndex[team]
		row := teamSlot[team]
		teamSlot[team]++

		x, z, angle := spawnPositionAndAngle(spawnField, side, row)
		p := battle.NewPlayer(pd.UserID, pd.Name, x, z, summons)
		p.Angle = angle
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
			Defeated:       p.Defeated(),
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
