/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  // Отключить x-powered-by
  poweredByHeader: false,
};

module.exports = nextConfig;
