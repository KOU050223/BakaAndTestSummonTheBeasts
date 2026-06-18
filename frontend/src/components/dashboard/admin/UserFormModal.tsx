"use client";

import { useEffect, useState } from "react";
import type { Role, User } from "@/lib/api/types";
import { LabelTag, Button } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/dashboard/navigation";

// 作成・編集を兼ねるユーザーフォームのモーダル。
// user が渡されれば編集モード、null なら新規作成モード。
type UserFormModalProps = {
  user: User | null;
  isSubmitting: boolean;
  // サーバー側のフィールド別バリデーションエラー（{ email: ["..."] } 形式）
  serverErrors?: Record<string, string[]>;
  // フィールドに紐づかない汎用エラー（409 重複など）。
  errorMessage?: string;
  onSubmit: (values: UserFormValues) => void;
  onClose: () => void;
};

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

type FieldErrors = Partial<Record<keyof UserFormValues, string>>;

const ROLE_OPTIONS: Role[] = ["student", "teacher", "school_admin"];

export function validate(values: UserFormValues, isEdit: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) {
    errors.name = "氏名を入力してください";
  }
  if (!values.email.trim()) {
    errors.email = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "正しいメールアドレスの形式で入力してください";
  }
  // 新規作成時はパスワード必須。編集時は空欄なら据え置きのため任意。
  if (!isEdit && !values.password) {
    errors.password = "パスワードを入力してください";
  } else if (values.password && values.password.length < 8) {
    errors.password = "パスワードは8文字以上で入力してください";
  }
  return errors;
}

const inputClass =
  "w-full px-3.5 py-2.5 bg-white/5 border border-sky-400/40 rounded-sm text-sky-100 text-base outline-none transition-all duration-200 placeholder:text-slate-400/50 placeholder:text-sm focus:bg-sky-400/8 focus:border-sky-400 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.2),0_0_12px_rgba(56,189,248,0.2)]";

export function UserFormModal({
  user,
  isSubmitting,
  serverErrors,
  errorMessage,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const isEdit = user != null;
  const [values, setValues] = useState<UserFormValues>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "student",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (field: keyof UserFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate(values, isEdit);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-[rgba(10,30,60,0.95)] border-2 border-sky-400 rounded-sm backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.4)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "ユーザーを編集" : "ユーザーを追加"}
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-sky-400/20 to-sky-400/5 border-b border-sky-400/40">
          <LabelTag variant="info">{isEdit ? "編集" : "新規"}</LabelTag>
          <h2 className="text-xl font-black text-white tracking-wide [text-shadow:0_0_10px_rgba(56,189,248,0.8)]">
            {isEdit ? "ユーザーを編集" : "ユーザーを追加"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-6" noValidate>
          {/* フィールドに紐づかない汎用エラー（メール重複など） */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-sm border border-red-500/60 bg-red-500/15 px-3.5 py-3">
              <LabelTag variant="error">保存失敗</LabelTag>
              <p className="text-sm font-bold text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* 氏名 */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-name" className="flex items-center gap-2.5">
              <LabelTag variant="required">必須</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">氏名</span>
            </label>
            <input
              id="user-name"
              type="text"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
            {fieldErrors.name && (
              <p className="text-red-400 text-xs">⚠ {fieldErrors.name}</p>
            )}
          </div>

          {/* メールアドレス */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-email" className="flex items-center gap-2.5">
              <LabelTag variant="required">必須</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">メールアドレス</span>
            </label>
            <input
              id="user-email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
            {(fieldErrors.email || serverErrors?.email) && (
              <p className="text-red-400 text-xs">
                ⚠ {fieldErrors.email ?? serverErrors?.email?.[0]}
              </p>
            )}
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-password" className="flex items-center gap-2.5">
              <LabelTag variant={isEdit ? "info" : "required"}>{isEdit ? "任意" : "必須"}</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">パスワード</span>
            </label>
            <input
              id="user-password"
              type="password"
              value={values.password}
              onChange={(e) => update("password", e.target.value)}
              autoComplete="new-password"
              placeholder={isEdit ? "変更する場合のみ入力" : "8文字以上"}
              className={inputClass}
            />
            {fieldErrors.password && (
              <p className="text-red-400 text-xs">⚠ {fieldErrors.password}</p>
            )}
          </div>

          {/* ロール */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-role" className="flex items-center gap-2.5">
              <LabelTag variant="required">必須</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">ロール</span>
            </label>
            <select
              id="user-role"
              value={values.role}
              onChange={(e) => update("role", e.target.value)}
              className={inputClass}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role} className="bg-[#0a1628]">
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 rounded-sm border border-sky-400/40 text-sky-200 text-sm font-bold tracking-widest transition-colors hover:bg-sky-400/10 disabled:opacity-60"
            >
              キャンセル
            </button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
