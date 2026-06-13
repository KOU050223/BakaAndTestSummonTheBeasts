# バックエンド設計

> 試験召喚システム Rails REST API のバックエンド構造を定義する。
> [ドメイン用語](./domain/README.md)・[API詳細設計](./apiSpec.md)・[開発計画](./dev-plan.md) を前提とする。
> 既存の型安全API基盤（DTO/UseCase/Serializer, commit `cb3ee08`）を踏襲・拡張する方針。

---

## 1. 設計の核

このプロダクトのバックエンドは、一言でいうと **「点数を正本とし、召喚獣ステータスを派生させる計算サーバー」** である。

```
教師が点数を登録
  └─ Score（正本・永続）
        └─ SummonStatus を再計算（派生・点数から導出）
              └─ Battle 開始時にスナップショットとして固定
```

- **Score が正本**：RailsとPostgreSQLに保存された点数が唯一の真実。
- **SummonStatus は派生**：点数から計算で導出される。点数登録のたびに再計算する。
- **Battle はスナップショット**：開始時のステータス（`initial_hp` 等）を固定保存し、後から点数が変わっても過去バトルの整合性を保つ。

この「点数登録 → 召喚獣ステータス再計算」の一連がドメインの中心ロジックであり、トランザクション境界・テストの主対象になる。

---

## 2. 境界づけられたコンテキストと依存方向

```
[Account]   認証/ロールの基盤。全コンテキストが参照する
    │
[Classroom] 生徒/教師/クラス/所属
    │
[Exam]      試験/科目/点数 ── 点数が正本
    │ 点数更新イベント
    ▼
[Summon]    召喚獣ステータス ── 点数から計算される派生データ
    │ バトル開始時データ
    ▼
[Battle]    バトル/ターン/勝敗 ── Go=一時状態, Rails=永続結果
```

依存は上から下への一方向を原則とする。下位コンテキスト（Battle）が上位（Exam）を参照することはあっても、逆は持たない。

---

## 3. 集約（Aggregate）

| 集約ルート | 含む子 | 主な不変条件 |
|---|---|---|
| `User` | — | `role ∈ {student, teacher, school_admin}` |
| `SchoolClass` | `ClassMembership` | 生徒は1クラス所属（`class_memberships.user_id` に unique 制約） |
| `Exam` | `Score`（複数） | 1試験=1科目、満点は100点換算、`(exam_id, student_id)` 一意 |
| `SummonStatus` | — | `(student_id, subject)` 一意、点数から導出 |
| `Battle` | `BattlePlayer`, `BattleLog` | 開始時ステータスをスナップショット、`status` 遷移は waiting→（in_progress）→finished |

> スキーマ上 `battle_players` が `initial_hp/initial_attack/initial_defense/initial_speed` を持つのは、バトル開始時点のステータスを固定するスナップショット設計。これにより点数変動と過去バトルの整合性が独立する。

---

## 4. レイヤ構成

既存の `Auth::Login`（UseCase）/ `Auth::LoginInput`（Input DTO）/ `UserSerializer`（出力DTO）パターンを全コンテキストへ展開する。

```
app/
  controllers/
    api/              # 公開REST API。薄く保つ：Input検証 → UseCase呼出 → Serializer
    internal/         # ★新規。Go Game Server専用。共有シークレットで認証
  inputs/<context>/   # 入力DTO。ActiveModelでバリデーション責務を持つ
  use_cases/<context>/# ユースケース。トランザクション境界を持つ
  domain/<context>/   # ★新規。純粋なドメインロジック（計算式・Value Object）。ActiveRecord非依存
                      #   zeitwerk規約に従い app/domain がオートロードルート。
                      #   例: app/domain/summon/status_calculator.rb => Summon::StatusCalculator
                      #   （集約モデル SummonStatus とは別名前空間で衝突しない）
  serializers/        # 出力DTO
  models/             # ActiveRecord（集約ルート）。関連と最小限のバリデーション
  services/           # 横断的サービス（JwtService 等）
```

### 各レイヤの責務

| レイヤ | 責務 | やらないこと |
|---|---|---|
| Controller | HTTP入出力、認証/認可、Input/UseCase/Serializerの結線 | ビジネスロジック、DB直接操作 |
| Input | リクエストパラメータの検証（型・必須・範囲） | 永続化、ドメイン計算 |
| UseCase | ユースケースの手続き、トランザクション境界 | HTTP知識、複雑な計算式の直書き |
| Domain | 純粋な計算・判定（ステータス計算、ダメージ計算等） | DB・HTTP・Railsフレームワーク依存 |
| Serializer | レスポンスJSONの構築 | ビジネスロジック |
| Model | 永続化、関連、DB整合性レベルのバリデーション | ユースケース手続き |

> **方針**：召喚獣ステータス計算のようなドメインの中核ロジックは UseCase に直書きせず、`app/domain/` の純粋関数（PORO/Value Object）へ切り出す。UseCase の肥大化を防ぎ、計算式を単体テスト・差し替え可能にする。

---

## 5. ドメインルール（確定事項）

2026-06-13 の方針決定で以下を確定した。

### 5.1 召喚獣ステータス計算式（単純な一次式で開始）

100点換算したスコア `s`（0〜100）から、`app/domain/summon/status_calculator.rb` で計算する。係数は後続フェーズのバランス調整で差し替え可能なよう定数化する。

| ステータス | 式 | s=0 | s=82 | s=100 |
|---|---|---|---|---|
| HP | `100 + round(s * 0.5)` | 100 | 141 | 150 |
| 攻撃 (attack) | `round(s * 0.4)` | 0 | 33 | 40 |
| 防御 (defense) | `round(s * 0.15)` | 0 | 12 | 15 |
| 素早さ (speed) | `round(s * 0.1)` | 0 | 8 | 10 |

- HPは下限100を保証し、最弱でも一定のバトル成立を担保する。
- 攻撃/防御/素早さは0始まり（点数なし=0点なら最弱）。

### 5.2 点数未登録の生徒のバトル参加（0点扱いの仮ステータスで参加可）

- バトル作成時、対戦科目の `SummonStatus` が存在しない生徒は **0点扱い** の仮ステータス（上表 s=0 の値、HP=100/攻撃=0/防御=0/素早さ=0）で参加させる。
- これによりバトル作成は点数登録の有無に依存せず成立する。
- 仮ステータスでもスナップショットとして `battle_players` に保存する。

---

## 6. コンテキスト別 実装計画（MVP）

### 6.1 Account（ほぼ完成）

| 種別 | 実装 | 状態 |
|---|---|---|
| Controller | `Api::AuthController#login` | ✅ 実装済 |
| Controller | `Api::UsersController#me`（`GET /api/me`） | 確認/整備 |
| Input | `Auth::LoginInput` | ✅ 実装済 |
| UseCase | `Auth::Login` | ✅ 実装済 |
| Serializer | `UserSerializer` | ✅ 実装済 |
| Service | `JwtService` | ✅ 実装済 |

認可の共通化として、`Api::BaseController` に `require_role!(*roles)` を追加し、各Controllerで `before_action` 指定できるようにする。

### 6.2 Classroom

| 種別 | 実装 | エンドポイント |
|---|---|---|
| Controller | `Api::ClassesController#index` | `GET /api/classes` |
| Controller | `Api::Classes::StudentsController#index` | `GET /api/classes/:id/students` |
| Serializer | `SchoolClassSerializer`, `StudentSerializer` | — |

権限: 一覧系は教師ロール必須。

### 6.3 Exam（中核）

| 種別 | 実装 | エンドポイント |
|---|---|---|
| Controller | `Api::ExamsController#index/#create` | `GET/POST /api/exams` |
| Controller | `Api::Exams::ScoresController#index/#create` | `GET/POST /api/exams/:id/scores`（一括） |
| Input | `Exam::CreateInput`（title/subject/class_id/max_score） | — |
| Input | `Exam::RegisterScoresInput`（exam_id + scores[]、0〜max_score検証） | — |
| UseCase | `Exam::Create` | — |
| UseCase | `Exam::RegisterScores` ← **点数一括登録 + Summon再計算をトランザクションで一括** | — |
| Serializer | `ExamSerializer`, `ScoreSerializer` | — |

`Exam::RegisterScores` がこのプロダクトの心臓部。`ActiveRecord::Base.transaction` 内で Score を upsert し、対象生徒の対象科目について `Summon::Recalculate` を呼ぶ。

### 6.4 Summon（派生）

| 種別 | 実装 | エンドポイント |
|---|---|---|
| Domain | `Summon::StatusCalculator`（点数→HP/攻撃/防御/素早さの純粋関数） | — |
| UseCase | `Summon::Recalculate`（科目の最新点数を取得しSummonStatusをupsert） | — |
| Controller | `Api::StudentsController#summon` | `GET /api/students/:id/summon` |
| Serializer | `SummonStatusSerializer` | — |

「該当科目で直近に受けたテストの点数」を使うため、`Score` を `exams.subject` で絞り `exams.created_at` の最新を採る。
`scores.created_at` は不採用（後追い入力・修正で過去試験が「最新」になるバックフィル問題を回避するため）。

### 6.5 Battle

| 種別 | 実装 | エンドポイント |
|---|---|---|
| Controller | `Api::BattlesController#index/#create/#result` | `GET/POST /api/battles`, `GET /api/battles/:id/result` |
| Controller | `Internal::BattlesController#start_data/#finish` | `GET /internal/battles/:id/start-data`, `POST /internal/battles/:id/finish` |
| Input | `Battle::CreateInput`（subject_id + player_ids[2]） | — |
| Input | `Battle::FinishInput`（winner_id/loser_id/turn_count/logs[]） | — |
| UseCase | `Battle::Create`（開始時ステータスをスナップショット保存。未登録は0点仮ステータス） | — |
| UseCase | `Battle::Finish`（**冪等**：finished後の再POSTを拒否、勝敗確定後の状態変更禁止） | — |
| Serializer | `BattleSerializer`, `BattleStartDataSerializer`, `BattleResultSerializer` | — |

`Internal::BaseController` は共有シークレット（ヘッダ等）で認証し、公開APIとは別系統にする。具体方式は未決（§8）。

---

## 7. 横断的関心事

- **認可**：`Api::BaseController#require_role!` でロール制御。本人以外の成績参照制限もここで担保。
- **トランザクション**：点数登録→Summon再計算、バトル結果保存は UseCase 内で `transaction` を張る。
- **冪等性**：`Battle::Finish` は同一バトルへの再通知を安全に無視/拒否する。
- **エラー形式**：[apiSpec.md §6](./apiSpec.md) のエラー形式に統一（`error.code/message/details`）。Input検証エラーは 422。
- **Go-Rails境界**：Goは常にRails internal API経由。GoからDBへ直接接続しない。

---

## 8. 未決事項（実装前に詰める）

| 項目 | 内容 | 影響 |
|---|---|---|
| Internal API認証 | Go-Rails間の共有シークレット方式（固定ヘッダ / 署名 / 短命トークン） | `Internal::BaseController` |
| ~~最新点数の定義~~ | ~~「直近のテスト」を `exams.created_at` 基準にするか `scores.created_at` 基準にするか~~ | **確定**：`exams.created_at` 基準で実装済み（`Summon::Recalculate`）。後追い入力時のバックフィル問題を回避するため。 |
| バトル待機の見せ方 | 相手未入室時のポーリング有無（フロント主導だがAPI影響あり） | `GET /api/battles/:id` の要否 |
| ターン行動順 | 素早さ反映 or 交互固定（主にGo側、Railsはstart-dataで素早さを渡すだけ） | start-data仕様 |

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-06-13 | 初版作成。ドメイン整理を踏まえたレイヤ構成・コンテキスト別実装計画を定義。計算式と点数未登録時の扱いを確定。 |
</content>
</invoke>
