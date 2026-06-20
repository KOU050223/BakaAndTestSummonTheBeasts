# Rails API Raspberry Pi 自動デプロイ設計

## 目的

Issue #24 の第1段階として、Rails API の本番OCIイメージをGitHub Actionsでビルドし、GHCRを経由してRaspberry Piへ安全に自動デプロイできる状態を作る。

今回の完了条件は、`main`への対象変更のpush後に、テスト済みの`linux/arm64`イメージがRaspberry Piへ配備され、`http://127.0.0.1:8000/up`が200を返すことである。Supabase、Active StorageのS3設定、Cloudflare Tunnelの公開設定、FrontendのVercelデプロイ、Go game serverは対象外とする。

## 採用方式

Podman QuadletとPi上のデプロイスクリプトを組み合わせる。

- GitHub Actionsは、テスト、イメージのビルドとpush、Pi上のデプロイスクリプトの起動を担当する。
- デプロイスクリプトは、pull、migration、イメージ切替、サービス再起動、health check、失敗時のロールバックを担当する。
- QuadletはRailsコンテナの定常状態とsystemdによる自動起動を担当する。

GitHub Actionsへ全手順を直書きする方式は、復旧処理の検証とローカル実行が難しくなるため採用しない。Podmanの自動更新機能は、DB migrationとの順序制御およびhealth check後のロールバックに適さないため採用しない。

## 全体フロー

1. Backendまたはデプロイ関連ファイルが`main`へpushされる。
2. GitHub-hosted runnerで既存のsecurity scan、lint、testを実行する。
3. 全チェック成功後、GitHub-hosted runnerでDocker Buildxを使い、Railsイメージを`linux/arm64`向けにビルドする。
4. イメージを`ghcr.io/kou050223/baka-and-test-summon-the-beasts-backend:<commit-sha>`としてGHCRへpushする。
5. このリポジトリ専用のself-hosted runnerでdeploy jobを起動する。
6. deploy jobは一時的なGHCR認証を行い、Pi上のデプロイスクリプトへcommit SHAを渡す。
7. スクリプトは対象イメージをpullし、本番環境変数を渡した一時コンテナで`bin/rails db:migrate`を実行する。
8. migration成功後、対象イメージをローカルの`localhost/baka-backend:current`へ付け替え、Quadletサービスを再起動する。
9. `http://127.0.0.1:8000/up`を一定時間リトライする。
10. 成功時は稼働SHAを記録する。失敗時は`previous`へ保持した直前イメージを`current`へ戻し、サービスを再起動して再度health checkする。

## リポジトリへ追加する構成

### GitHub Actions

既存のBackend CIを拡張し、push時だけbuildとdeployを追加する。

- PRではGitHub-hosted runner上のscan、lint、testだけを実行する。
- buildは`main`へのpushで、先行チェックがすべて成功した場合だけ実行する。
- deployはbuild成功後だけ、`[self-hosted, Linux, ARM64, raspi-home, production]`ラベルを持つrunnerで実行する。
- workflowには`packages: write`をbuild jobだけに、`packages: read`をdeploy jobだけに付与する。
- 同時デプロイを防ぐためproduction用concurrency groupを設定する。
- forkを含むPR、`pull_request_target`、手動入力された任意イメージではself-hosted runnerを起動しない。

### Rails本番イメージ

既存`backend/Dockerfile`をRaspberry Piで動作する形へ調整する。

- Buildxで`linux/arm64`をビルドできることをCIで確認する。
- コンテナ内部のPumaは8000番でlistenする。
- ホスト側はQuadletのpublish設定により`127.0.0.1:8000`だけへbindする。
- イメージにはcommit SHAをOCI labelとして埋め込み、GHCRのタグと合わせて稼働バージョンを追跡可能にする。
- コンテナ起動時の暗黙的なmigrationには依存せず、デプロイスクリプトが明示的にmigrationを先行実行する。

### Quadlet

追跡対象のQuadlet定義を`deploy/quadlet/`へ置き、PiのユーザーQuadletディレクトリへ配置する。

- イメージ: `localhost/baka-backend:current`
- コンテナ名: `baka-backend`
- ポート: `127.0.0.1:8000:8000`
- 環境変数: Pi上の権限制限付きenvファイル
- restart policy: failure時に再起動
- ログ: journaldを使用し、サイズ上限を設定してmicroSDへの無制限な書き込みを防ぐ
- lingerは既に有効だが、セットアップ時に検証する

### デプロイスクリプト

`deploy/scripts/deploy-backend.sh`を追跡し、commit SHAを必須引数とする。

スクリプトは次を満たす。

- strict modeで動作し、不正なSHAや必要ファイル不足を開始時に拒否する。
- migration前は稼働コンテナを停止しない。
- migration失敗時はイメージ切替を行わず終了する。
- `current`を`previous`へ保存してから新イメージへ切り替える。
- health check成功時だけ稼働SHAを状態ファイルへ原子的に記録する。
- health check失敗時は直前イメージへ戻し、ロールバック結果も明確な終了コードとログで返す。
- `podman image prune`は今回のデプロイ処理に含めず、稼働中と直前の2世代を確実に残す。定期削除は後続タスクとする。

## Raspberry Piのセットアップ

Piへこのリポジトリ専用のGitHub Actions runnerを追加し、既存の`hackathon_nulabcup` runnerとは別サービスとして運用する。

- runnerは専用ディレクトリへ配置する。
- runnerはリポジトリスコープで登録し、`raspi-home`と`production`ラベルを付ける。
- runnerサービスとQuadletは現在の非rootデプロイユーザーで動作させる。
- 本番envファイルはリポジトリ外に置き、mode 600とする。
- GHCR資格情報は固定ファイルへ保存せず、deploy jobの短命な`GITHUB_TOKEN`でログインする。

## 環境変数と秘密情報

本番envファイルには少なくとも次を持たせる。

- `RAILS_ENV=production`
- `RAILS_MASTER_KEY`
- `DATABASE_URL`またはDB接続用の個別変数
- `JWT_SECRET_KEY`
- `FRONTEND_URL=https://baka.uomi.site`
- `RAILS_LOG_LEVEL=info`

実際の秘密値はGit、workflowログ、設計書へ記録しない。Supabase未準備の間は、試験用PostgreSQL接続情報を明示的に用意する必要がある。SQLiteやPi上の一時DBへ暗黙にフォールバックさせない。

## エラー処理とロールバック境界

- build失敗: GHCRへpushせず、deployを起動しない。
- migration失敗: 現行サービスを維持し、deployを失敗させる。
- サービス起動またはhealth check失敗: 直前イメージへ戻して再起動する。
- ロールバック後のhealth checkも失敗: 自動復旧不能としてdeployを失敗させ、systemdとコンテナログの確認手順を表示する。
- DB schemaは自動的には巻き戻さない。migrationは旧・新両バージョンが動くexpand/contract方式の後方互換変更を前提とする。

## テスト方針

- デプロイスクリプトはPodmanとsystemctlをスタブ化できる構造にし、正常系、migration失敗、health check失敗、rollback失敗をシェルテストで検証する。
- Quadletは`podman-system-generator --dryrun`相当の方法で構文を検証する。
- DockerfileはローカルまたはCIで`linux/arm64`ビルドを実行する。
- workflowはactionlintで構文と式を検証する。
- Piへの初回配備では、サービス有効化、再起動後の自動起動、localhost以外へ8000番が公開されていないことを確認する。
- 自動デプロイの受け入れ確認として、検証用commitを`main`へ反映し、GHCRのSHA、Piの状態ファイル、`/up`の200が一致することを確認する。

## 今回の受け入れ条件

- Rails本番イメージが`linux/arm64`向けにビルドできる。
- commit SHAタグ付きイメージがGHCRへ保存される。
- Pi上でRailsがrootless Quadletにより管理される。
- Piの再起動後もRailsが自動起動する。
- Railsはホストの`127.0.0.1:8000`だけでlistenする。
- migration成功後だけ新イメージへ切り替わる。
- health check失敗時に直前イメージへ戻る。
- `main`へのpushから自動デプロイまで完了する。
- PRではself-hosted runnerと本番秘密情報を使用しない。
- 稼働中のcommit SHAをGHCRタグとPi上の状態から特定できる。

## 対象外

- Supabaseプロジェクト、DBユーザー、Storage bucketの作成
- Active StorageのS3互換API設定
- Cloudflare Tunnelの公開hostname追加
- VercelおよびFrontend環境変数の設定
- Go game serverのイメージとQuadlet
- 長期的なイメージ削除ジョブとバックアップ運用
