// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Supabase storage if you use avatars or material photos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Strict mode helps catch bugs early during development
  reactStrictMode: true,
}

module.exports = nextConfig
