/** @type {import('next').NextConfig} */
const nextConfig = {
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
