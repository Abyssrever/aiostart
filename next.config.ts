import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 构建时忽略 ESLint 报错（例如 no-explicit-any）
    ignoreDuringBuilds: true,
  },
<<<<<<< HEAD
=======
  // 添加favicon处理配置
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ico|png|jpg|jpeg|gif|svg)$/,
      type: 'asset/resource',
    });
    return config;
  },
>>>>>>> bcb66815474adaa2f542b639cde27c0e04e13652
};

export default nextConfig;
