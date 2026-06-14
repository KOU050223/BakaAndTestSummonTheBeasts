"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { $api } from "@/lib/api/client";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
      <h1 className="text-xl font-bold">ログイン</h1>

      {error && (
        <p className="text-red-500 text-sm">
          メールアドレスまたはパスワードが正しくありません
        </p>
      )}

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        className="border rounded px-3 py-2"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
