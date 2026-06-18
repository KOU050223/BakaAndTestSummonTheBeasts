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

// サーバーのフィールド別バリデーションエラー（422 の details）を取り出す。
// 422 以外（409 など）は details が空なので undefined を返す。
export function extractServerErrors(
  error: unknown,
): Record<string, string[]> | undefined {
  const details = extractApiError(error)?.details;
  if (details && typeof details === "object" && Object.keys(details).length > 0) {
    return details as Record<string, string[]>;
  }
  return undefined;
}

// フォーム全体に出す汎用エラーメッセージ。
// フィールド別エラー（422）がある場合はそちらに任せ、ここでは出さない。
export function extractFormErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (extractServerErrors(error)) return undefined;
  return extractApiError(error)?.message ?? "保存に失敗しました。時間をおいて再度お試しください。";
}
