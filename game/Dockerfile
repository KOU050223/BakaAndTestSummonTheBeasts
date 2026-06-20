# syntax=docker/dockerfile:1
# check=error=true

# 本番用 Dockerfile。リポジトリルートをコンテキストにしてビルドする。
#   docker build -t game -f game/Dockerfile .
#   docker run -d -p 8080:8080 --env-file game/.env --name game game

# go.mod の go ディレクティブとバージョンを合わせる
ARG GO_VERSION=1.26
ARG VCS_REF=unknown

FROM docker.io/library/golang:${GO_VERSION}-bookworm AS build

WORKDIR /src

# 依存解決のキャッシュ効率を上げるため、先に go.mod / go.sum をコピーする
COPY game/go.mod game/go.sum ./
RUN go mod download

# アプリケーションコードをコピー
COPY game/ ./

# CGO 無効で静的バイナリをビルドする（distroless で動かすため）
ARG TARGETOS
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-arm64} \
    go build -trimpath -ldflags="-s -w" -o /out/game-server ./cmd/server

# 実行用の最小イメージ
FROM gcr.io/distroless/static-debian12:nonroot

ARG VCS_REF
LABEL org.opencontainers.image.source="https://github.com/KOU050223/BakaAndTestSummonTheBeasts" \
      org.opencontainers.image.revision=$VCS_REF

WORKDIR /app
COPY --from=build /out/game-server /app/game-server

# distroless:nonroot は uid/gid 65532 で実行される
USER 65532:65532

EXPOSE 8080
ENTRYPOINT ["/app/game-server"]
