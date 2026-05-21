/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL || 'http://backend:8080';
    const apiImageUrl = process.env.API_IMAGE_URL || 'http://api-server:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/api-images/:path*',
        destination: `${apiImageUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
