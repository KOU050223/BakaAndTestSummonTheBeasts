import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema.d";

const fetchClient = createFetchClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  credentials: "include", // httpOnly Cookie を自動送信する
});

// 401 はセッション期限切れとみなしてログインページへリダイレクト
fetchClient.use({
  onResponse({ response }) {
    if (response.status === 401 && typeof window !== "undefined") {
      const isLoginPage = window.location.pathname === "/login";
      if (!isLoginPage) {
        window.location.href = "/login";
      }
    }
    return response;
  },
});

export const $api = createClient(fetchClient);
export { fetchClient };
