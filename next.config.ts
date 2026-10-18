import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output for Docker / PM2 deployment.
  output: "standalone",
  poweredByHeader: false,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/(media|models|brand)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
