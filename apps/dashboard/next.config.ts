import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Belt-and-braces with the layout's metadata.robots: the dashboard is
  // never crawlable, whatever a page forgets.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
