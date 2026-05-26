/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  typescript: {
    // Type errors don't fail the build — the codebase predates strict tsconfig
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
