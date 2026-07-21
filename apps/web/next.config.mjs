/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/i18n", "@workspace/db"],
}

export default nextConfig
