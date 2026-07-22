import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.infitra.fit";

/**
 * The public marketing surface only. The (app) and (auth) route groups are
 * private/functional (dashboard, checkout, login, …) and stay out of search.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/apply`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pilot-terms`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
