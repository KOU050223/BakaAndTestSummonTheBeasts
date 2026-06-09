# 開発中に意識すること

## 開発手法

DDDとTDDを組み合わせて開発することを推奨します。
DDDはドメインの理解と設計に焦点を当て、TDDはコードの品質と保守性を高めるための手法です。
ドメインについて認識が正しいか開発者と擦り合わせるようにしてください

## プロジェクトの構成

frontend: Reactを使用して、ユーザーインターフェースを構築します。
backend: Ruby on Railsを使用して、APIを構築します。
game: Goを使用してリアルタイムのゲームロジックを実装します。
DB: PostgreSQLを使用して、データを管理します。


## DBのマイグレーションと接続

railsのバックエンドが一任してDBのマイグレーションを行うようにしてください
また、DBとの接続もrailsのバックエンドが一任して行うようにしてください

## 知識＆ライブラリ（Knowledge & Library）

- 実装前に`Context7 MCP Server`を利用し、`resolve-library-id` → `get-library-docs` で関連ライブラリ（例：`/upstash/context7`）の最新情報を取得する。

## 自己検証
TODO: E2Eで自身の作業を自己検証できる手段を確保する
- ウェブ: Chrome ブラウザ拡張の Claude
- モバイル: iOS/Android シミュレータ MCP
- バックエンド: フルウェブサーバーまたはサービスを起動する手段
