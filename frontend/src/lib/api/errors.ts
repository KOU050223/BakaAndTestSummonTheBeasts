// API エラーレスポンス（apiSpec.md §6 の { error: { code, message, details } } 形式）
// を扱うユーティリティ。フォーム/モーダルのエラー表示ロジックをここに集約する。

// エラーレスポンスの error オブジェクトを取り出す。
export function extractApiError(
  error: unknown,
): { message?: string; details?: unknown } | undefined {
  if (error && typeof error === "object" && "error" in error) {
    return (error as { error?: { message?: string; details?: unknown } }).error;
  }
  return undefined;
}

// details（任意形状）を Record<string, string[]> に正規化する。
// サーバーが配列以外（文字列やネスト等）を返しても、利用側で .join() などを
// 安全に呼べるよう、値を文字列配列だけに絞り込む。該当が無ければ undefined。
function normalizeFieldErrors(
  details: unknown,
): Record<string, string[]> | undefined {
  if (!details || typeof details !== "object") return undefined;

  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!Array.isArray(value)) continue;
    const messages = value.filter((v): v is string => typeof v === "string");
    if (messages.length > 0) normalized[key] = messages;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

// サーバーのフィールド別バリデーションエラー（422 の details）を取り出す。
// 422 以外（409 など）は details が空なので undefined を返す。
// 値は normalizeFieldErrors で string[] に保証され、利用側の .join() が落ちない。
export function extractServerErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  return normalizeFieldErrors(extractApiError(error)?.details);
}

// フォーム全体に出す汎用エラーメッセージ。
// フィールド別エラー（422）がある場合はそちらに任せ、ここでは出さない。
export function extractFormErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (extractServerErrors(error)) return undefined;
  return extractApiError(error)?.message ?? "保存に失敗しました。時間をおいて再度お試しください。";
}

// API エラーレスポンスの code を取り出す。
export function extractApiErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "error" in error) {
    return (error as { error?: { code?: string } }).error?.code;
  }
  return undefined;
}

// バックエンドの 401（unauthorized）かどうかを判定する。
// openapi-fetch はエラーレスポンスのボディ（{ error: { code } }）を error として返すため、
// code === "unauthorized" を未認証の判定に使う。
export function isUnauthorizedError(error: unknown): boolean {
  return extractApiErrorCode(error) === "unauthorized";
}

// fetch がサーバーに到達できなかった（バックエンド未起動・CORS・通信断など）場合の判定。
// openapi-fetch はこの場合 { error: {...} } 形式ではなく素の TypeError / Error を投げ、
// react-query 側でそれが error として渡ってくる。API エラー形式でなければネットワーク起因とみなす。
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  // バックエンドが返した構造化エラー（{ error: {...} }）ならネットワークエラーではない。
  if (error && typeof error === "object" && "error" in error) return false;
  return error instanceof Error || error instanceof TypeError;
}

// 開発中に「DB か？バックエンドか？」を切り分けやすくするための分類結果。
export type LoginErrorKind = "unauthorized" | "validation" | "network" | "server" | "unknown";

export type LoginErrorInfo = {
  kind: LoginErrorKind;
  // 画面に出す主メッセージ。
  message: string;
  // 開発者向けの補足（原因の切り分けヒント）。
  hint?: string;
  // 422 のフィールド別エラー（あれば）。
  fieldErrors?: Record<string, string[]>;
  // 切り分け用に出すエラーコード。
  code?: string;
};

// ログイン失敗エラーを種別ごとに分類する。
// リダイレクトするだけで「なぜ失敗したか」が分からない問題を解消するため、
// ネットワーク断・サーバーエラー・認証エラー・バリデーションを区別する。
export function classifyLoginError(error: unknown): LoginErrorInfo | undefined {
  if (!error) return undefined;

  if (isNetworkError(error)) {
    return {
      kind: "network",
      message: "サーバーに接続できませんでした",
      hint: "バックエンド（API サーバー）が起動しているか、NEXT_PUBLIC_API_URL の設定が正しいかを確認してください",
    };
  }

  const code = extractApiErrorCode(error);
  const apiMessage = extractApiError(error)?.message;
  const fieldErrors = extractServerErrors(error);

  if (code === "unauthorized") {
    return {
      kind: "unauthorized",
      message: apiMessage ?? "メールアドレスまたはパスワードが違います",
      hint: "入力内容を確認してもう一度お試しください",
      code,
    };
  }

  if (code === "validation_error" || fieldErrors) {
    return {
      kind: "validation",
      message: apiMessage ?? "入力内容を確認してください",
      fieldErrors,
      code,
    };
  }

  if (code === "internal_server_error" || code === "server_error") {
    return {
      kind: "server",
      message: apiMessage ?? "サーバーでエラーが発生しました",
      hint: "DB に接続できているか、バックエンドのログを確認してください",
      code,
    };
  }

  return {
    kind: "unknown",
    message: apiMessage ?? "ログインに失敗しました。時間をおいて再度お試しください",
    hint: "想定外のエラーです。バックエンドのレスポンスを確認してください",
    code,
  };
}
