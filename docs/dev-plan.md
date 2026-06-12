# 開発計画

> 環境構築の現状・機能ごとの技術実装フロー・タスク割り振りをまとめたドキュメント。

---

## 1. 環境構築の現状

| 領域 | 状態 | 詳細 |
|---|---|---|
| **DB (PostgreSQL)** | ✅ 完了 | docker-compose設定済み。全migration・モデル完了 |
| **Backend (Rails)** | 🔄 途中 | Gemfile（jwt・bcrypt含む）・モデル・migration済み。コントローラー・ルーティングは未実装。ログイン機能を実装中 |
| **Frontend (Next.js)** | 🔄 途中 | Next.js + TypeScript + Tailwindのフレームワーク設定済み。実画面は未実装 |
| **Game (Go)** | ❌ 未着手 | `game/` ディレクトリ自体がない |
| **taskfile** | ✅ 完了 | backend・frontend・dbコマンド定義済み（gameタスクは未追加） |
| **Nix環境** | ✅ 完了 | flake.nix・.envrc設定済み |

> **注意:** spec.md では `React + Vite` と記載しているが、実際は **Next.js** に変更済み。spec.md の更新が必要。

---

## 2. 機能ごとの技術・実装フロー

### ログイン

```
Next.js (フォーム入力)
  → Rails POST /api/sessions     # bcryptで認証・JWTを発行
  → JWTをhttpOnlyクッキーに保存  # XSS対策
  → ロールに応じて /student または /teacher へリダイレクト
```

**使用技術:** Next.js / Rails / bcrypt / JWT / PostgreSQL

---

### 試験作成・点数入力（教師）

```
Next.js 教師UI
  → Rails POST /api/exams        # 試験を登録
  → Rails POST /api/scores       # 点数を一括登録
    → Rails内部で召喚獣ステータスを再計算してPostgreSQLに保存
```

**使用技術:** Next.js / Rails / PostgreSQL

---

### 成績・召喚獣ステータス確認（生徒）

```
Next.js 生徒UI
  → Rails GET /api/students/:id/summon   # 召喚獣ステータス取得
  → Rails GET /api/scores?student=me    # 科目別試験履歴取得
```

**使用技術:** Next.js / Rails / PostgreSQL

---

### リアルタイムバトル

```
Next.js バトルUI
  → Rails POST /api/battles              # 教師がバトルを作成
  → Go  WebSocket ws://game-server/ws/battle/:id  # バトル入室
       → Go が Rails GET /internal/battles/:id/start-data を呼ぶ
                                          # プレイヤー情報・召喚獣ステータスを取得
       → Go がターン・HP・フェーズをメモリ上で管理・双方向同期
       → バトル終了時、Go が Rails POST /internal/battles/:id/finish
                                          # 勝敗・ログをRailsへ保存
  → Next.js GET /api/battles/:id/result  # リザルト画面表示
```

**使用技術:** Next.js / Go (WebSocket) / Rails / PostgreSQL

---

### 技術スタック早見表

| 機能 | 担当技術 |
|---|---|
| 画面・UIレンダリング | Next.js (TypeScript) |
| REST API・認証・DB管理 | Rails (Ruby) |
| リアルタイムバトル処理 | Go (WebSocket) |
| データ永続化 | PostgreSQL |
| DB接続・migration | Rails が一任 |
| Goのデータ取得・保存 | Rails internal API 経由（Goは直接DBを操作しない） |

---

## 3. タスク割り振り

### 担当と役割(適当)

| 担当 | 役割 | 使用技術 |
|---|---|---|
| 上級生A | Rails API・認証・DB | Rails / PostgreSQL |
| 上級生B | Goゲームサーバー・WebSocket | Go |
| 初心者A | 教師UI | Next.js |
| 初心者B | 生徒UI・バトルUI | Next.js |

---

### 機能1: 認証・ログイン

| 状態 | 担当 | タスク |
|---|---|---|
| 🔄 進行中 | 上級生A | Rails: ログイン API `POST /api/sessions`（JWT発行・bcrypt認証） |
| 🔄 進行中 | 上級生A | Rails: ユーザー情報 `GET /api/me` |
| ⬜ | 初心者A | Next.js: ログイン画面 `/login` |
| ⬜ | 初心者A/B | Next.js: JWTクッキー管理・ルート保護（未認証リダイレクト・ロール別ガード） |

---

### 機能2: 試験作成・点数入力（教師）

| 状態 | 担当 | タスク |
|---|---|---|
| ⬜ | 上級生A | Rails: クラス一覧 `GET /api/classes` |
| ⬜ | 上級生A | Rails: クラス内生徒一覧 `GET /api/classes/:id/students` |
| ⬜ | 上級生A | Rails: 試験一覧・作成 `GET /api/exams` `POST /api/exams` |
| ⬜ | 上級生A | Rails: 試験別スコア取得 `GET /api/exams/:id/scores` |
| ⬜ | 上級生A | Rails: 点数一括登録 `POST /api/scores`（登録後に召喚獣ステータス再計算） |
| ⬜ | 初心者A | Next.js: 教師ダッシュボード `/teacher` |
| ⬜ | 初心者A | Next.js: 試験作成画面 `/teacher/exams/new` |
| ⬜ | 初心者A | Next.js: 点数入力画面 `/teacher/exams/[id]/scores` |

---

### 機能3: 成績・召喚獣ステータス確認（生徒）

| 状態 | 担当 | タスク |
|---|---|---|
| ⬜ | 上級生A | Rails: 召喚獣ステータス `GET /api/students/:id/summon` |
| ⬜ | 上級生A | Rails: 生徒スコア履歴 `GET /api/scores?student=me`（apiSpec.md未定義） |
| ⬜ | 初心者B | Next.js: 生徒ダッシュボード `/student` |
| ⬜ | 初心者B | Next.js: 成績確認画面 `/student/scores` |

---

### 機能4: リアルタイムバトル

| 状態 | 担当 | タスク |
|---|---|---|
| ⬜ | 上級生A | Rails: バトル作成 `POST /api/battles` |
| ⬜ | 上級生A | Rails: バトル一覧 `GET /api/battles?player=me`（apiSpec.md未定義） |
| ⬜ | 上級生A | Rails: バトル結果 `GET /api/battles/:id/result` |
| ⬜ | 上級生A | Rails: Internal API `GET /internal/battles/:id/start-data` `POST /internal/battles/:id/finish` |
| ⬜ | 上級生B | Go: `game/` ディレクトリ作成・Go module初期化 |
| ⬜ | 上級生B | Go: WebSocketサーバー立ち上げ |
| ⬜ | 上級生B | Go: バトルルーム管理・プレイヤー入室 |
| ⬜ | 上級生B | Go: ターン処理・HP同期 |
| ⬜ | 上級生B | Go: 勝敗判定 |
| ⬜ | 上級生B | Go: Rails internal APIへのバトル結果POST |
| ⬜ | 上級生A・B | Rails/Go: JWT検証の共有シークレット設計（internal API認証） |
| ⬜ | 初心者A | Next.js: バトル作成画面 `/teacher/wars/new` |
| ⬜ | 初心者B | Next.js: バトル画面 `/student/wars/[id]/battle`（WebSocket接続） |
| ⬜ | 初心者B | Next.js: バトル結果画面 `/student/wars/[id]/result` |

---

### 環境・インフラ

| 状態 | 担当 | タスク |
|---|---|---|
| ⬜ | 上級生B | taskfileへのgameタスク追加 |
| ⬜ | 全員 | spec.mdのフレームワーク記述をVite → Next.jsに修正 |

---

## 4. 未決事項（設計上の宿題）

| 項目 | 内容 |
|---|---|
| 召喚獣ステータス計算式 | HP・攻撃・防御・素早さの具体的な計算式が未定。Railsで実装する前に確定が必要 |
| GoとRails間の認証 | internal APIへのアクセス制限方法（共有シークレットなど）が未定 |
| バトル待機画面の挙動 | 相手未入室時にポーリングするか、ボタンを非活性にするだけか未定（screen-flow.md参照） |
| パスワードリセット | MVPに含めるか否か未定 |

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-06-12 | 初版作成 |
