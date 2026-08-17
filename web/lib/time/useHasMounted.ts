"use client";

import { useSyncExternalStore } from "react";

/**
 * True after hydration, false during SSR and the hydration render.
 *
 * THE TRAP THIS EXISTS FOR: a client component that formats a Date in the
 * viewer's device timezone renders UTC on the server. If the element also
 * carries suppressHydrationWarning, React keeps the server text on mismatch
 * AND records the client value — so later renders produce the same client
 * value, never diff, and the wrong UTC string stays on screen forever
 * (found 2026-08-17: the space's journey card showed 14:00 for a 16:00
 * session). Gate the absolute-time string behind this hook so the
 * post-mount value differs from the hydration value and forces the patch.
 *
 * useSyncExternalStore (rather than useEffect+setState) guarantees the
 * re-render fires immediately after hydration.
 */
const subscribe = () => () => {};

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
