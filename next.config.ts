import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  env: {
    APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
