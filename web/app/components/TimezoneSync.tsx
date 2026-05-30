"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
// Import from the client-safe module, NOT viewerTimeZone.ts — the latter
// pulls in next/headers and would break the client bundle build.
import { VIEWER_TZ_COOKIE } from "@/lib/time/viewerTzShared";

/**
 * Bundle 4.2.49 — keeps the `viewer_tz` cookie in sync with the device's
 * actual IANA timezone so server-rendered times display in the viewer's
 * own zone.
 *
 * On mount it reads `Intl.DateTimeFormat().resolvedOptions().timeZone`
 * (the device zone) and, if it differs from the cookie the server saw,
 * writes the cookie and calls `router.refresh()`. The refresh re-runs the
 * server components with the cookie now present — so the SSR'd wall-clock
 * corrects to the device zone — while preserving client state and scroll
 * position (no full reload, no flicker). When the cookie already matches
 * (the common case on repeat loads) nothing happens.
 *
 * Mounted once in (app)/layout.tsx so it covers every authenticated
 * surface (buyer page, workspace, published preview).
 */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const found = document.cookie
    .split("; ")
    .find((c) => c.startsWith(prefix));
  if (!found) return null;
  try {
    return decodeURIComponent(found.slice(prefix.length));
  } catch {
    return found.slice(prefix.length);
  }
}

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    let deviceTz: string | undefined;
    try {
      deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!deviceTz) return;

    if (readCookie(VIEWER_TZ_COOKIE) === deviceTz) return;

    // 1-year, root-path, Lax cookie. Non-sensitive, JS-readable by design.
    document.cookie = `${VIEWER_TZ_COOKIE}=${encodeURIComponent(
      deviceTz,
    )}; path=/; max-age=31536000; SameSite=Lax`;

    // The server rendered with a stale/absent zone — re-render so times
    // correct to the device zone. One-time per zone change.
    router.refresh();
  }, [router]);

  return null;
}
