/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@promanage/ui-components',
    '@promanage/core',
    '@promanage/api-client',
  ],
}

module.exports = nextConfig
