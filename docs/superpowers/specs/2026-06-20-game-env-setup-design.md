# game 環境変数セットアップ設計

## 目的

Go ゲームサーバーの環境変数を `game/.env` で管理し、`task setup` で開発に必要な `.env` ファイルを安全に用意できるようにする。Rails と Go が共有する署名鍵は自動同期せず、開発者が同じ値を設定する。

## 設定ファイルの責務

- ルート `.env`: PostgreSQL など、ルートタスクと Docker Compose が使う設定
- `backend/.env`: Rails 固有設定と、Go と共有する `JWT_SECRET_KEY`、`INTERNAL_API_SECRET`
- `game/.env`: Go 固有設定と、Rails と共有する `JWT_SECRET_KEY`、`INTERNAL_API_SECRET`

`backend/.env.example` と新規作成する `game/.env.example` には、共有する2つの値を必ず一致させる旨をコメントする。ルート `.env.example` から `JWT_SECRET_KEY` を外し、設定の所有場所を明確にする。

## 起動とセットアップ

`game/Taskfile.yml` の `dev` タスクは、作業ディレクトリ内の `.env` を `dotenv` で読み込んでから Go サーバーを起動する。

ルートの `setup:copy-env` は、次の3組を順に処理する。

1. `.env.example` から `.env`
2. `backend/.env.example` から `backend/.env`
3. `game/.env.example` から `game/.env`

コピー先が存在する場合は上書きしない。処理後、`backend/.env` と `game/.env` の `JWT_SECRET_KEY` および `INTERNAL_API_SECRET` を同じ値へ変更するよう案内する。秘密値の自動生成・自動同期は行わない。

## エラーと安全性

- 既存 `.env` を保持し、利用者の秘密値を破壊しない。
- example の値は開発用プレースホルダーとし、実際の秘密値をリポジトリへ含めない。
- Go サーバーは既存どおり、共有秘密が未設定なら警告を出す。

## 検証

- Taskfile の構文を `task --list` で確認する。
- `.env` がない場合に3ファイルが作成されることを確認する。
- `.env` がある場合に内容が上書きされないことを確認する。
- game のタスク定義が `game/.env` を読み込むことを確認する。

