"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";
import { Panel, LabelTag, TaggedInput, Button } from "@/components/ui";

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

        {/* エラー */}
        {error && (
          <div className="flex items-center gap-2.5 mx-5 mt-4 px-3.5 py-2.5 bg-red-500/15 border border-red-500/60 rounded-sm">
            <LabelTag variant="error">ERROR</LabelTag>
            <p className="text-red-300 text-sm m-0">メールアドレスまたはパスワードが正しくありません</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-6">
          <TaggedInput
            tag="必須"
            label="メールアドレス"
            type="email"
            placeholder="example@fumizuki.ac.jp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <TaggedInput
            tag="必須"
            label="パスワード"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" disabled={isPending} fullWidth>
            {isPending ? "召喚中..." : "召喚獣を呼び出す！"}
          </Button>
        </form>

        <div className="px-5 py-3 border-t border-sky-400/20 bg-black/20 text-center">
          <span className="text-slate-400/60 text-[0.7rem] tracking-widest">文月学園 試召システム</span>
        </div>
      </Panel>
    </div>
  );
}
