/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      // Local API uploads (dev).
      { protocol: 'http', hostname: 'localhost', port: '4000', pathname: '/uploads/**' },
      // Production image hosts:
      //  - images.afrizonemart.com — custom R2 domain (preferred)
      //  - *.r2.dev               — fallback while custom domain is propagating
      //  - api.afrizonemart.com   — for any /uploads/* assets that linger from dev seed data
      { protocol: 'https', hostname: 'images.afrizonemart.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'api.afrizonemart.com', pathname: '/uploads/**' },
    ],
  },
};

export default nextConfig;
