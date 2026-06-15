import type { components } from "./schema";

// OpenAPI スキーマ由来の型エイリアスを集約する。
// components["schemas"][...] というジェネレータ依存のインデックスアクセスを
// ここだけに閉じ込め、アプリ側はドメイン語彙（User, Role など）で参照する。

export type User = components["schemas"]["User"];
export type Role = components["schemas"]["Role"];
export type AuthResponse = components["schemas"]["AuthResponse"];
