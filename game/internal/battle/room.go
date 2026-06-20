package battle

// Input は1プレイヤーの1 tick 分の入力意図（docs/ws-schema.md の input）。
type Input struct {
	Forward bool
	Back    bool
	Left    bool
	Right   bool
	Attack  bool // そのtickで攻撃を試みる
	Summon  bool // そのtickで召喚を試みる
}

// Config はバトルの調整可能なパラメータ。
type Config struct {
	MoveBase     float64 // 基礎移動量/ tick
	MovePerSpeed float64 // 素早さ1あたりの移動量加算
	TurnRate     float64 // 旋回量/ tick（ラジアン）
	AttackRange  float64 // 攻撃が届く距離
	FrontDot     float64 // 正面判定の内積閾値
	CooldownBase int     // 基礎攻撃クールタイム（tick数）
	CooldownMin  int     // クールタイム下限
}

// DefaultConfig は MVP の既定パラメータ。
func DefaultConfig() Config {
	return Config{
		MoveBase:     0.05,
		MovePerSpeed: 0.005,
		TurnRate:     0.1,
		AttackRange:  2.0,
		FrontDot:     0.5,
		CooldownBase: 30, // 30 tick = 1秒（30Hz）
		CooldownMin:  6,
	}
}

// Room はバトル1戦の権威的状態。tick ごとに Tick で進行する。
type Room struct {
	BattleID string
	Fields   []Field
	Players  map[string]*Player
	Config   Config
	Tick     int
	Finished bool

	// 勝敗（チーム単位）。N:N では決着したチームを表す。
	WinnerTeam string
	LoserTeam  string
	// 後方互換：1:1 のとき代表プレイヤーIDを入れる（finished 通知用）。
	WinnerID string
	LoserID  string

	// LeaderRule が真のとき、チームリーダーが撃破された時点でそのチームの敗北とする。
	LeaderRule bool

	// プレイヤーごとの攻撃クールダウン残 tick。
	cooldowns map[string]int
}

// teamKey はプレイヤーの所属チームキーを返す。
// TeamID が空（無所属＝1:1の各プレイヤー）の場合は UserID を独立チームとして扱う。
func (r *Room) teamKey(p *Player) string {
	if p.TeamID == "" {
		return p.UserID
	}
	return p.TeamID
}

// NewRoom はフィールドとプレイヤーから Room を作る。
func NewRoom(battleID string, fields []Field, players map[string]*Player, cfg Config) *Room {
	return &Room{
		BattleID:  battleID,
		Fields:    fields,
		Players:   players,
		Config:    cfg,
		cooldowns: make(map[string]int),
	}
}
