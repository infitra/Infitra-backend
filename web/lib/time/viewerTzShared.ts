/**
 * Bundle 4.2.49 — client-safe timezone primitives.
 *
 * This module deliberately has NO `next/headers` (or any server-only)
 * import so it can be pulled into BOTH the server resolver
 * (viewerTimeZone.ts) and the client component (TimezoneSync.tsx).
 *
 * Keeping the shared cookie name + the pure validator here is what lets
 * the client component reference VIEWER_TZ_COOKIE without dragging the
 * server-only `next/headers` dependency into the browser bundle (which
 * is a hard build error under the App Router).
 */

export const VIEWER_TZ_COOKIE = "viewer_tz";

/** Returns true if `tz` is a usable IANA timezone the runtime recognises. */
export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    // Throws RangeError for an unknown/invalid timeZone.
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
