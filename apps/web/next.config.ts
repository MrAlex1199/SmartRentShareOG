import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // In production, API is on a separate domain (set via NEXT_PUBLIC_API_URL)
  // In development, proxy to local NestJS
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/:path*',
        },
        {
          source: '/auth/:path*',
          destination: 'http://localhost:3001/auth/:path*',
        },
      ];
    },
  }),

  // Render uses standalone builds which are lighter
  output: 'standalone',

  // Allow images from Cloudinary and external sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
      { protocol: 'https', hostname: 'sprofile.line-scdn.net' },
    ],
  },
};

export default nextConfig;
