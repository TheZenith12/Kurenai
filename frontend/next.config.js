/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-avatar',
      '@radix-ui/react-progress',
      'clsx',
      'date-fns',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.animeplatform.mn' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001/api/v1'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
