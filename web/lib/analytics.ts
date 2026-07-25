/**
 * Minimal Plausible custom-event helper.
 *
 * No-ops whenever Plausible isn't loaded — which is the case until
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set (see app/layout.tsx), and always in
 * local dev — so callers never need to guard. Plausible is cookieless, so no
 * consent banner is required for these events. Portable by design: swapping
 * analytics providers is a change to this one file plus the layout script.
 */

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean>; callback?: () => void },
    ) => void;
  }
}

export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  window.plausible?.(event, props ? { props } : undefined);
}
