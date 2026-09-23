/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  // Deliberately absent: typescript.ignoreBuildErrors and eslint.ignoreDuringBuilds.
  // If the build fails, the fix is the code, not the config.
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip authoring comments and dev-only logging from the shipped bundle.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
