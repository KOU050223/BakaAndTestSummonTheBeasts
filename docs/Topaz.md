# 試験召喚システムとは

### 「ここ文月学園は、世界初の特殊なシステムを導入した進学校である。」

というナレーションから始まるバカとテストと召喚獣という作品に登場するシステムです。
概要は学力試験の点数をそのまま自身の能力値を持つ「召喚獣」として可視化し、クラス同士の対戦（試験召喚戦争）を可能にするシステムです。
このプロダクトはこの試験召喚システムという作品内に出てくるものを現実で再現していくプロダクトです。

## リンク

[デプロイ](https://bakatest.uomi.site)
[Figma](https://www.figma.com/board/aqG9T3X7I4S3vXlWXaqarR/%E8%A9%A6%E9%A8%93%E5%8F%AC%E5%96%9A%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0?node-id=0-1&p=f&t=gK2kRYI10SmoeZQ5-0)
[ドメイン(Wikipedia)](https://ja.wikipedia.org/wiki/%E3%83%90%E3%82%AB%E3%81%A8%E3%83%86%E3%82%B9%E3%83%88%E3%81%A8%E5%8F%AC%E5%96%9A%E7%8D%A3)
[デモ動画①試験作成から採点送信までのフロー](https://www.youtube.com/watch?v=ohMjx1MKJZU)

# 使用技術(選定理由)

### フロントエンド

```
Next.js 16.2.9
React 19.2.4
TypeScript 5.9.3
TailwindCSS 4.3.0
TanStack Query 5.101.0
Zustand 5.0.14
Vitest 4.1.9
ReactThreeFiber
@pixiv/three-vrm
```

バトル・3D描画のCSRと、認証・管理画面のSSRをページ単位で使い分けるためNext.js（App Router）を採用しました。

TypeScriptはOpenAPIスキーマから型を自動生成することでフロントとバックの型ズレをコンパイル時に防ぎ、TailwindCSSはゲームのダークテーマをユーティリティクラスで素早く構築するために採用しています。

サーバー状態の取得・キャッシュにはTanStack Query、バトルのリアルタイム状態管理には軽量なZustand、テストはNext.jsとの相性が良いVitestを採用しました。

### バックエンド

```
Ruby 4.0.5
Ruby on Rails 8.1.3
Go 1.26.3
```

APIサーバーにはRuby on Railsを採用！
開発の流れ・形が決まっている分RESTAPIを作る速度は爆速だろうという理由で採用！
また、開発経験が多いメンバー２名両方が触れるバックエンドの技術として上がったため属人化を避けるために採用しました。
DBマイグレーション・認証・ジョブキューなどの機能が揃っており、開発速度を重視した選択です。

リアルタイムのバトルロジックにはGoを採用しています。WebSocketを使った同時接続処理に強く、Railsより軽量で高速なため、ゲームのリアルタイム通信に適していると判断しました。

ジョブキューにはSolid Queueを採用しています。AI採点のバックグラウンド処理をRailsのプロセス内で完結でき、Redisなどの外部依存を追加せずに済みます。認証にはJWTをHttpOnly Cookieで管理しており、XSSによるトークン窃取を防いでいます。

### インフラ・DB

```
Vercel（フロントエンドホスティング）
Raspberry Pi 4B+（デプロイサーバー）
GitHub Actions Self-hosted Runner（CI/CD）
Cloudflare Tunnel（外部公開）
Supabase
```

バックエンドのデプロイには手元にあったRaspberry Pi 4B+を自前サーバーとして活用しました。

クラウドのホスティング費用をかけずに本番環境を構築できるため採用しています。
外部からのアクセスにはポート開放不要で安全にトンネルを張れるCloudflare Tunnelを使用しています。(マジ便利)

フロントエンドはVercelにデプロイしています。Next.jsとの親和性が高く、プッシュだけで自動デプロイが完結します。

CI/CDにはGitHub Actions Self-hosted Runnerを採用しました。RaspberryPi上でRunnerを動かすことでクラウドのCI利用枠を消費せず、自前環境でテスト・デプロイを自動化しています。

PostgreSQLはRailsのActiveRecordとの相性の良さと実績から選択しました。ローカル開発ではDockerを使用しています。

全体的に安さ、手軽さ、開発速度を重視した技術選定でハッカソンに合わせた選択基準になってます。

### 開発環境

[Nix（開発環境管理）](https://nixos.org/)

Docker（PostgreSQL のみ）
開発環境の管理にはNixを採用しました。Ruby・Go・Node.js・各種ツール系(lefthookやtaskfile.devなど)のバージョンをflake.nixで宣言的に管理することで、自分の環境では動くけど...といった問題を防ぎます。

DBのみDockerで構築しています。PostgreSQLをコンテナで立ち上げることでローカルへの直接インストールが不要になり、docker compose upだけで即座にDB環境が再現できます。

ローカルのDB周りでの接続に以前の開発で前詰まりまくった記憶があり、Dockerで行った(捨てやすくて良かったかも)

[Taskfile.dev](https://taskfile.dev/)

モノレポ構成のコマンド管理に使用しました
以前はpnpmを使ったり、Makefileを使ったりしてたが、よりモダンで柔軟なTaskfile.devを採用しました。タスクの依存関係や並列実行、環境変数の注入などが簡単にできるため、開発効率が上がりました。導入楽だし、今後も使っていきたい

`task setup`で開発環境のセットアップが一括で完了するようにして、環境作り直しになった時に楽できるようにできてにこにこハッピーちゃんです！

```
$task

task: [default] task -l
task: Available tasks for this project:
* ci:                      全サービスのCIチェックをローカルで全て実行する
* default:                 タスク一覧      (aliases: list)
* dev:                     全サービスの開発サーバーをまとめて起動
* install:                 全サービスの依存関係をまとめてインストール
* lint:                    全サービスのlintをまとめて実行する
* scan:                    全サービスのセキュリティスキャンをまとめて実行する
* setup:                   🚀 新規参加者向けセットアップ（install → .env → DB起動 → DB初期化 まで一括実行）
* test:                    全サービスのテストをまとめて実行する
* db:create:               データベースを作成する
* db:migrate:              マイグレーションを実行する
* db:reset:                DBをリセットして再セットアップする（開発用）
* db:rollback:             直近のマイグレーションをロールバックする
* db:seed:                 シードデータを投入する
* db:seed:demo:            デモ環境用の初期データを明示的に投入する
* db:setup:                DB作成・マイグレーション・シードをまとめて実行する
* db:start:                PostgreSQLをdocker-composeで起動し、healthyになるまで待つ
* db:status:               マイグレーションの状態を確認する
* db:stop:                 PostgreSQLを停止する
* deploy:seed:demo:        デプロイ先へデモ環境用の初期データを投入する
* hooks:install:           lefthookのgitフックをインストールする
* lint:fix:                全サービスのlintを自動修正する
* openapi:generate:        OpenAPI 仕様（docs/openapi.yaml）を再生成し、フロントの型定義を更新する
* setup:check-tools:       必要ツールの存在確認
* setup:copy-env:          .env ファイルをコピー（存在しない場合のみ）
* setup:db:                DB起動 → 作成 → マイグレーション → シード
* setup:done:              セットアップ完了メッセージ
* setup:install:           依存関係のインストール
```

### アーキテクチャ図

![image](https://ptera-publish.topaz.dev/project/01KVKWC71G57AVFFQDWMK5H3XM.png)

# 機能

## 生徒ユーザーフロー(生徒画面)

①ログイン
②テストを解く(アプリ外)
③解いたテストをアップロードする
④採点結果が返ってくる
⑤採点結果をもとに、召喚獣を召喚してバトルをする
⑥リザルト画面

<details>

<summary>①ログイン</summary>
メールアドレスとパスワードで認証し、ログイン後はロール（生徒・教師・学校管理者）に応じた画面へ遷移する。
ログイン後、答案のアップロードや採点結果の確認・バトル機能が使えるようになる。

![image](https://ptera-publish.topaz.dev/project/01KVKNX8FH0HERH1P417YCAHSK.png)

</details>
<details>

<summary>②テストを解く(アプリ外)</summary>
 生徒が紙のテストを解き、答案をスキャンまたは撮影してアップロードする

</details>
<details>

<summary>③解いたテストをアップロードする</summary>
生徒が解いた答案を画像またはPDFでアップロードする。教師側で模範解答がアップロード済みの場合、バックグラウンドで自動的に採点処理を開始する。

![image](https://ptera-publish.topaz.dev/project/01KVKPWFWAR04VNWHM0BJ5WW46.png)

</details>
<details>

<summary>④採点結果が返ってくる</summary>
教師画面で採点を確定すると、生徒の成績画面に点数が反映される。

![image](https://ptera-publish.topaz.dev/project/01KVKPXDBWPHF7DZXZAE0X8RHX.png)

</details>
<details>

<summary>⑤採点結果をもとに、召喚獣を召喚してバトルをする</summary>

</details>
<details>

<summary>⑥リザルト画面</summary>

</details>

## 教師ユーザーフロー(教師画面)

①ログイン
②試験設定
③模範解答をアップロードする
④生徒の答案を提出後、模範解答をもとにAIが自動採点
⑤手動で確認し採点結果を生徒に送る

<details>

<summary>①ログイン</summary>
 メールアドレスとパスワードで認証し、ログイン後はロール（生徒・教師・学校管理者）に応じた画面へ遷移する。
ログイン後、試験作成・模範解答アップロード・AI採点などの教師専用機能が使えるようになる。

![image](https://ptera-publish.topaz.dev/project/01KVK8HNW13CQY2B065T6TS85T.png)

</details>
<details>

<summary>②試験設定</summary>
  教師が採点する試験を登録する画面。

- 試験名・科目・対象クラス・満点 を入力して試験を作成
- 科目は英語・数学など12科目のプリセットから選択、または手動入力も可
- クラスはその場で新規追加も可能
- 作成後はそのままAI自動採点画面へ進むことができる

![image](https://ptera-publish.topaz.dev/project/01KVKMD7XD608Y9J3NXAK5DX41.png)

</details>
<details>

<summary>③模範解答をアップロードする</summary>
教師が試験の正解ファイルをアップロードする画面
  生徒が答案用紙を撮影・スキャンした画像または PDFをアップロード。提出後はバックグラウンドで採点ジョブがキューに積まれ、自動採点の準備が整う。
問題数は手動で入力する

![image](https://ptera-publish.topaz.dev/project/01KVKMHTCQMWJXF7WFZ86G57QT.png)

</details>
<details>

<summary>④生徒の答案を提出後、模範解答をもとにAIが自動採点。手動で２次採点</summary>
 提出された答案画像と模範解答をもとに Gemini AI が自動採点する画面
  - 手書きの答案にも対応（画像をそのままGeminiに送信）
  - APIの制限（15RPM）に対応するため、採点は1件ずつ順番に処理
  - 失敗時は指数バックオフで最大3回リトライ
  - 採点結果は問題ごとの正誤と合計点で記録
-  AIの採点結果を教師が画面上で確認し、必要に応じて点数を修正できるすることが可能
  - 答案画像と採点結果を並べて表示
  - 合計点を手動で編集可能

![image](https://ptera-publish.topaz.dev/project/01KVKN0YXHA1AH7GCWEVEMX6PP.png)

</details>
<details>

<summary>⑤採点結果を生徒に送る</summary>
 
  - 「採点を確定して生徒に通知」 ボタンを押すと点数が確定し、生徒側の成績画面に反映される
  - 全生徒の採点が完了するとバナーが表示され、ダッシュボードへ戻れる

![image](https://ptera-publish.topaz.dev/project/01KVKN3DZEJ03Y663C743CDPH9.png)

</details>

## 生徒画面

![image](https://ptera-publish.topaz.dev/project/01KVJKGK8SSKBQ5E7V4EW2E6A4.png)
ダッシュボードを作成し、クイックアクションで簡単にボタンを押せるようにしました。

## 教師画面

### 教師ダッシュボード

![image](https://ptera-publish.topaz.dev/project/01KVK2CV3A283DKNT2QKWZ2N2D.png)  
他にも、試験作成、試験設定、点数管理、AI自動採点、クラス管理、生徒一覧の閲覧画面があります。

## 管理者画面

![image](https://ptera-publish.topaz.dev/project/01KVJJ8JTNHS7HNAF5YT30ZEPR.png)
管理者ダッシュボード、ユーザー管理（生徒、先生、管理者含めて）
クラス設定

### 全体成績

![image](https://ptera-publish.topaz.dev/project/01KVJJX7QWH7575WMF11PZ2NGA.jpeg)

### 試召戦争ログ

![image](https://ptera-publish.topaz.dev/project/01KVJJTRERQDXAGC8CM8BRXHAC.png)
となっています。

# 技術的な挑戦や工夫、難しかったこと

### 技術的な挑戦：OCRからGeminiAIへの移行

当初の実装：Tesseract OCR
背景：原作は手書きのテストを手作業で採点してたけど、現代の技術ではテストの採点を自動化できると考え実装を始めた。
教師側の模範解答と生徒側から送られてくる答案を自動採点の最初のアプローチは、オープンソースのOCRエンジン [Tesseract](https://github.com/tesseract-ocr/tesseract)を使って答案をテキスト化する方式をとった

- 日本語対応の tesseract5を開発環境（Nix）に導入
- PDF提出に対応するため ImageMagick で PDF →画像変換を実装
- 変換した画像をTesseractに渡してテキストを抽出

実際に日本語テキスト付きのテスト答案PDFを読み込ませてみると、以下の問題が起きた

- 日本語が文字化けして正しく読み取れない
- 手書き部分はほぼ認識不能
- テキスト化できても、模範解答と生徒答案の表記揺れ（全角半角・改行位置など）で正誤判定がずれる

精度を上げようと前処理（画像の二値化・解像度向上）も試んでみたけどうまくいかなかった。

そこで答案画像をそのまま Gemini APIに送信して採点させる方式に変更した。テキスト抽出を挟まないため、手書きの文字や図表も含めて採点できるようになった。

geminiAPIがRPD20という制約上、デプロイ環境では Gemini API キーを環境変数に設定していないため、AI自動採点機能は本番環境では動作してないけどローカル環境では正常に動作するようになった。

### 工夫：型安全な開発

RailsのRSpecを使用することでopenapi.jsonを生成することができ、スキーマ駆動で型安全な通信が行えました
フロントエンドは`openapi-typescript` で自動生成したことでバックエンドへの取得処理を書く時などに存在しないパスを書くと型エラーが出て実行前に気づくことができてハッピー！最高！

この形にしたのは最小で型安全が再現できそうだったからで、他のやつ(ProtoBufとか)を導入するには時期的に重そうだった
バックエンドもTypeScriptにすると共通型を使えるので便利だしtRPCとかも楽に使えるので個人開発規模だとTypeScriptがバックエンドの候補に上がりそうだ

実際のSwaggerUIが見れる！

https://bakatest-api.uomi.site/api-docs/index.html

# テーマへの着想。裏話、これからの展望

うん → 運 → テストは最終的に運だよね → バカテスの１話で主人公が鉛筆コロコロ→ 試験召喚システム

学校のテストって意欲的にやる人より、めんどくさいと感じている人が多いと感じているので「点数を活かして楽しく遊べるプロダクト」を作りたかった。学生が解いたテストの点数で遊ぶので生徒のやる気と学力向上にもつながると考える。

バカとテストと召喚獣には振り分け試験があり、クラスごとに教室の設備が変わる。それを再現するために、AクラスからFクラスまでの生徒のUIをランクごとに変化させた。
Aクラス
![image](https://ptera-publish.topaz.dev/project/01KVKY1B0SM9ZJFPV04J4G0D29.png)

Bクラス![image](https://ptera-publish.topaz.dev/project/01KVKY45XF4A2Z9DYM5F8W0HW6.png)

Cクラス
![image](https://ptera-publish.topaz.dev/project/01KVKY4V9ZHRZ4DJHWQ4RRWCFE.png)

Dクラス
![image](https://ptera-publish.topaz.dev/project/01KVKY5BSZQZT63BPJZ50A4XFR.png)

Eクラス![image](https://ptera-publish.topaz.dev/project/01KVKY5SPCHZR6Z6H0WX87042W.png)

Fクラス
![image](https://ptera-publish.topaz.dev/project/01KVKY6CN3QZY8YB11S8S84M9S.png)

本作の主人公・吉井明久は「観察処分者」という特別な身分を持ち、原作では召喚獣がダメージを受けると本人にもダメージがフィードバックされます。この設定を忠実に再現するため、召喚獣バトルで受けたダメージに応じて実際に電気ショックなどの物理的ダメージをプレイヤーに与える仕組みの実装を検討しています。

「試験召喚獣召喚！サモン！Go！」と言って、Gopherくんを呼び出して言語の特性(Goは非常に軽量で高速に動作する言語であるため、バトルにおける素早さが異常に高く、相手の攻撃を回避しやすい)で言語同士を戦わせるアプリを作るアイデアも初期出てた。
