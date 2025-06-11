import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cssChunking: true,
  },
};

export default nextConfig;
