const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker — bundles server + dependencies into .next/standalone
  output: 'standalone',
  // Tell Next.js to trace files from the monorepo root so workspace packages are included
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@promanage/ui-components',
    '@promanage/core',
    '@promanage/api-client',
  ],
}

module.exports = nextConfig
