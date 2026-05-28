/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'res.cloudinary.com',
      },
      {
        hostname: 'randomuser.me',
      },
      {
        hostname: 'med.gov.bz',
      },
    ],
  },
};

export default nextConfig;
