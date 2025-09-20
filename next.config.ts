import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable additional checks during development for safer delivery
  reactStrictMode: true,
  // Move build output into a custom directory (helps avoid special FS behaviors)
  distDir: "build",
  // Surface the package version to the client so the UI can display it (keeps UI/docs/package aligned)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version as string,
  },
};

export default nextConfig;
