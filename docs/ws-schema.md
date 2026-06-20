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
      "teamId": "1",                  // 所属チーム（クラス）。N:N の陣営。1:1 は空文字
      "leader": false,                // チームリーダーか
      "defeated": false,              // 戦闘不能（HP0で場から除外）か。true は描画しない
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

あるチームの全員が脱落し、生存チームが1つになった時点で送る
（1:1 では各プレイヤーが独立チーム扱い）。

```jsonc
{
  "type": "finished",
  "winnerTeam": "1",  // 勝者チーム（クラス）。1:1 では空文字になりうる
  "loserTeam": "2",   // 敗者チーム
  "winnerId": "38",   // 後方互換：勝者チームの代表プレイヤーID
  "loserId": "39"     // 後方互換：敗者チームの代表プレイヤーID
}
```

## ダメージ・判定ルール（サーバー権威）

- 攻撃命中: `距離 ≤ レンジ` かつ `相手が攻撃者の正面角度内（向きの内積 > 閾値）`。
- ダメージ: `max(1, attack - defense)`。
- 移動速度・攻撃クールタイム: 素早さに比例 / 反比例。
- フィールド外では召喚・攻撃ともに不可。
- 脱落: 手持ちのどれか1科目の HP が 0 になったプレイヤーは戦闘不能となり、
  以降は移動・召喚・攻撃ができず、他プレイヤーの攻撃対象にもならない（場から除外）。
- 勝敗: 生存プレイヤーのいるチームが1つ以下になった時点で決着。
  残った1チームの勝ち（全チーム同時全滅なら勝者なしの引き分け）。
- 攻撃対象は自分以外の全員（味方含む・脱落者を除く）で、範囲内の最も近い1体に命中する。
```
