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
