"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";
import "./login.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: login, isPending, error } = $api.useMutation(
    "post",
    "/api/auth/login",
    {
      onSuccess() {
        router.push("/");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ body: { email, password } });
  };

  return (
    <div className="login-wrapper">
      {/* 背景の星エフェクト */}
      <div className="stars-bg" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`star star-${i % 5}`} style={{
            left: `${(i * 17 + 7) % 100}%`,
            top: `${(i * 23 + 11) % 100}%`,
            animationDelay: `${(i * 0.3) % 2}s`,
          }} />
        ))}
      </div>

      {/* メインカード */}
      <div className="login-card">
        {/* タイトルパネル */}
        <div className="title-panel">
          <span className="title-label">試召戦争</span>
          <h1 className="title-text">ログイン</h1>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="error-panel">
            <span className="error-label">ERROR</span>
            <p className="error-text">メールアドレスまたはパスワードが正しくありません</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* メールアドレス */}
          <div className="field-group">
            <label className="field-label">
              <span className="field-tag">必須</span>
              <span className="field-name">メールアドレス</span>
            </label>
            <input
              type="email"
              placeholder="example@fumizuki.ac.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field-input"
            />
          </div>

          {/* パスワード */}
          <div className="field-group">
            <label className="field-label">
              <span className="field-tag">必須</span>
              <span className="field-name">パスワード</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="field-input"
            />
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isPending}
            className="submit-btn"
          >
            {isPending ? (
              <span className="btn-pending">召喚中...</span>
            ) : (
              <span className="btn-text">召喚獣を呼び出す！</span>
            )}
          </button>
        </form>

        {/* フッター */}
        <div className="card-footer">
          <span className="footer-text">文月学園 試召システム</span>
        </div>
      </div>
    </div>
  );
}
