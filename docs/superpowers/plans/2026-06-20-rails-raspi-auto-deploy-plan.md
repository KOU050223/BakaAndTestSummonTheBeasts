# Rails API Raspberry Pi 自動デプロイ実装計画

1. デプロイスクリプトの振る舞いをシェルテストで定義する。
2. テストを満たすpull・migration・切替・health check・rollback処理を実装する。
3. Quadlet、envサンプル、Pi初期セットアップスクリプトを追加し、静的検証テストを追加する。
4. Rails本番イメージを8000番、明示migration、OCI revision labelへ対応させる。
5. Backend CIへarm64 build、GHCR push、Pi deploy jobを追加する。
6. ローカルでシェルテスト、Rails CI、workflow/Dockerfile検証を実行する。
7. Piへ専用runnerとQuadletを配置し、秘密情報を除く構成を検証する。
8. 変更をレビューし、DB接続情報が揃っていれば初回デプロイとhealth checkを実施する。
