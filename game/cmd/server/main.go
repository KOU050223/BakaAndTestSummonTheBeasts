// Command game は試召戦争のリアルタイムバトルを捌く WebSocket サーバー。
// Rails Internal API でバトルを初期化し、固定 tick でゲームを進行する。
package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/railsclient"
	"github.com/KOU050223/BakaAndTestSummonTheBeasts/game/internal/wshandler"
)

func main() {
	port := envOr("PORT", "8080")
	railsURL := envOr("RAILS_INTERNAL_URL", "http://localhost:8000")
	internalSecret := os.Getenv("INTERNAL_API_SECRET")
	jwtSecret := os.Getenv("JWT_SECRET_KEY")

	if internalSecret == "" || jwtSecret == "" {
		log.Println("warning: INTERNAL_API_SECRET / JWT_SECRET_KEY が未設定です（認証・連携が失敗します）")
	}

	rails := railsclient.New(railsURL, internalSecret)
	registry := wshandler.NewRegistry(rails)
	handler := wshandler.NewHandler(registry, jwtSecret)

	r := gin.Default()
	handler.Register(r)

	log.Printf("game server listening on :%s (rails=%s)", port, railsURL)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
