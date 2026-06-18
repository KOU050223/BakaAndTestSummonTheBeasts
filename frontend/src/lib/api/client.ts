import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema.d";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_URL is required");
}

const fetchClient = createFetchClient<paths>({
  baseUrl: apiBaseUrl,
  credentials: "include", // httpOnly Cookie を自動送信する
});

// 401（未認証）のリダイレクトはここでは行わない。
// 以前は onResponse で window.location.href = "/login" を実行していたが、
// フルページ遷移が走る前に DashboardLayout が描画され「取得に失敗しました」が
// 一瞬見えてしまう問題があった。リダイレクト責務は useCurrentUser /
// DashboardLayout 側（router.replace）に一本化し、ここでは何もしない。
// ログイン画面自体の 401（認証情報誤り）はリダイレクトすべきでないため、
// この方針はその副作用も同時に解消する。

export const $api = createClient(fetchClient);
export { fetchClient };
