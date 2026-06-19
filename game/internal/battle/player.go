package battle

import "math"

// Summon は1科目分の召喚獣スナップショットと現在 HP。
type Summon struct {
	Subject string
	HP      int // 現在 HP（0 で敗北）
	MaxHP   int
	Attack  int
	Defense int
	Speed   int
}

// Player はバトル参加者の権威的状態。位置・向きはサーバーが tick で更新する。
type Player struct {
	UserID  string
	Name    string
	X       float64
	Z       float64
	Angle   float64 // Y軸回りの向き（ラジアン）。0 は +X 方向。
	Summoned bool   // 召喚獣が場に出ているか

	// 科目ごとの召喚獣。いずれか1つでも HP が 0 になると敗北。
	Summons map[string]*Summon
}

// NewPlayer は初期位置・召喚獣マップを持つ Player を生成する。
func NewPlayer(userID, name string, x, z float64, summons map[string]*Summon) *Player {
	return &Player{
		UserID:  userID,
		Name:    name,
		X:       x,
		Z:       z,
		Summons: summons,
	}
}

// Defeated は手持ちのいずれか1科目の HP が 0 以下かを返す（即敗北条件）。
func (p *Player) Defeated() bool {
	for _, s := range p.Summons {
		if s.HP <= 0 {
			return true
		}
	}
	return false
}

// CurrentSubject は現在いるフィールドの科目を返す（中立は空文字）。
func (p *Player) CurrentSubject(fields []Field) string {
	return SubjectAt(fields, p.X, p.Z)
}

// ActiveSummon は現在いるフィールドの科目に対応する召喚獣を返す。
// フィールド外、または該当科目の召喚獣が無い場合は nil。
func (p *Player) ActiveSummon(fields []Field) *Summon {
	subject := p.CurrentSubject(fields)
	if subject == "" {
		return nil
	}
	return p.Summons[subject]
}

// Damage は防御を考慮したダメージ量（最低1）。
func Damage(attack, defense int) int {
	d := attack - defense
	if d < 1 {
		return 1
	}
	return d
}

// InAttackRange は attacker が target を攻撃できる位置関係かを判定する。
// 条件: 距離 ≤ rangeDist かつ target が attacker の正面 frontDot 以内（向きの内積）。
func InAttackRange(attacker, target *Player, rangeDist, frontDot float64) bool {
	dx := target.X - attacker.X
	dz := target.Z - attacker.Z
	dist := math.Hypot(dx, dz)
	if dist > rangeDist {
		return false
	}
	if dist == 0 {
		return true // 重なっている場合は命中扱い
	}
	// attacker の向きベクトルと、target への方向ベクトルの内積（正規化済み）。
	facingX := math.Cos(attacker.Angle)
	facingZ := math.Sin(attacker.Angle)
	dot := (facingX*dx + facingZ*dz) / dist
	return dot >= frontDot
}
