"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "@/lib/api/client";
import { classifyLoginError, type LoginErrorKind } from "@/lib/api/errors";
import { Panel, LabelTag, Button } from "@/components/ui";

// エラー種別ごとの見出しラベル（開発中の切り分け用に種別が一目で分かるようにする）。
const ERROR_LABEL: Record<LoginErrorKind, string> = {
  unauthorized: "召喚失敗",
  validation: "入力エラー",
  network: "接続エラー",
  server: "サーバーエラー",
  unknown: "エラー",
};

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) {
    errors.email = "メールアドレスを入力してください";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "正しいメールアドレスの形式で入力してください（例：yoshii@fumizuki.ac.jp）";
  }
  if (!password) {
    errors.password = "パスワードを入力してください";
  } else if (password.length < 6) {
    errors.password = "パスワードは6文字以上で入力してください";
  }
  return errors;
}

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const { mutate: login, isPending, error: apiError } = $api.useMutation(
    "post",
    "/api/auth/login",
    {
      onSuccess() {
        queryClient.clear();
        router.push("/");
      },
    }
  );

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors(validate(email, password));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length > 0) return;
    login({ body: { email, password } });
  };

  const loginError = classifyLoginError(apiError);
  // 422 のフィールド別エラー（サーバー由来）をクライアント検証エラーにマージして表示する。
  const serverFieldErrors = loginError?.fieldErrors;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d2447] to-[#0a3a5c] overflow-hidden p-4">
      {/* 背景の星エフェクト */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={[
              "absolute rounded-full animate-pulse",
              i % 5 === 0 ? "w-1.5 h-1.5 bg-white opacity-90" : "",
              i % 5 === 1 ? "w-1 h-1 bg-white opacity-70" : "",
              i % 5 === 2 ? "w-2 h-2 bg-sky-300 opacity-80 [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" : "",
              i % 5 === 3 ? "w-1 h-1 bg-white opacity-60" : "",
              i % 5 === 4 ? "w-2.5 h-2.5 bg-violet-300 opacity-80 [clip-path:polygon(50%_0%,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]" : "",
            ].join(" ")}
            style={{
              left: `${(i * 17 + 7) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
              animationDelay: `${(i * 0.3) % 2}s`,
            }}
          />
        ))}
      </div>

      <Panel className="w-full max-w-sm">
        {/* タイトル */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-sky-400/20 to-sky-400/5 border-b border-sky-400/40">
          <LabelTag variant="info">試召戦争</LabelTag>
          <h1 className="text-2xl font-black text-white tracking-wide [text-shadow:0_0_10px_rgba(56,189,248,0.8),0_0_20px_rgba(56,189,248,0.4)]">
            ログイン
          </h1>
        </div>

        {/* API エラー（種別ごとに文言・ヒントを出し分ける） */}
        {loginError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 mx-5 mt-4 px-3.5 py-3 bg-red-500/15 border border-red-500/60 rounded-sm"
          >
            <LabelTag variant="error">{ERROR_LABEL[loginError.kind]}</LabelTag>
            <div className="flex flex-col gap-0.5">
              <p className="text-red-300 text-sm font-bold m-0">{loginError.message}</p>
              {loginError.hint && (
                <p className="text-red-300/70 text-xs m-0">{loginError.hint}</p>
              )}
              {loginError.code && (
                <p className="text-red-300/50 text-[0.65rem] font-mono mt-0.5 m-0">
                  code: {loginError.code}
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-6" noValidate>
          {/* メールアドレス */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-default">
              <LabelTag variant="required">必須</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">メールアドレス</span>
            </label>
            <input
              type="email"
              placeholder="example@fumizuki.ac.jp"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setFieldErrors(validate(e.target.value, password));
              }}
              onBlur={() => handleBlur("email")}
              onFocus={() => setTouched((prev) => ({ ...prev, email: true }))}
              required
              autoComplete="email"
              className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-sm text-sky-100 text-base outline-none transition-all duration-200 placeholder:text-slate-400/50 placeholder:text-sm focus:bg-sky-400/8 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.2),0_0_12px_rgba(56,189,248,0.2)] ${
                (touched.email && fieldErrors.email) || serverFieldErrors?.email
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-sky-400/40 focus:border-sky-400"
              }`}
            />
            {touched.email && fieldErrors.email ? (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span>⚠</span> {fieldErrors.email}
              </p>
            ) : serverFieldErrors?.email ? (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span>⚠</span> {serverFieldErrors.email.join(" / ")}
              </p>
            ) : (
              <p className="text-slate-400/60 text-xs">
                登録済みのメールアドレスを入力してください
              </p>
            )}
          </div>

          {/* パスワード */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-default">
              <LabelTag variant="required">必須</LabelTag>
              <span className="text-blue-300 text-sm font-semibold tracking-wide">パスワード</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) setFieldErrors(validate(email, e.target.value));
              }}
              onBlur={() => handleBlur("password")}
              required
              autoComplete="current-password"
              className={`w-full px-3.5 py-2.5 bg-white/5 border rounded-sm text-sky-100 text-base outline-none transition-all duration-200 placeholder:text-slate-400/50 placeholder:text-sm focus:bg-sky-400/8 focus:shadow-[0_0_0_2px_rgba(56,189,248,0.2),0_0_12px_rgba(56,189,248,0.2)] ${
                (touched.password && fieldErrors.password) || serverFieldErrors?.password
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-sky-400/40 focus:border-sky-400"
              }`}
            />
            {touched.password && fieldErrors.password ? (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span>⚠</span> {fieldErrors.password}
              </p>
            ) : serverFieldErrors?.password ? (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span>⚠</span> {serverFieldErrors.password.join(" / ")}
              </p>
            ) : (
              <p className="text-slate-400/60 text-xs">
                6文字以上のパスワードを入力してください
              </p>
            )}
          </div>

          <Button type="submit" disabled={isPending} fullWidth>
            {isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <div className="px-5 py-3 border-t border-sky-400/20 bg-black/20 space-y-1 text-center">
          <p className="text-slate-400/80 text-xs">
            アカウントは管理者が発行します。お持ちでない方は管理者にお問い合わせください。
          </p>
          <p className="text-slate-400/50">
            デバッグ用アカウントは Topa`z を参照してください。
          </p>
          <span className="text-slate-400/40 text-[0.65rem] tracking-widest">文月学園 試召システム</span>
        </div>
      </Panel>
    </div>
  );
}
