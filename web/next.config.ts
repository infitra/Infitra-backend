import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
