import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The public pages took the names people already use (27 Sep 2026). Old
  // links, shared or bookmarked, still land in the right place.
  async redirects() {
    return [
      { source: '/roadmap', destination: '/courses', permanent: true },
      { source: '/mindset', destination: '/psychology', permanent: true },
    ];
  },
};

export default nextConfig;
