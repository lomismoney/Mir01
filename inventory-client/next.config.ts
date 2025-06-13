import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cssChunking: true,
  },
  eslint: {
    // 僅在開發階段顯示警告，但允許生產階段編譯通過
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
