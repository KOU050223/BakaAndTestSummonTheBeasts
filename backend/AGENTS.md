# Backend 開発ガイド

## OpenAPI スキーマ定義方針

### $ref vs インライン定義

スキーマの定義場所は以下の基準で判断する：

| ケース | 定義方法 |
|---|---|
| 複数エンドポイントで使う型 | `$ref`（swagger_helper.rb に共通定義） |
| フロント・Go と共有したい型 | `$ref` |
| 特定エンドポイント専用の型 | インライン定義 |

### 共通スキーマの追加手順

1. `spec/swagger_helper.rb` の `components.schemas` に定義を追加
2. 各 spec で `schema '$ref' => '#/components/schemas/型名'` と参照
3. `bundle exec rswag` を実行して `docs/openapi.yaml` を再生成

### openapi.yaml は手動編集禁止

`docs/openapi.yaml` は rswag が自動生成するファイルなので直接編集しない。
スキーマや仕様を変えたい場合は必ず spec か `swagger_helper.rb` を修正してから再生成する。

### エラーレスポンスは必ず $ref を使う

`apiSpec.md §6` で定義されたエラー形式に統一するため、エラーレスポンスのスキーマは必ず以下の形式で参照する：

```ruby
response '401', '未認証' do
  schema '$ref' => '#/components/schemas/error'
end
```

エラースキーマをインラインで書いてはいけない。

### Internal API は openapi.yaml のスコープ外

`/internal/*` エンドポイント（Go Game Server 向け）は外部公開しないため、rswag の spec に含めない。
仕様は `docs/apiSpec.md §4` で管理する。

### 新しいエンドポイントを追加したら再生成する

spec を追加・変更したら必ず以下を実行して `docs/openapi.yaml` を最新化する：

```bash
bundle exec rswag
```
