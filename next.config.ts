import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 构建时忽略 ESLint 报错（例如 no-explicit-any）
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
