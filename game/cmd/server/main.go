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
	// HOST は bind するアドレス。Network=host で動かす本番では 127.0.0.1 を指定し、
	// 外部に直接公開しない（リバースプロキシ経由で公開する）。空なら全インターフェース。
	host := os.Getenv("HOST")
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

	addr := host + ":" + port
	log.Printf("game server listening on %s (rails=%s)", addr, railsURL)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
