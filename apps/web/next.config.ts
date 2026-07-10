import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@redstone/shared',
    '@redstone/api-client',
    '@redstone/markdown',
  ],
  serverExternalPackages: ['@redstone/database'],
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
