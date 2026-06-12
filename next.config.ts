import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['opengifame.dev.fergl.ie'],
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
