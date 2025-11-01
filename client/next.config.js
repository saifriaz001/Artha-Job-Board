/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "your-api-domain.com"], // adjust if you use Next Image
  },
};

export default nextConfig;
