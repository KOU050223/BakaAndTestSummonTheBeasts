import { describe, it, expect } from "vitest";
import { extractApiError, extractServerErrors, extractFormErrorMessage } from "./errors";

// 422（フィールド別バリデーションエラー）形式
const validationError = {
  error: {
    code: "validation_error",
    message: "入力内容を確認してください",
    details: { email: ["は既に使用されています"] },
  },
};

// 409（重複など）形式：details は空
const conflictError = {
  error: {
    code: "conflict",
    message: "このメールアドレスはすでに使用されています",
    details: {},
  },
};

describe("extractApiError", () => {
  it("error オブジェクトを取り出す", () => {
    expect(extractApiError(conflictError)?.message).toBe(
      "このメールアドレスはすでに使用されています",
    );
  });

  it("error 形式でない値は undefined", () => {
    expect(extractApiError(null)).toBeUndefined();
    expect(extractApiError("boom")).toBeUndefined();
    expect(extractApiError({ foo: 1 })).toBeUndefined();
  });
});

describe("extractServerErrors", () => {
  it("422 の details を返す", () => {
    expect(extractServerErrors(validationError)).toEqual({
      email: ["は既に使用されています"],
    });
  });

  it("details が空（409 など）なら undefined", () => {
    expect(extractServerErrors(conflictError)).toBeUndefined();
  });

  it("error 形式でない値は undefined", () => {
    expect(extractServerErrors(undefined)).toBeUndefined();
  });
});

describe("extractFormErrorMessage", () => {
  it("error が無ければ undefined", () => {
    expect(extractFormErrorMessage(null)).toBeUndefined();
  });

  it("フィールド別エラー（422）がある場合は出さない（field 側に任せる）", () => {
    expect(extractFormErrorMessage(validationError)).toBeUndefined();
  });

  it("409 などはサーバーの message を返す", () => {
    expect(extractFormErrorMessage(conflictError)).toBe(
      "このメールアドレスはすでに使用されています",
    );
  });

  it("message を取り出せない形のエラーは汎用文言にフォールバックする", () => {
    expect(extractFormErrorMessage({ unexpected: true })).toBe(
      "保存に失敗しました。時間をおいて再度お試しください。",
    );
  });
});
