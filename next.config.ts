import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The platform overview was folded into the home page; keep the old URL
      // working for anything already pointing at it.
      { source: "/platform", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
