import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserFormModal, validate, type UserFormValues } from "./UserFormModal";
import type { User } from "@/lib/api/types";

const base: UserFormValues = {
  name: "霧島翔子",
  email: "kirishima@example.com",
  password: "password123",
  role: "student",
};

describe("validate", () => {
  it("正常な入力ならエラーなし（新規作成）", () => {
    expect(validate(base, false)).toEqual({});
  });

  it("氏名が空ならエラー", () => {
    expect(validate({ ...base, name: "  " }, false).name).toBeTruthy();
  });

  it("メール形式が不正ならエラー", () => {
    expect(validate({ ...base, email: "not-an-email" }, false).email).toBeTruthy();
  });

  it("新規作成でパスワード未入力ならエラー", () => {
    expect(validate({ ...base, password: "" }, false).password).toBeTruthy();
  });

  it("編集時はパスワード空欄を許可（据え置き）", () => {
    expect(validate({ ...base, password: "" }, true).password).toBeUndefined();
  });

  it("パスワードが8文字未満ならエラー（編集時に入力した場合も）", () => {
    expect(validate({ ...base, password: "short" }, true).password).toBeTruthy();
  });
});

describe("UserFormModal", () => {
  const editingUser: User = {
    id: 1,
    name: "霧島翔子",
    email: "kirishima@example.com",
    role: "student",
    created_at: "2026-01-01T00:00:00Z",
    school_class: null,
  };

  it("errorMessage を渡すと汎用エラーを表示する", () => {
    render(
      <UserFormModal
        user={editingUser}
        isSubmitting={false}
        errorMessage="このメールアドレスはすでに使用されています"
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("このメールアドレスはすでに使用されています"),
    ).toBeInTheDocument();
  });

  it("serverErrors のフィールド別エラーを表示する", () => {
    render(
      <UserFormModal
        user={editingUser}
        isSubmitting={false}
        serverErrors={{ email: ["は既に使用されています"] }}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/は既に使用されています/)).toBeInTheDocument();
  });

  it("バリデーションエラーがあると onSubmit を呼ばない", async () => {
    const onSubmit = vi.fn();
    render(
      <UserFormModal
        user={null}
        isSubmitting={false}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    // 新規作成で何も入力せず保存 → name/email/password がエラーになる
    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/氏名を入力してください/)).toBeInTheDocument();
  });

  it("正常入力で onSubmit が値とともに呼ばれる", async () => {
    const onSubmit = vi.fn();
    render(
      <UserFormModal
        user={editingUser}
        isSubmitting={false}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "保存する" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "霧島翔子", email: "kirishima@example.com" }),
    );
  });

  it("label と input が htmlFor / id で関連付いている", () => {
    render(
      <UserFormModal
        user={editingUser}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    // アクセシブルネームで input を取得できる = label と紐付いている
    expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
  });
});
