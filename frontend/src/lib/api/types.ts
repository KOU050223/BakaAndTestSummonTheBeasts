import type { components } from "./schema";

// OpenAPI スキーマ由来の型エイリアスを集約する。
// components["schemas"][...] というジェネレータ依存のインデックスアクセスを
// ここだけに閉じ込め、アプリ側はドメイン語彙（User, Role など）で参照する。

export type Role = components["schemas"]["Role"];
export type SchoolClass = components["schemas"]["SchoolClass"];
export type User = components["schemas"]["User"];
export type AuthResponse = components["schemas"]["AuthResponse"];
