import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The platform overview was folded into the home page; keep the old URL
      // working for anything already pointing at it.
      { source: "/platform", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
