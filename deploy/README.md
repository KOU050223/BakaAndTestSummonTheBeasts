# Rails API deployment

Rails APIはGitHub Actionsで`linux/arm64`イメージを作成し、GHCR経由でRaspberry Piのrootless Podman Quadletへデプロイする。

## 自動デプロイ

Backend CIは次の順序で実行される。

1. GitHub-hosted runnerでscan、lint、RSpec、デプロイ構成テストを実行する。
2. `main`へのpush時だけ、commit SHAタグ付きarm64イメージをGHCRへpushする。
3. Pi上の専用runnerがイメージをpullし、`db:migrate`を実行する。
4. migration成功後にQuadletを再起動し、`http://127.0.0.1:8000/up`を確認する。
5. health check失敗時は直前イメージへ戻す。

PRではPi runnerを使用しない。

## Piの秘密情報

`~/.config/baka/backend.env`をmode 600で作成する。雛形は[`config/backend.env.example`](config/backend.env.example)にある。

必須項目:

- `RAILS_MASTER_KEY`: Rails credentials復号鍵
- `DATABASE_URL`: Supabase PostgreSQL接続URL
- `JWT_SECRET_KEY`: JWT署名鍵
- `DEMO_ADMIN_PASSWORD`: デモ管理者の初回作成パスワード
- `DEMO_USER_PASSWORD`: 教師・生徒の初回作成共通パスワード
- `FRONTEND_URL=https://bakatest.uomi.site`

Supabaseの`SUPABASE_URL`、publishable key、secret key、JWKS URLはPostgreSQL接続情報ではない。Issue #24の構成ではSupabase Data API/Authを使わないため、RailsのDB接続にはDashboardのConnect画面にあるPostgreSQL URLを使う。

家庭回線がIPv4のみの場合はSession PoolerのURLを選び、`sslmode=require`を付ける。URLにはパスワードが含まれるためGitHub Secretsやリポジトリへ保存しない。

初期配置:

```bash
./deploy/scripts/install-backend.sh
vi ~/.config/baka/backend.env
chmod 600 ~/.config/baka/backend.env
./deploy/scripts/install-backend.sh
```

## 手動確認

```bash
systemctl --user status baka-backend.service
curl --fail http://127.0.0.1:8000/up
cat ~/.local/state/baka/backend-current-sha
podman logs --tail 200 baka-backend
```

## デモデータの初期投入

初回デプロイとmigrationの完了後、Pi上で明示的に一度実行する。
再実行してもレコードは重複しない。既存ユーザーのパスワードは変更しない。

```bash
task deploy:seed:demo
```

標準以外のenvファイルを使う場合は
`DEPLOY_ENV_FILE=/path/to/backend.env task deploy:seed:demo` と指定する。

作成されるログイン用メールアドレスは次のとおり。

- 管理者: `admin@example.com`
- 教師: `teacher@example.com`, `tetsujin@example.com`
- 生徒例: `kirishima@example.com`

8000番がlocalhostだけにbindされていることは次で確認する。

```bash
ss -lnt | grep ':8000'
```

## 手動デプロイ

GHCRへログイン済みのPi上でcommit SHAを指定する。

```bash
./deploy/scripts/deploy-backend.sh <40-character-commit-sha>
```

スクリプトはDB schemaを自動で巻き戻さない。migrationは旧・新両バージョンと互換性を保つexpand/contract方式で作成する。

# Game WebSocket server deployment

GoのゲームWebSocketサーバーもRails APIと同じ仕組みでデプロイする。GitHub Actionsで`linux/arm64`イメージを作成し、GHCR経由でPiのrootless Podman Quadletへ配る。

## 自動デプロイ

Game CIは次の順序で実行される。

1. GitHub-hosted runnerでformat、lint、race付きテスト、build、デプロイ構成テストを実行する。
2. `main`へのpush時だけ、commit SHAタグ付きarm64イメージをGHCRへpushする。
3. Pi上の専用runnerがイメージをpullする（DB migrationは無い）。
4. Quadletを再起動し、`http://127.0.0.1:8080/healthz`を確認する。
5. health check失敗時は直前イメージへ戻す。

ゲームサーバーは`Network=host`で動かし、同じPi上のbackend（`127.0.0.1:8000`）とRedis（`127.0.0.1:6379`）へループバック経由で到達する。外部には直接公開せず、`HOST=127.0.0.1`でbindしてリバースプロキシ経由で公開する。

## Piの秘密情報

`~/.config/baka/game.env`をmode 600で作成する。雛形は[`config/game.env.example`](config/game.env.example)にある。

必須項目:

- `JWT_SECRET_KEY`: backendと共有するJWT署名鍵（`backend.env`と同じ値）
- `INTERNAL_API_SECRET`: backendと共有するInternal APIシークレット（`backend.env`と同じ値）

`RAILS_INTERNAL_URL`は既定で`http://127.0.0.1:8000`を指す。

初期配置:

```bash
./deploy/scripts/install-game.sh
vi ~/.config/baka/game.env
chmod 600 ~/.config/baka/game.env
./deploy/scripts/install-game.sh
```

## 手動確認

```bash
systemctl --user status baka-game.service
curl --fail http://127.0.0.1:8080/healthz
cat ~/.local/state/baka/game-current-sha
podman logs --tail 200 baka-game
```

## 手動デプロイ

GHCRへログイン済みのPi上でcommit SHAを指定する。

```bash
./deploy/scripts/deploy-game.sh <40-character-commit-sha>
```
