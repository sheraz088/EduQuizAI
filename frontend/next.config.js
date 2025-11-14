/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@supabase/supabase-js'],
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
