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

  // Proxy all /api/* requests to the backend API server-side so the browser
  // only ever talks to the web app's own origin. This eliminates cross-origin
  // cookie issues (LibreWolf / Firefox strict ETP, Safari ITP, etc.) because
  // the refresh-token cookie is set and read on the same domain.
  //
  // INTERNAL_API_URL — set this on the Railway web service to the API's URL.
  // Use the private Railway URL (http://<name>.railway.internal:8080) if private
  // networking is enabled, otherwise use the public API URL.
  async rewrites() {
    const apiUrl = process.env.INTERNAL_API_URL
    if (!apiUrl) return []
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
