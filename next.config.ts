import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Keep these as runtime externals so the standalone output includes them in
  // node_modules rather than bundling them into webpack chunks. Required for
  // the migration script to be able to import them at container startup.
  serverExternalPackages: ['drizzle-orm', 'postgres'],
allowedDevOrigins: ['opengifame.dev.fergl.ie'],
  async rewrites() {
    return [
      { source: '/@:slug', destination: '/user/:slug' },
    ];
  },
  images: {
    // Allow next/image to optimize avatars served by the OAuth providers.
    // Locally uploaded images (/uploads/*) are same-origin and need no entry.
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' }, // Facebook
      { protocol: 'https', hostname: '*.fbcdn.net' }, // Facebook CDN
    ],
  },
};

export default nextConfig;
