"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const INK = "#0F2229";
const CREAM = "#F2EFE8";

/**
 * The landing's nav, taught about the dark stage.
 *
 * The cream blur bar is right for the light page and wrong across the top of
 * the dark hero, where it reads as a pale stripe cutting the stage. So the
 * bar is transparent while the stage is on screen and fades its cream layer
 * in once the hero has scrolled past.
 *
 * At the same moment it picks up the ask. The stage puts its button after the
 * faces, which is the right story order and costs the button its place above
 * the fold, so from the moment the stage is behind the reader the bar carries
 * it instead: the ask is never off screen again. Sign in is an outlined pill
 * that reads on either ground, present but not competing: the orange belongs
 * to the one action that matters.
 *
 * Scroll thresholds rather than an observer: deterministic, verifiable
 * without a paint, and degrading to the cream bar on any page with no stage.
 * Sections that carry the dark ground mark themselves [data-dark], so the bar
 * knows where the dark actually ends rather than assuming it ends with the
 * hero.
 */
export function StageNav() {
  const [solid, setSolid] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const stage = document.getElementById("stage");
    if (!stage) {
      setSolid(true);
      setAsking(true);
      return;
    }
    // Two edges, because the dark run is longer than the stage. The bar stays
    // transparent while any dark section is under it, and the ask appears as
    // soon as the stage's own button has scrolled away.
    const darks = document.querySelectorAll("[data-dark]");
    const lastDark = (darks[darks.length - 1] as HTMLElement | undefined) ?? stage;
    const edge = (el: HTMLElement) => el.getBoundingClientRect().bottom + window.scrollY - 56;
    let darkEnds = edge(lastDark);
    let stageEnds = edge(stage);
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > darkEnds);
      setAsking(y > stageEnds);
    };
    const onResize = () => {
      darkEnds = edge(lastDark);
      stageEnds = edge(stage);
      onScroll();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <nav className="fixed top-0 w-full z-40">
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(242, 239, 232, 0.55)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
          opacity: solid ? 1 : 0,
          transition: "opacity 260ms ease",
          pointerEvents: "none",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/new" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="INFITRA" width={34} height={34} className="block rounded-lg" />
          <span
            className="text-[22px] tracking-tight font-headline leading-none"
            style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            INFITRA
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-[11px] sm:text-xs font-headline font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300"
            style={
              solid
                ? { color: INK, border: "1px solid rgba(15,34,41,0.28)", backgroundColor: "rgba(255,255,255,0.55)" }
                : {
                    // The stage is not all dark: the card band scrolls under
                    // this bar. A teal fill, the same one the band's arrows
                    // wear, keeps cream type legible over a cream card and
                    // still reads as almost nothing over the stage itself.
                    color: CREAM,
                    border: "1px solid rgba(242,239,232,0.45)",
                    backgroundColor: "rgba(12,38,46,0.55)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }
            }
          >
            Sign in
          </Link>
          <Link
            href="/apply"
            aria-hidden={!asking}
            tabIndex={asking ? undefined : -1}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest whitespace-nowrap transition-opacity duration-300 ${asking ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join the founding network</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
