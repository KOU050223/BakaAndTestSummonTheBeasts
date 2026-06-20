package wshandler

// WebSocket メッセージ型（docs/ws-schema.md の正本に対応）。
// TypeScript（zod）側 frontend/src/lib/battle/wsSchema.ts と必ず整合させる。

// --- Client → Server ---

// InputMessage は入力状態（押下）とトリガー（攻撃・召喚）。
type InputMessage struct {
	Type   string    `json:"type"` // "input"
	Move   MoveInput `json:"move"`
	Attack bool      `json:"attack"`
	Summon bool      `json:"summon"`
}

type MoveInput struct {
	Forward bool `json:"forward"`
	Back    bool `json:"back"`
	Left    bool `json:"left"`
	Right   bool `json:"right"`
}

// --- Server → Client ---

// StateMessage は毎 tick のスナップショット。
type StateMessage struct {
	Type    string                 `json:"type"` // "state"
	Tick    int                    `json:"tick"`
	Fields  []FieldState           `json:"fields"`
	Players map[string]PlayerState `json:"players"`
}

type FieldState struct {
	Subject string  `json:"subject"`
	CenterX float64 `json:"centerX"`
	CenterZ float64 `json:"centerZ"`
	Radius  float64 `json:"radius"`
}

type PlayerState struct {
	X              float64                `json:"x"`
	Z              float64                `json:"z"`
	Angle          float64                `json:"angle"`
	CurrentSubject *string                `json:"currentSubject"`
	Summoned       bool                   `json:"summoned"`
	// Attacking はこの tick で攻撃を発動したか（クライアントの攻撃アニメ用）。
	Attacking bool                   `json:"attacking"`
	Summons   map[string]SummonState `json:"summons"`
}

type SummonState struct {
	HP int `json:"hp"`
}

// FinishedMessage は決着通知。
type FinishedMessage struct {
	Type     string `json:"type"` // "finished"
	WinnerID string `json:"winnerId"`
	LoserID  string `json:"loserId"`
}
