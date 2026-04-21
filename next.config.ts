import path from "node:path";
import type { NextConfig } from "next";

export const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
};

export default nextConfig;
