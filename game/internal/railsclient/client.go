// Package railsclient は Rails Internal API（start-data / finish）のクライアント。
// 共有シークレット（X-Internal-Secret）で認証する。
package railsclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client は Rails Internal API への HTTP クライアント。
type Client struct {
	BaseURL    string
	Secret     string
	HTTPClient *http.Client
}

// New は既定タイムアウト付きの Client を生成する。
func New(baseURL, secret string) *Client {
	return &Client{
		BaseURL:    baseURL,
		Secret:     secret,
		HTTPClient: &http.Client{Timeout: 5 * time.Second},
	}
}

// --- start-data のレスポンス型（docs/ws-schema.md / BattleStartDataSerializer に対応）---

type StartData struct {
	BattleID string       `json:"battleId"`
	Fields   []FieldData  `json:"fields"`
	Players  []PlayerData `json:"players"`
}

type FieldData struct {
	Subject string  `json:"subject"`
	CenterX float64 `json:"centerX"`
	CenterZ float64 `json:"centerZ"`
	Radius  float64 `json:"radius"`
}

type PlayerData struct {
	UserID  string       `json:"userId"`
	Name    string       `json:"name"`
	Summons []SummonData `json:"summons"`
}

type SummonData struct {
	Subject string `json:"subject"`
	HP      int    `json:"hp"`
	Attack  int    `json:"attack"`
	Defense int    `json:"defense"`
	Speed   int    `json:"speed"`
}

// FetchStartData は GET /internal/battles/:id/start-data を呼ぶ。
func (c *Client) FetchStartData(ctx context.Context, battleID string) (*StartData, error) {
	url := fmt.Sprintf("%s/internal/battles/%s/start-data", c.BaseURL, battleID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Internal-Secret", c.Secret)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("start-data failed: status %d", resp.StatusCode)
	}

	var data StartData
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}
	return &data, nil
}

// --- finish のリクエスト型 ---

type FinishRequest struct {
	WinnerID string      `json:"winnerId"`
	LoserID  string      `json:"loserId"`
	Logs     []FinishLog `json:"logs"`
}

type FinishLog struct {
	Turn     int    `json:"turn"`
	ActorID  string `json:"actorId"`
	TargetID string `json:"targetId"`
	Action   string `json:"action"`
	Damage   int    `json:"damage"`
}

// PostFinish は POST /internal/battles/:id/finish を呼ぶ（冪等。Rails 側で重複保存しない）。
func (c *Client) PostFinish(ctx context.Context, battleID string, body FinishRequest) error {
	url := fmt.Sprintf("%s/internal/battles/%s/finish", c.BaseURL, battleID)
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("X-Internal-Secret", c.Secret)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("finish failed: status %d", resp.StatusCode)
	}
	return nil
}
