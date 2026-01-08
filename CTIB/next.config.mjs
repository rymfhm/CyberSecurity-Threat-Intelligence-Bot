/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Fix for chromadb trying to import from unpkg.com
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'chromadb-default-embed': 'commonjs chromadb-default-embed',
      });
    }
    return config;
  },
};

export default nextConfig;

