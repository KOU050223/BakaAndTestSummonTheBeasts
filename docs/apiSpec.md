# API詳細設計

> 本ドキュメントは「試験召喚システム」のAPI設計をまとめたものです。Rails REST APIを永続データの正本、Go Game Serverを対戦中の一時状態管理として分離します。

---

## 1. API設計方針

### 1.1 全体方針

- Rails APIは、ユーザー・クラス・試験・点数・召喚獣・バトル履歴など、永続化されるデータを管理する
- PostgreSQLへの接続とDBマイグレーションはRailsバックエンドが一任する
- Go Game Serverは、WebSocketによる1対1バトルの一時状態だけを管理する
- Go Game ServerはPostgreSQLを直接操作しない
- Go Game Serverが必要な永続データを取得・保存する場合は、Railsのinternal APIを利用する
- MVPでは、HP・ターン・行動・フェーズの同期に限定し、3D位置同期や複雑なマッチングは扱わない

### 1.2 システム境界

```txt
[React Frontend]
  |
  | REST
  v
[Rails API]
  |
  | PostgreSQL
  v
[DB]

[React Battle UI]
  |
  | WebSocket
  v
[Go Game Server]
  |
  | internal REST
  v
[Rails API]
  |
  v
[PostgreSQL]
```

---

## 2. 認証

### 2.1 認証方式

RailsがJWTを発行し、React FrontendはREST API呼び出しとWebSocket接続時にJWTを送信します。

```txt
1. ReactがRailsにログイン
2. RailsがJWTを発行
3. ReactがREST API呼び出し時にJWTを送信
4. ReactがWebSocket接続時にJWTを送信
5. GoがJWTを検証し、userIdを特定する
```

### 2.2 REST API認証ヘッダー

```http
Authorization: Bearer <jwt>
```

### 2.3 WebSocket接続例

```txt
ws://game-server/ws/battle?token=xxxxx&battleId=yyyyy
```

---

## 3. Rails REST API

Railsは「正しいデータを管理するサーバー」として、永続化されるデータを扱います。

### 3.1 ユーザー情報

#### `GET /api/me`

ログイン中のユーザー情報を取得します。

レスポンス例:

```json
{
  "id": "user_1",
  "name": "山田太郎",
  "role": "student",
  "classId": "class_a"
}
```

---

### 3.2 クラス一覧

#### `GET /api/classes`

クラス一覧を取得します。

レスポンス例:

```json
{
  "classes": [
    {
      "id": "class_a",
      "name": "Aクラス"
    }
  ]
}
```

---

### 3.3 試験一覧

#### `GET /api/exams`

試験一覧を取得します。

レスポンス例:

```json
{
  "exams": [
    {
      "id": "exam_1",
      "title": "数学 小テスト1",
      "subjectId": "math",
      "createdBy": "teacher_1"
    }
  ]
}
```

---

### 3.4 試験作成

#### `POST /api/exams`

教師が試験を作成します。

リクエスト例:

```json
{
  "title": "数学 小テスト1",
  "subjectId": "math",
  "classId": "class_a",
  "maxScore": 100
}
```

レスポンス例:

```json
{
  "id": "exam_1",
  "title": "数学 小テスト1",
  "subjectId": "math",
  "classId": "class_a",
  "maxScore": 100
}
```

---

### 3.5 点数登録

#### `POST /api/scores`

教師が生徒の点数を登録します。登録後、Rails側で召喚獣ステータスを再計算します。

リクエスト例:

```json
{
  "examId": "exam_1",
  "scores": [
    {
      "studentId": "user_1",
      "score": 82
    },
    {
      "studentId": "user_2",
      "score": 74
    }
  ]
}
```

レスポンス例:

```json
{
  "examId": "exam_1",
  "registeredCount": 2
}
```

---

### 3.6 召喚獣ステータス取得

#### `GET /api/students/:id/summon`

指定した生徒の召喚獣ステータスを取得します。

レスポンス例:

```json
{
  "studentId": "user_1",
  "summon": {
    "hp": 120,
    "attack": 30,
    "defense": 10,
    "speed": 5
  }
}
```

---

### 3.7 バトル作成

#### `POST /api/battles`

React Frontendからバトルを作成します。作成後、React Battle UIはGo Game ServerのWebSocketへ接続します。

リクエスト例:

```json
{
  "subjectId": "math",
  "playerIds": ["user_1", "user_2"]
}
```

レスポンス例:

```json
{
  "battleId": "battle_1",
  "subjectId": "math",
  "status": "waiting"
}
```

---

### 3.8 バトル結果取得

#### `GET /api/battles/:id/result`

バトル結果を取得します。

レスポンス例:

```json
{
  "battleId": "battle_1",
  "winnerId": "user_1",
  "loserId": "user_2",
  "turnCount": 6,
  "logs": [
    {
      "turn": 1,
      "actorId": "user_1",
      "action": "attack",
      "targetId": "user_2",
      "damage": 24
    }
  ]
}
```

---

## 4. Rails Internal API

Internal APIはGo Game Serverからのみ利用する想定です。外部クライアントには公開しません。

### 4.1 バトル開始データ取得

#### `GET /internal/battles/:battle_id/start-data`

Go Game Serverがバトル開始時に、プレイヤー情報・科目・召喚獣ステータスを取得します。

レスポンス例:

```json
{
  "battleId": "battle_1",
  "subject": "math",
  "players": [
    {
      "userId": "user_1",
      "name": "Aさん",
      "summon": {
        "hp": 120,
        "attack": 30,
        "defense": 10,
        "speed": 5
      }
    },
    {
      "userId": "user_2",
      "name": "Bさん",
      "summon": {
        "hp": 100,
        "attack": 40,
        "defense": 5,
        "speed": 7
      }
    }
  ]
}
```

### 4.2 バトル終了通知

#### `POST /internal/battles/:battle_id/finish`

Go Game Serverがバトル終了時に、勝敗とログをRailsへ送信します。

リクエスト例:

```json
{
  "winnerId": "user_1",
  "loserId": "user_2",
  "turnCount": 6,
  "logs": [
    {
      "turn": 1,
      "actorId": "user_1",
      "action": "attack",
      "targetId": "user_2",
      "damage": 24
    }
  ]
}
```

レスポンス例:

```json
{
  "battleId": "battle_1",
  "status": "finished"
}
```

---

## 5. Go Game Server WebSocket API

Go Game Serverは、対戦中の一時状態をメモリ上で管理します。

### 5.1 エンドポイント

```txt
/ws/match
/ws/battle/:battleId
```

### 5.2 Go側で保持する一時状態

```txt
rooms
players
currentTurn
hp
actions
connectedClients
```

### 5.3 状態同期メッセージ

MVPで同期するデータは、HP・ターン・行動・フェーズに限定します。

```json
{
  "type": "state",
  "turn": 3,
  "phase": "selecting",
  "players": {
    "user_1": { "hp": 80, "actionLocked": false },
    "user_2": { "hp": 60, "actionLocked": true }
  }
}
```

### 5.4 行動選択メッセージ

React Battle UIからGo Game Serverへ、プレイヤーの行動を送信します。

```json
{
  "type": "action",
  "battleId": "battle_1",
  "actorId": "user_1",
  "action": "attack",
  "targetId": "user_2"
}
```

### 5.5 バトル終了メッセージ

Go Game ServerからReact Battle UIへ、バトル終了を通知します。

```json
{
  "type": "finished",
  "battleId": "battle_1",
  "winnerId": "user_1",
  "loserId": "user_2"
}
```

---

## 6. エラーレスポンス

REST APIのエラーは以下の形式に統一します。

```json
{
  "error": {
    "code": "validation_error",
    "message": "入力内容を確認してください",
    "details": {
      "score": ["0以上100以下で入力してください"]
    }
  }
}
```

代表的なHTTPステータス:

| ステータス | 用途 |
|---|---|
| 400 | リクエスト形式が不正 |
| 401 | 未認証 |
| 403 | 権限不足 |
| 404 | リソースが存在しない |
| 422 | バリデーションエラー |
| 500 | サーバー内部エラー |

---

## 7. MVPで扱わないこと

- GoからDBを直接操作する
- 本格的な3D位置同期を行う
- 物理演算バトルを行う
- 複雑なマッチングを行う
- 多人数同時戦争を行う
