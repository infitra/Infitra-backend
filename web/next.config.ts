import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /new is the landing staging surface again (11 Sep 2026): the next
      // landing is built and polished there before it replaces /. The old
      // "/new → /" permanent redirect is gone, but browsers cache 308s, so a
      // stale client may still bounce to the homepage until it is cleared.
      // Founding network routes were renamed on 6 Sep 2026 before any link went out.
      { source: "/community", destination: "/network", permanent: true },
      { source: "/founding-group", destination: "/founding-network", permanent: true },
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
