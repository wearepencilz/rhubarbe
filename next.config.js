/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts'], // Only look for .tsx and .ts files, ignore .jsx
  
  // Development optimizations
  reactStrictMode: false, // Disable strict mode in dev for faster rendering
  
  // Reduce logging noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Suppress webpack warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  
  // Tree-shake icon imports
  modularizeImports: {
    '@untitledui/icons': {
      transform: '@untitledui/icons/{{member}}',
    },
  },
  
  // Match Vercel production: fail builds on type/lint errors
  typescript: {
    // Set to false to catch TS errors locally before pushing
    ignoreBuildErrors: false,
  },
  eslint: {
    // Set to false to catch lint errors locally before pushing
    ignoreDuringBuilds: false,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize compilation - add date picker dependencies
    optimizePackageImports: [
      'react-icons', 
      'framer-motion',
      '@internationalized/date',
      'react-aria-components',
      '@untitledui/icons'
    ],
  },
  
  // Faster builds in development
  swcMinify: true,
  
  webpack: (config, { isServer, dev }) => {
    // Suppress noisy warnings
    config.infrastructureLogging = {
      level: 'error',
    };
    
    // Fix for next-auth module resolution on mobile/different networks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Speed up development builds
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
};

export default nextConfig;
