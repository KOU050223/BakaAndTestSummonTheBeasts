# Goテストの命名規則

- テスト関数名は英語で記述する（例：`TestCreatePlayer`）
- 仕様や振る舞いを表す `t.Run` のサブテスト名は日本語で記述する
- テーブル駆動テストの `name` も日本語で記述する

```go
func TestCreatePlayer(t *testing.T) {
	t.Run("有効な名前ならプレイヤーを作成できる", func(t *testing.T) {
		// テスト
	})
}
```
