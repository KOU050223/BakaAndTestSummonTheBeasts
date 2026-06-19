# game Taskfile 設計

## 目的

フロントエンド用Taskfileのコピーになっている `game/Taskfile.yml` を、Goゲームサーバーの開発・検証に必要なタスクへ置き換える。

## タスク

- `install-deps`: `go mod download` で依存関係を取得する。
- `dev`: `game/.env` を読み込み、`go run ./cmd/server` でサーバーを起動する。
- `build`: `go build ./cmd/server` でサーバーをビルドする。
- `format`: `gofmt` の適用漏れがあれば失敗する。ファイルは自動変更しない。
- `format:fix`: `gofmt -w` でGoファイルを整形する。
- `lint`: Nix開発環境に含まれる `golangci-lint run ./...` を実行する。
- `test`: `go test ./...` を実行する。
- `test:race`: `go test -race ./...` を実行する。
- `ci`: `format`、`lint`、`test:race`、`build` の順で実行する。

デフォルトタスクはタスク一覧を表示する。TypeScript、pnpm、OpenAPI生成に関するコピー元のタスクは削除する。

## 検証

すべてのGoコマンドはNix開発環境内で実行する。`task --list` で定義を確認し、`task ci` が成功することを完了条件とする。

