import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The landing was polished at /new, then promoted to /. Links from the
      // polishing phase (and anyone's open tabs) land home permanently.
      { source: "/new", destination: "/", permanent: true },
    ];
  },
  images: {
    // Allow next/image to optimize Supabase Storage public object URLs.
    // The Vercel optimizer fetches the (large) source PNG server-side once,
    // caches it at the edge, and serves a correctly-sized WebP to the
    // browser — so the client never downloads the full-resolution image.
    // When we later enable Supabase Pro image transforms, this stays; we
    // only add a custom `loader` so even the server-side fetch is small.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "okcujzmlpwijjxwhuehe.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Unsplash source images used for test/demo challenges & sessions.
        // next/image rejects (renders a broken "?") any remote host not
        // listed here, which is why the demo's Unsplash covers vanished.
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
