import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@redstone/shared',
    '@redstone/api-client',
    '@redstone/markdown',
  ],
  serverExternalPackages: ['@redstone/database'],
};

export default nextConfig;
