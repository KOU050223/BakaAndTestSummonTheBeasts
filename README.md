# プロジェクトの全体図

## 環境構築

### 前提

Nix Flakes を使用して環境構築を行います。Nix および direnv の環境が整っている場合、以下のコマンドを実行してください。

```bash
# これで自動的に .envrc が読み込まれる
direnv allow

# 明示的に環境に入る場合
nix develop
```

#### Nix

windows であれば WSL を使用することを推奨します。WSL 上で Nix をインストールしてください。

### SETUP

```bash
direnv allow
task install
task dev
```

フロントエンド：http://127.0.0.1:3000
バックエンド：http://127.0.0.1:8000

## 便利コマンド

開発に必要なコマンドは `taskfile.yml`に定義をします。
ターミナルで`task`と入力することで、定義されているコマンドの一覧が表示されます。
