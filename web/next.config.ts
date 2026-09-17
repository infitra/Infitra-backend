import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /new was the landing staging surface until 17 Sep 2026, when it
      // replaced /. TEMPORARY on purpose: a 308 is cached by browsers
      // forever, which is what made the last staging round bounce people off
      // /new for days. 307 lets the next staging round just work.
      { source: "/new", destination: "/", permanent: false },
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
