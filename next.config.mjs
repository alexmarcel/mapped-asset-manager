/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false
    };
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
