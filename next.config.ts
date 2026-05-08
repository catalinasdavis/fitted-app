import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/coming-soon.html",
        },
      ],
    };
  },
};

export default nextConfig;
