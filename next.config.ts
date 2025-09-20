import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable additional checks during development for safer delivery
  reactStrictMode: true,
  // Surface the package version to the client so the UI can display it (keeps UI/docs/package aligned)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version as string,
  },
  async redirects() {
    return [
      { source: "/matrix", destination: "/kanban", permanent: true },
      { source: "/business", destination: "/kanban", permanent: true },
      { source: "/archive", destination: "/kanban", permanent: true },
      { source: "/proof", destination: "/kanban", permanent: true },
    ]
  },
};

export default nextConfig;
