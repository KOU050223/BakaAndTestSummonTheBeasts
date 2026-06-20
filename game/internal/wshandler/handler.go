package wshandler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

// Handler は WebSocket バトル接続を捌く gin ハンドラ。
type Handler struct {
	registry  *Registry
	jwtSecret string
	upgrader  websocket.Upgrader
}

// NewHandler は Handler を生成する。jwtSecret は Rails と共有する JWT 署名鍵。
func NewHandler(registry *Registry, jwtSecret string) *Handler {
	return &Handler{
		registry:  registry,
		jwtSecret: jwtSecret,
		upgrader: websocket.Upgrader{
			// 開発簡便のため Origin を許可（本番は要制限）。
			CheckOrigin: func(*http.Request) bool { return true },
		},
	}
}

// Register は gin エンジンにルートを登録する。
func (h *Handler) Register(r *gin.Engine) {
	r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	r.GET("/ws/battle", h.handleBattle)
}

// handleBattle は ws://.../ws/battle?token=<JWT>&battleId=<id> を処理する。
func (h *Handler) handleBattle(c *gin.Context) {
	battleID := c.Query("battleId")
	token := c.Query("token")
	if battleID == "" || token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "battleId and token required"})
		return
	}

	userID, err := h.verifyToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	rt, err := h.registry.getOrCreate(c.Request.Context(), battleID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to init battle"})
		return
	}

	ws, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return // upgrade 失敗時は gorilla 側で応答済み
	}
	rt.addConn(userID, ws)

	h.readLoop(rt, userID, ws)
}

// readLoop は接続から input メッセージを読み続け、最新入力としてルームに反映する。
func (h *Handler) readLoop(rt *roomRuntime, userID string, ws *websocket.Conn) {
	defer func() { _ = ws.Close() }()
	for {
		var msg InputMessage
		if err := ws.ReadJSON(&msg); err != nil {
			return // 切断・不正メッセージで終了
		}
		if msg.Type == "input" {
			rt.setInput(userID, toInput(msg))
		}
	}
}

// verifyToken は JWT を検証して user_id（subject）を返す。
// Rails の JwtService と同じ HS256・user_id クレームを前提とする。
func (h *Handler) verifyToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", jwt.ErrTokenInvalidClaims
	}
	switch v := claims["user_id"].(type) {
	case string:
		return v, nil
	case float64:
		// JSON 数値は float64 で来る。整数IDを文字列化する。
		return jwtNumberToString(v), nil
	default:
		return "", jwt.ErrTokenInvalidClaims
	}
}
