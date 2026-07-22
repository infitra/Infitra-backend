import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infitra.fit";

/**
 * Crawlers welcome on the marketing surface; the private app/auth routes are
 * disallowed. Points at the sitemap so it's actually discovered.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/me", "/onboarding", "/checkout", "/login", "/beta-access"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
