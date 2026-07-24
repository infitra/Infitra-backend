"use client";

import { useEffect } from "react";

/**
 * Scopes page-level scroll-snap to the LANDING, on MOBILE only.
 *
 * The two story chapters (HowItWorks, LiveWeek) render their dock wrappers as
 * `snap-start` + `snap-stop: always` targets. With the root scroller set to
 * `y proximity` here, a fling toward a chapter is forced to STOP on it
 * (reliable dock — fixes "gentle swipe flies past"), while `proximity` (not
 * `mandatory`) means the long non-chapter stretches — Hero, the carousel,
 * Summary, Finale — never get yanked toward a distant section when you come
 * to rest in them. The per-beat snapping lives in each chapter's INNER
 * scroller, so the page itself carries only 2 sparse snap points and stays
 * native everywhere else.
 *
 * Set post-hydration, removed on unmount: no other route ever inherits root
 * snap (it lives on the shared <html>, so it MUST be torn down on navigate).
 * Desktop keeps its paced position engine untouched — snap is never set there.
 */
export function MobileSnapScope() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const root = document.documentElement.style;
    const prev = root.scrollSnapType;
    root.scrollSnapType = "y proximity";
    return () => {
      root.scrollSnapType = prev;
    };
  }, []);
  return null;
}
