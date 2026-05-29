import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from scanning the React Native mobile app folder
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/mobile-app/**", "**/node_modules/**"],
    };
    return config;
  },
};

export default nextConfig;
