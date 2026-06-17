import type { components } from "./schema";

// OpenAPI スキーマ由来の型エイリアスを集約する。
// components["schemas"][...] というジェネレータ依存のインデックスアクセスを
// ここだけに閉じ込め、アプリ側はドメイン語彙（User, Role など）で参照する。

export type Role = components["schemas"]["Role"];
export type SchoolClass = components["schemas"]["SchoolClass"];
export type User = components["schemas"]["User"];
export type AuthResponse = components["schemas"]["AuthResponse"];

// 教師のクラス管理画面で使うドメイン型（学年・平均スコア・最高科目を含む）。
// swagger_helper.rb の共通スキーマ（$ref）由来の名前付き型を参照する。
export type ClassSummary = components["schemas"]["ClassSummary"];
export type ClassStudent = components["schemas"]["ClassStudent"];
