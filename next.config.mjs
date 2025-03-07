/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
    images: {
      domains: ['storage.googleapis.com'], // Adicione aqui o domínio onde as imagens estão armazenadas
    },
  };
  
  export default nextConfig;