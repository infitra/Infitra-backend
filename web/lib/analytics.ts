/**
 * Minimal analytics custom-event helper — Umami implementation.
 *
 * No-ops whenever Umami isn't loaded — which is the case until
 * NEXT_PUBLIC_UMAMI_WEBSITE_ID is set (see app/layout.tsx), and always in
 * local dev — so callers never need to guard. Umami is cookieless, so no
 * consent banner is required for these events. Portable by design: swapping
 * analytics providers is a change to this one file plus the layout script;
 * call sites only ever use trackEvent(). (This file previously targeted
 * Plausible, replaced before activation because Plausible is paid.)
 *
 * Events fired before the deferred script loads are dropped rather than
 * queued. Acceptable: every instrumented event is user-interaction-driven
 * and fires well after page load.
 */

declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>,
      ) => void;
    };
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, props);
}
