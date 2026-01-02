import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || process.env.name_app || 'WebFireSale',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default nextConfig;
