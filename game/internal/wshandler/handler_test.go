package wshandler

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func makeToken(secret string, userID any) string {
	claims := jwt.MapClaims{"user_id": userID, "exp": time.Now().Add(time.Hour).Unix()}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(secret))
	return signed
}

func TestVerifyToken(t *testing.T) {
	h := NewHandler(nil, "shared-secret")

	t.Run("文字列のuser_idからユーザーIDを取得できる", func(t *testing.T) {
		got, err := h.verifyToken(makeToken("shared-secret", "38"))
		if err != nil || got != "38" {
			t.Errorf("got=%q err=%v", got, err)
		}
	})

	t.Run("数値のuser_idを文字列として取得できる", func(t *testing.T) {
		got, err := h.verifyToken(makeToken("shared-secret", 38))
		if err != nil || got != "38" {
			t.Errorf("got=%q err=%v", got, err)
		}
	})

	t.Run("署名鍵が異なるトークンはエラーになる", func(t *testing.T) {
		if _, err := h.verifyToken(makeToken("wrong-secret", "38")); err == nil {
			t.Error("署名不一致はエラーになるはず")
		}
	})

	t.Run("期限切れのトークンはエラーになる", func(t *testing.T) {
		claims := jwt.MapClaims{"user_id": "38", "exp": time.Now().Add(-time.Hour).Unix()}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signed, _ := token.SignedString([]byte("shared-secret"))
		if _, err := h.verifyToken(signed); err == nil {
			t.Error("期限切れはエラーになるはず")
		}
	})
}
