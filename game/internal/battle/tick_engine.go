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

	// クールダウンを減らす。攻撃モーションフラグは毎 tick リセットする。
	for id, p := range r.Players {
		p.Attacking = false
		if r.cooldowns[id] > 0 {
			r.cooldowns[id]--
		}
	}

	// 脱落（戦闘不能）したプレイヤーは行動しない（移動・召喚・攻撃いずれも不可）。
	for id, p := range r.Players {
		if p.Defeated() {
			p.Summoned = false // 場から退場した扱い。
			continue
		}
		r.applyMove(p, inputs[id])
	}
	for id, p := range r.Players {
		if p.Defeated() {
			continue
		}
		r.applySummon(p, inputs[id])
	}

	events := make([]AttackEvent, 0)
	for id, p := range r.Players {
		if p.Defeated() {
			continue
		}
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

	// ここまで来た時点で「攻撃を振った」とみなし、命中の有無に関わらず
	// クライアントで攻撃モーションを再生させる。
	actor.Attacking = true

	// 自分以外で、攻撃範囲・正面条件を満たす対象のうち最も近い1体を選ぶ。
	// map の反復順は非決定的なため、最近接で一意に決める（N:N の公平性）。
	targetID, target, targetSummon := r.nearestTarget(actorID, actor)
	if target == nil {
		return AttackEvent{}, false
	}

	dmg := Damage(attackerSummon.Attack, targetSummon.Defense)
	targetSummon.HP -= dmg
	if targetSummon.HP < 0 {
		targetSummon.HP = 0
	}
	r.cooldowns[actorID] = r.cooldown(attackerSummon)
	return AttackEvent{Turn: r.Tick, ActorID: actorID, TargetID: targetID, Damage: dmg}, true
}

// nearestTarget は actor が攻撃可能な対象のうち最も近い1体を返す。
// 「自分以外全員」が対象（味方含む）。誰も該当しなければ target は nil。
func (r *Room) nearestTarget(actorID string, actor *Player) (string, *Player, *Summon) {
	var bestID string
	var best *Player
	var bestSummon *Summon
	bestDist := math.Inf(1)

	for id, candidate := range r.Players {
		if id == actorID {
			continue
		}
		if candidate.Defeated() {
			continue // 脱落者は攻撃対象にならない
		}
		summon := candidate.ActiveSummon(r.Fields)
		if summon == nil {
			continue // 相手が中立地帯なら戦闘不可
		}
		if !InAttackRange(actor, candidate, r.Config.AttackRange, r.Config.FrontDot) {
			continue
		}
		dist := math.Hypot(candidate.X-actor.X, candidate.Z-actor.Z)
		if dist < bestDist {
			bestDist, bestID, best, bestSummon = dist, id, candidate, summon
		}
	}
	return bestID, best, bestSummon
}

// cooldown は素早さに反比例した攻撃クールタイム（tick数）。
func (r *Room) cooldown(s *Summon) int {
	cd := r.Config.CooldownBase - s.Speed
	if cd < r.Config.CooldownMin {
		return r.Config.CooldownMin
	}
	return cd
}

// checkVictory はチーム単位で決着を判定する。
// 脱落（HP0）したプレイヤーは戦闘不能として場から除外され、
// 「生存プレイヤーのいるチーム」が1つ以下になった時点で決着する。
// LeaderRule が真ならリーダー脱落でそのチームを敗北扱いにする。
func (r *Room) checkVictory() {
	if len(r.Players) == 0 {
		return
	}

	// 全チームと、生存者のいるチームを集計する。
	allTeams := make(map[string]bool)
	survivingTeams := make(map[string]bool)
	leaderAlive := make(map[string]bool)
	hasLeader := make(map[string]bool)
	for _, p := range r.Players {
		team := r.teamKey(p)
		allTeams[team] = true
		if !p.Defeated() {
			survivingTeams[team] = true
		}
		if p.Leader {
			hasLeader[team] = true
			if !p.Defeated() {
				leaderAlive[team] = true
			}
		}
	}

	// LeaderRule 下ではリーダーを失ったチームを生存チームから外す。
	if r.LeaderRule {
		for team := range allTeams {
			if hasLeader[team] && !leaderAlive[team] {
				delete(survivingTeams, team)
			}
		}
	}

	// 開始直後など、まだ誰も脱落していない（生存チーム == 全チーム）なら続行。
	// ただし全チームが1つしかない単独戦は、全滅した時のみ決着させる。
	if len(survivingTeams) >= 2 {
		return // 2陣営以上が生存中：続行。
	}
	if len(survivingTeams) == 1 && len(allTeams) == 1 {
		return // 単独チームに生存者あり：まだ全滅していないので続行。
	}

	// ここに来たら決着：生存チームは0（全滅）か1（勝者確定）。
	r.Finished = true
	if len(survivingTeams) == 1 {
		for team := range survivingTeams {
			r.WinnerTeam = team
		}
	}
	// 敗者チーム：生存していないチームの代表を1つ選ぶ。
	for team := range allTeams {
		if !survivingTeams[team] {
			r.LoserTeam = team
			break
		}
	}
	r.assignRepresentativeIDs()
}

// assignRepresentativeIDs は finished 通知の後方互換用に、勝敗チームの代表
// プレイヤーIDを WinnerID/LoserID へ設定する（主に1:1表示向け）。
func (r *Room) assignRepresentativeIDs() {
	for id, p := range r.Players {
		switch r.teamKey(p) {
		case r.WinnerTeam:
			if r.WinnerID == "" {
				r.WinnerID = id
			}
		case r.LoserTeam:
			if r.LoserID == "" {
				r.LoserID = id
			}
		}
	}
}
