/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  transpilePackages: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine', '@remixicon/react'],
};

export default nextConfig;