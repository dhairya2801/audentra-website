import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The platform overview and Why Audentra were folded into the home page;
      // keep the old URLs working for anything already pointing at them.
      { source: "/platform", destination: "/", permanent: true },
      { source: "/why-audentra", destination: "/#why-audentra", permanent: true },
    ];
  },
};

export default nextConfig;
