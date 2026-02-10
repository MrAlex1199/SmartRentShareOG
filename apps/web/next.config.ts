import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*', // Proxy to NestJS
      },
      {
        source: '/auth/:path*', // Also proxy auth routes if they are not under /api prefix
        destination: 'http://localhost:3001/auth/:path*',
      }
    ];
  },
};

export default nextConfig;
