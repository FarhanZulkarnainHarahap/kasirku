import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
  poweredByHeader: false,
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

    if (!apiTarget) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
