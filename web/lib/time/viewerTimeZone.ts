import { cookies, headers } from "next/headers";
import { VIEWER_TZ_COOKIE, isValidTimeZone } from "./viewerTzShared";

// Re-export the client-safe primitives so existing server-side importers
// of "@/lib/time/viewerTimeZone" keep working unchanged. Client components
// must import these from "./viewerTzShared" directly — this module pulls in
// next/headers and so cannot be bundled for the browser.
export { VIEWER_TZ_COOKIE, isValidTimeZone };

/**
 * Bundle 4.2.49 — per-viewer timezone resolution (server side).
 *
 * Times are stored in UTC (DB truth) and must display in the VIEWER's
 * own timezone — for creators and participants alike. Because the buyer
 * page is server-rendered, the server has to know the viewer's zone at
 * render time, otherwise SSR (which runs in UTC) and client hydration
 * (browser zone) disagree and the times flicker.
 *
 * We resolve a single IANA zone here and pass it down as an explicit
 * `timeZone` prop so SSR and hydration format identically — deterministic
 * and correct to wherever the viewer actually is. Resolution order:
 *
 *   1. `viewer_tz` cookie — the device's own IANA zone, written by the
 *      TimezoneSync client component on mount (most accurate to the user).
 *   2. `x-vercel-ip-timezone` header — IP geolocation zone Vercel injects.
 *      Covers the very first paint before the cookie exists.
 *   3. DEFAULT_TIME_ZONE — local-dev / unknown fallback.
 */

// Fallback only hit when neither the cookie nor the Vercel IP header is
// present (e.g. local dev). Asia/Phnom_Penh matches where the pilot is
// being run from, so dev renders a sensible wall-clock until the cookie
// round-trips.
const DEFAULT_TIME_ZONE = "Asia/Phnom_Penh";

export async function resolveViewerTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(VIEWER_TZ_COOKIE)?.value;
  // Cookie value may be percent-encoded ("Asia%2FPhnom_Penh"); decode it.
  let fromCookie: string | undefined;
  if (rawCookie) {
    try {
      fromCookie = decodeURIComponent(rawCookie);
    } catch {
      fromCookie = rawCookie;
    }
  }
  if (isValidTimeZone(fromCookie)) return fromCookie;

  const headerStore = await headers();
  const fromIp = headerStore.get("x-vercel-ip-timezone");
  if (isValidTimeZone(fromIp)) return fromIp;

  return DEFAULT_TIME_ZONE;
}
