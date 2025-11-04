import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  crossOrigin: 'anonymous',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.leparidancenter.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dance-at-le-pari.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i3.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Set turbopack root to resolve workspace warnings
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
