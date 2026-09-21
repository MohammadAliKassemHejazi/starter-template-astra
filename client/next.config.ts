import type { NextConfig } from 'next';

// Same-site API proxy: the browser only talks to its own origin, so SameSite=Strict cookies work in dev.
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@project/shared'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
