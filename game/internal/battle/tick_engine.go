package battle

import "math"

// AttackEvent は1 tick で発生した命中ダメージ（行動ログ用）。
type AttackEvent struct {
	Turn     int
	ActorID  string
	TargetID string
	Damage   int
}

// Step は inputs（userID -> Input）を反映して1 tick 進める。
// 移動 → 召喚 → 攻撃 → 勝敗判定の順に処理し、発生した攻撃イベントを返す。
// バトルが既に終了している場合は何もしない。
func (r *Room) Step(inputs map[string]Input) []AttackEvent {
	if r.Finished {
		return nil
	}
	r.Tick++

	// クールダウンを減らす。
	for id := range r.Players {
		if r.cooldowns[id] > 0 {
			r.cooldowns[id]--
		}
	}

	for id, p := range r.Players {
		r.applyMove(p, inputs[id])
	}
	for id, p := range r.Players {
		r.applySummon(p, inputs[id])
	}

	events := make([]AttackEvent, 0)
	for id, p := range r.Players {
		if ev, ok := r.applyAttack(id, p, inputs[id]); ok {
			events = append(events, ev)
		}
	}

	r.checkVictory()
	return events
}

// applyMove は入力に応じて位置・向きを更新する。移動速度は素早さに比例する。
func (r *Room) applyMove(p *Player, in Input) {
	if in.Left {
		p.Angle -= r.Config.TurnRate
	}
	if in.Right {
		p.Angle += r.Config.TurnRate
	}

	speed := r.Config.MoveBase
	// 有効な召喚獣の素早さを移動速度に反映する。
	if s := p.ActiveSummon(r.Fields); s != nil {
		speed += float64(s.Speed) * r.Config.MovePerSpeed
	}

	var dir float64
	switch {
	case in.Forward:
		dir = 1
	case in.Back:
		dir = -1
	default:
		return
	}
	p.X += math.Cos(p.Angle) * speed * dir
	p.Z += math.Sin(p.Angle) * speed * dir
}

// applySummon はフィールド内でのみ召喚を許可する。中立地帯では召喚を解除する。
func (r *Room) applySummon(p *Player, in Input) {
	subject := p.CurrentSubject(r.Fields)
	if subject == "" {
		// 中立地帯では場に出ていられない。
		p.Summoned = false
		return
	}
	if in.Summon {
		p.Summoned = true
	}
}

// applyAttack は攻撃入力を判定し、命中すれば対象の有効召喚獣にダメージを与える。
func (r *Room) applyAttack(actorID string, actor *Player, in Input) (AttackEvent, bool) {
	if !in.Attack || r.cooldowns[actorID] > 0 {
		return AttackEvent{}, false
	}
	attackerSummon := actor.ActiveSummon(r.Fields)
	if attackerSummon == nil || !actor.Summoned {
		return AttackEvent{}, false // フィールド外・未召喚は攻撃不可
	}

	for targetID, target := range r.Players {
		if targetID == actorID {
			continue
		}
		targetSummon := target.ActiveSummon(r.Fields)
		if targetSummon == nil {
			continue // 相手が中立地帯なら戦闘不可
		}
		if !InAttackRange(actor, target, r.Config.AttackRange, r.Config.FrontDot) {
			continue
		}

		dmg := Damage(attackerSummon.Attack, targetSummon.Defense)
		targetSummon.HP -= dmg
		if targetSummon.HP < 0 {
			targetSummon.HP = 0
		}
		r.cooldowns[actorID] = r.cooldown(attackerSummon)
		return AttackEvent{Turn: r.Tick, ActorID: actorID, TargetID: targetID, Damage: dmg}, true
	}
	return AttackEvent{}, false
}

// cooldown は素早さに反比例した攻撃クールタイム（tick数）。
func (r *Room) cooldown(s *Summon) int {
	cd := r.Config.CooldownBase - s.Speed
	if cd < r.Config.CooldownMin {
		return r.Config.CooldownMin
	}
	return cd
}

// checkVictory はいずれかのプレイヤーが敗北していれば決着を確定する。
func (r *Room) checkVictory() {
	var defeated []string
	for id, p := range r.Players {
		if p.Defeated() {
			defeated = append(defeated, id)
		}
	}
	if len(defeated) == 0 {
		return
	}

	r.Finished = true
	r.LoserID = defeated[0]
	for id := range r.Players {
		if id != r.LoserID {
			r.WinnerID = id
		}
	}
}
