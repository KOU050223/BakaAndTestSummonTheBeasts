# WebSocket メッセージスキーマ（正本）

試召戦争バトルの WebSocket 通信契約。**このファイルが TypeScript（zod）と Go 構造体の整合の正本**。
変更時は両側（`frontend/src/lib/battle/wsSchema.ts` と `game/internal/wshandler/message.go`）を必ず合わせ、PR レビューで突き合わせる。

## 接続

```
ws://<game-server>/ws/battle?token=<JWT>&battleId=<id>
```

- `token`: Rails が発行した JWT。Go は共有シークレットで検証して userId を特定する。
- `battleId`: 対象バトル。Go は Rails Internal API `GET /internal/battles/:id/start-data` で初期化する。

## 同期モデル

- サーバー権威（位置・命中・HP は Go が計算）。
- 固定 tick（30Hz）。毎 tick、全状態のスナップショットを `state` で配信する。
- クライアントは入力の意図のみ送る。補間は MVP では行わない。

## Client → Server

### input（入力状態）

押下状態（move）とトリガー（attack/summon）を送る。tick ごとにサーバーが反映する。

```jsonc
{
  "type": "input",
  "move": { "forward": false, "back": false, "left": false, "right": false },
  "attack": false,   // トリガー（true の tick で攻撃を試みる）
  "summon": false    // トリガー（true の tick で召喚を試みる）
}
```

将来の連続移動（スティック）では `move` を方向ベクトル `{ "dx": number, "dz": number }` に拡張する。

## Server → Client

### state（毎 tick スナップショット）

```jsonc
{
  "type": "state",
  "tick": 120,
  "fields": [
    { "subject": "math", "centerX": 5.0, "centerZ": 0.0, "radius": 3.0 }
  ],
  "players": {
    "38": {
      "x": -1.2, "z": 0.3, "angle": 1.57,
      "currentSubject": "math",      // いるフィールドの科目（中立は null）
      "summoned": true,               // 召喚獣が場に出ているか
      "attacking": false,             // この tick で攻撃を発動したか（攻撃アニメ用）
      "summons": {                    // 科目ごとの残 HP
        "math": { "hp": 142 },
        "english": { "hp": 100 }
      }
    }
  }
}
```

### finished（決着）

いずれかのプレイヤーの、いずれか1科目の HP が 0 になった時点で送る。

```jsonc
{
  "type": "finished",
  "winnerId": "38",
  "loserId": "39"
}
```

## ダメージ・判定ルール（サーバー権威）

- 攻撃命中: `距離 ≤ レンジ` かつ `相手が攻撃者の正面角度内（向きの内積 > 閾値）`。
- ダメージ: `max(1, attack - defense)`。
- 移動速度・攻撃クールタイム: 素早さに比例 / 反比例。
- フィールド外では召喚・攻撃ともに不可。
- 勝敗: 手持ちのどれか1科目の HP が 0 で即敗北。
```
