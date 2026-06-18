import { describe, it, expect } from "vitest";
import {
  extractApiError,
  extractServerErrors,
  extractFormErrorMessage,
  extractApiErrorCode,
  isUnauthorizedError,
  isNetworkError,
  classifyLoginError,
} from "./errors";

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

  it("値が配列でない（文字列など）フィールドは除外する（.join() のクラッシュ防止）", () => {
    const malformed = {
      error: {
        code: "validation_error",
        message: "入力内容を確認してください",
        details: { email: "配列でない文字列", password: ["は短すぎます"] },
      },
    };
    // email は配列でないので除外され、password だけが残る。
    expect(extractServerErrors(malformed)).toEqual({ password: ["は短すぎます"] });
  });

  it("配列内の非文字列要素は除外する", () => {
    const malformed = {
      error: {
        code: "validation_error",
        message: "x",
        details: { email: ["ok", 123, null] },
      },
    };
    expect(extractServerErrors(malformed)).toEqual({ email: ["ok"] });
  });

  it("正規化後に有効なフィールドが無ければ undefined", () => {
    const malformed = {
      error: { code: "validation_error", message: "x", details: { email: "str", age: 1 } },
    };
    expect(extractServerErrors(malformed)).toBeUndefined();
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

// 401（未認証）形式
const unauthorizedError = {
  error: {
    code: "unauthorized",
    message: "メールアドレスまたはパスワードが正しくありません",
    details: {},
  },
};

describe("extractApiErrorCode", () => {
  it("error.code を取り出す", () => {
    expect(extractApiErrorCode(unauthorizedError)).toBe("unauthorized");
    expect(extractApiErrorCode(validationError)).toBe("validation_error");
  });

  it("error 形式でない値は undefined", () => {
    expect(extractApiErrorCode(new Error("boom"))).toBeUndefined();
    expect(extractApiErrorCode(null)).toBeUndefined();
  });
});

describe("isUnauthorizedError", () => {
  it("code が unauthorized なら true", () => {
    expect(isUnauthorizedError(unauthorizedError)).toBe(true);
  });

  it("401 以外のエラーは false", () => {
    expect(isUnauthorizedError(validationError)).toBe(false);
    expect(isUnauthorizedError(new Error("network"))).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
  });
});

describe("isNetworkError", () => {
  it("素の Error / TypeError はネットワークエラー扱い", () => {
    expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("バックエンドの構造化エラー（{ error }）はネットワークエラーではない", () => {
    expect(isNetworkError(unauthorizedError)).toBe(false);
    expect(isNetworkError(validationError)).toBe(false);
  });

  it("null は false", () => {
    expect(isNetworkError(null)).toBe(false);
  });
});

describe("classifyLoginError", () => {
  it("error が無ければ undefined", () => {
    expect(classifyLoginError(null)).toBeUndefined();
  });

  it("ネットワークエラーは network 種別＋接続確認ヒントを返す", () => {
    const info = classifyLoginError(new Error("Failed to fetch"));
    expect(info?.kind).toBe("network");
    expect(info?.hint).toMatch(/バックエンド/);
  });

  it("401 は unauthorized 種別でサーバーの message を使う", () => {
    const info = classifyLoginError(unauthorizedError);
    expect(info?.kind).toBe("unauthorized");
    expect(info?.message).toBe("メールアドレスまたはパスワードが正しくありません");
    expect(info?.code).toBe("unauthorized");
  });

  it("422 は validation 種別でフィールド別エラーを保持する", () => {
    const info = classifyLoginError(validationError);
    expect(info?.kind).toBe("validation");
    expect(info?.fieldErrors).toEqual({ email: ["は既に使用されています"] });
  });

  it("500 系は server 種別で DB 確認ヒントを返す", () => {
    const serverError = {
      error: { code: "internal_server_error", message: "サーバーエラー", details: {} },
    };
    const info = classifyLoginError(serverError);
    expect(info?.kind).toBe("server");
    expect(info?.hint).toMatch(/DB/);
  });

  it("未知のコードは unknown 種別にフォールバックする", () => {
    const info = classifyLoginError({ error: { code: "teapot", message: "謎", details: {} } });
    expect(info?.kind).toBe("unknown");
    expect(info?.message).toBe("謎");
  });
});
