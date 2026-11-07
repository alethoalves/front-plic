import { landingRewrites } from "./lib/landing.mjs";

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
  // A raiz (e os arquivos da landing) vem de contato.plic.app.br — ver lib/landing.mjs.
  async rewrites() {
    return { beforeFiles: landingRewrites() };
  },
};

export default nextConfig;