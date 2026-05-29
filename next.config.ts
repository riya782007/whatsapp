import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Only type-check src/ — mobile-app is excluded via tsconfig include paths
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
