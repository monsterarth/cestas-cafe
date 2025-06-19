/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // A linha 'unoptimized: true' foi removida.
    // Agora adicionamos o remotePatterns para o domínio do Vercel Blob.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
        port: '',
        pathname: '/:path*', // Permite qualquer caminho dentro do hostname
      },
    ],
  },
};

export default nextConfig;