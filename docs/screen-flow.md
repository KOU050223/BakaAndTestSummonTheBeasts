# 画面フロー定義

> MVPスコープの画面一覧と遷移を定義する。学校管理者UIはMVP対象外（seedデータで代替）。
> URLパターンは画面遷移図（FigJam）を正とする。将来スコープの画面はURLのみ定義しstubとして残す。

---

## 画面一覧

### 共通

| 画面ID | URL | 画面名 | スコープ | 概要 |
|---|---|---|---|---|
| `login` | `/login` | ログイン | MVP | メールアドレス・パスワードでログイン。ロールに応じて遷移先が変わる |

---

### 生徒

| 画面ID | URL | 画面名 | スコープ | 概要 |
|---|---|---|---|---|
| `student/dashboard` | `/student` | ダッシュボード | MVP | 自分の科目別成績と召喚獣ステータスを確認する。参加可能なバトルがあればバッジ表示 |
| `student/scores` | `/student/scores` | 成績確認 | MVP | 科目別試験履歴の詳細一覧 |
| `student/battle` | `/student/wars/[id]/battle` | バトル | MVP | リアルタイムターン制バトルを行う |
| `student/battle-result` | `/student/wars/[id]/result` | バトル結果 | MVP | バトルの勝敗・ターン数・ログを確認する |
| `student/upload` | `/student/upload` | 答案アップロード | Phase2 (OCR) | 答案画像を撮影・アップロードしてOCR読み取りを依頼する |
| `student/wars/new` | `/student/wars/new` | 宣戦布告 | 将来 | 対戦相手クラス・科目を選択して宣戦布告する |
| `student/field` | `/student/field` | 召喚フィールド | 将来 | 召喚獣を召喚し、バトルモードへ移行するフィールド |

---

### 教師

| 画面ID | URL | 画面名 | スコープ | 概要 |
|---|---|---|---|---|
| `teacher/dashboard` | `/teacher` | ダッシュボード | MVP | 担当クラスの試験一覧・バトル一覧を確認する |
| `teacher/exam-new` | `/teacher/exams/new` | 試験作成 | MVP | 科目・対象クラス・満点を指定して試験を登録する |
| `teacher/exam-scores` | `/teacher/exams/[id]/scores` | 点数入力 | MVP | 試験ごとにクラス全員の点数を一括入力する |
| `teacher/battle-new` | `/teacher/wars/new` | バトル作成 | MVP | 対戦科目と2人の生徒を指定してバトルを作成する |
| `teacher/exam-ocr` | `/teacher/exams/[id]/ocr` | OCR採点 | Phase2 (OCR) | 生徒の提出答案一覧とOCR結果草稿を確認・修正してスコアとして登録する |
| `teacher/classes` | `/teacher/classes` | クラス管理 | 将来 | クラス設備・A〜Fクラス振り分け結果を管理する |

---

## 画面遷移

### 生徒の遷移フロー

```
/login
  └─ /student（ダッシュボード）
        ├─ /student/scores（成績確認）
        │     └─ /student（戻る）
        └─ バトル入室
              └─ /student/wars/[id]/battle
                    └─ /student/wars/[id]/result
                          └─ /student（戻る）
```

### 教師の遷移フロー

```
/login
  └─ /teacher（ダッシュボード）
        ├─ /teacher/exams/new
        │     └─ /teacher/exams/[id]/scores（試験作成後、点数入力へ）
        ├─ /teacher/exams/[id]/scores（既存試験の点数編集）
        │     └─ /teacher（登録後、ダッシュボードへ）
        └─ /teacher/wars/new
              └─ /teacher（バトル作成後、ダッシュボードへ）
```

---

## 各画面の表示要素と操作

### `login` — `/login`

**表示：**
- メールアドレス入力フォーム
- パスワード入力フォーム
- ログインボタン

**操作：**
- ログイン成功 → ロールに応じて `/student` または `/teacher` へ遷移

---

### `student/dashboard` — `/student`

**表示：**
- 召喚獣ステータス（HP・攻撃・防御・素早さ）
- 科目別の試験履歴サマリー
- 参加可能なバトルがあればバッジ表示

**操作：**
- 「成績を確認する」 → `/student/scores` へ遷移
- バトルバッジ選択して「入室する」 → `/student/wars/[id]/battle` へ遷移

---

### `student/scores` — `/student/scores`

**表示：**
- 科目名ごとに折りたたみ
- 試験名・点数・満点・登録日を時系列で表示

**操作：**
- 「ダッシュボードへ戻る」 → `/student` へ遷移

---

### `student/battle` — `/student/wars/[id]/battle`

**表示：**
- 自分の召喚獣ステータス（現在HP・最大HP）
- 相手の召喚獣ステータス（現在HP・最大HP）
- 現在のターン数
- 直近の行動ログ（例：「Aさんが攻撃！24ダメージ」）
- 行動ボタン（通常攻撃のみ。自分のターン時のみ活性化）

**操作：**
- 「攻撃」ボタン押下 → WebSocket経由でGoへ送信、ターン進行
- 相手HPが0になったら自動的に `/student/wars/[id]/result` へ遷移

**状態：**
- `waiting`：両プレイヤーが入室するまで待機
- `selecting`：自分のターン（攻撃ボタン活性）
- `waiting_opponent`：相手のターン（攻撃ボタン非活性）
- `finished`：終了

---

### `student/battle-result` — `/student/wars/[id]/result`

**表示：**
- 勝敗（「勝利」または「敗北」）
- ターン数
- バトルログ（ターンごとの行動・ダメージ）

**操作：**
- 「ダッシュボードへ戻る」 → `/student` へ遷移

---

### `teacher/dashboard` — `/teacher`

**表示：**
- 担当クラスの試験一覧（試験名・科目・作成日・点数入力状況）
- 作成済みバトルの一覧（対戦科目・対戦相手・ステータス）

**操作：**
- 「試験を作成する」 → `/teacher/exams/new` へ遷移
- 試験を選択して「点数入力」 → `/teacher/exams/[id]/scores` へ遷移
- 「バトルを作成する」 → `/teacher/wars/new` へ遷移

---

### `teacher/exam-new` — `/teacher/exams/new`

**表示・入力フォーム：**
- 試験名（テキスト）
- 科目（セレクトボックス：英語・数学・物理・化学・生物・地学・地理・日本史・世界史・現代社会・国語）
- 対象クラス（セレクトボックス）
- 満点（数値入力、デフォルト100）

**操作：**
- 「作成する」 → 試験作成API呼び出し → `/teacher/exams/[id]/scores` へ遷移

---

### `teacher/exam-scores` — `/teacher/exams/[id]/scores`

**表示：**
- 試験名・科目・満点の確認情報
- クラス全員の点数入力フォーム（生徒名・点数入力欄）

**操作：**
- 点数を入力して「登録する」 → 点数一括登録API呼び出し → `/teacher` へ遷移

---

### `teacher/battle-new` — `/teacher/wars/new`

**表示・入力フォーム：**
- 対戦科目（セレクトボックス）
- プレイヤー1（生徒セレクトボックス）
- プレイヤー2（生徒セレクトボックス）

**操作：**
- 「バトルを作成する」 → バトル作成API呼び出し → `/teacher` へ遷移

---

## 共通レイアウト

全画面共通のヘッダーに以下を表示する：
- アプリ名（左）
- ログイン中のユーザー名・ロール（右）
- ログアウトボタン（右）

ログアウト操作：ヘッダーのボタン → JWTクッキー破棄 → `/login` へ遷移

---

## 認証・ルート保護

- JWTはhttpOnlyクッキーに保存（XSS対策）
- `/student/*`：studentロールのみ許可
- `/teacher/*`：teacherロールのみ許可
- 未認証 → `/login` リダイレクト
- 認証済みで `/` アクセス → ロール別ダッシュボードへリダイレクト

---

## Phase2 OCR 遷移フロー

```
/student（ダッシュボード）
  └─ /student/upload（PCカメラで答案撮影 → アップロード）
        ├─ NG: 同画面で「読み取れませんでした。再撮影してください」 → 再撮影
        └─ OK: Rails側でOCR結果を保存し、教師に通知フラグ更新
              └─ /teacher/exams/[id]/ocr（教師がOCR結果を確認・修正 → スコア登録）
                    └─ /teacher（ダッシュボードへ）

生徒は次回 /student/scores を開いたとき、登録済みスコアが自動反映される
```

**PCカメラUI仕様（/student/upload）:**
- ブラウザ `getUserMedia` API でウェブカム映像をストリーミング表示
- 「撮影」ボタンで静止画キャプチャ → プレビュー表示
- 「送信」でRailsにPOST → OCR品質チェック → OK/NG判定を返す
- NG時: 同画面でエラーメッセージ表示 → 再撮影ボタンでカメラ再起動

---

## 確定した設計決定（2026-06-12）

| 項目 | 決定内容 |
|---|---|
| 「逃げる」選択肢 | 将来スコープ。MVPバトルは通常攻撃のみ |
| ペナルティ（3ヶ月制限） | 将来スコープ（条件TBD） |
| FB通知方式 | 通知機能は作らない。生徒が次回ダッシュボードを開いた時点でスコアが自動反映される |
| クラス振り分け（A〜F） | 将来スコープ |
| OCRカメラ | PCの内蔵カメラ（ブラウザ MediaDevices API）。スマホ対応は将来 |

---

## 未決事項

- バトル待機画面で「相手がまだ入室していない」状態をどう見せるか（ポーリングか押せないだけか）
- パスワードリセット画面はMVPに含めるか

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-06-10 | 初版作成 |
| 2026-06-11 | 生徒ダッシュボードを試験履歴表示に変更、点数入力を一括登録に確定、ログアウトをヘッダーボタンに確定 |
| 2026-06-12 | 画面遷移図（FigJam）に合わせてURLパターンを全面改訂。将来スコープ画面（OCR・宣戦布告・召喚フィールド・クラス管理）を追加。student/battle-waiting を廃止しダッシュボードに統合。 |
| 2026-06-12 | Phase2 OCRフロー追記（PCウェブカム仕様確定）。逃げる・ペナルティ・クラス振り分けを将来スコープに確定。FB通知はダッシュボード自動反映に確定。 |
