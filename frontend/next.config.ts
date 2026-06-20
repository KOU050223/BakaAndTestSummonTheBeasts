import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 は Turbopack がデフォルト。three.js / @pixiv/three-vrm は
  // クライアント専用描画（"use client"）で使うため、追加の resolve 設定は不要。
  // 空の turbopack 設定を置くことで、webpack カスタム設定との競合警告も避ける。
  turbopack: {},
};

export default nextConfig;
