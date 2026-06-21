import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // リポジトリ直下の package-lock.json があると Turbopack が monorepo ルートを誤認識し、
  // node_modules 解決や CSS @import が frontend 基準にならない。frontend を明示する。
  turbopack: {
    root: frontendRoot,
  },
};

export default nextConfig;
