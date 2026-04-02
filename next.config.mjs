/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove image optimization temporarily due to build issues
  // Re-enable once all images are properly formatted
  images: {
    unoptimized: true,
  },
  // Streaming and incremental static regeneration
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  // Better compression and caching
  compress: true,
  // Enable SWR for stale-while-revalidate pattern
  onDemandEntries: {
    maxInactiveAge: 60000, // 1 minute
    pagesBufferLength: 5,
  },
  // Disable production source maps for smaller bundle
  productionBrowserSourceMaps: false,
}

export default nextConfig
