"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The landing's nav, taught about the dark stage.
 *
 * The cream blur bar is right for the light page and wrong across the top of
 * the dark hero, where it reads as a pale stripe cutting the stage. So the
 * bar is transparent while the stage is on screen and fades its cream layer
 * in once the hero has scrolled past.
 *
 * A scroll threshold rather than an observer: it is deterministic, it can be
 * verified without a paint, and it degrades to the cream bar on any page that
 * has no stage.
 */
export function StageNav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const stage = document.getElementById("stage");
    if (!stage) {
      setSolid(true);
      return;
    }
    // The bar turns cream once the stage's bottom edge passes under it: the
    // edge in document space, less the height of the bar itself.
    const measure = () => stage.getBoundingClientRect().bottom + window.scrollY - 56;
    let past = measure();
    const onScroll = () => setSolid(window.scrollY > past);
    const onResize = () => {
      past = measure();
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
        <Link
          href="/login"
          className="px-4 sm:px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest whitespace-nowrap"
          style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
        >
          Sign in
        </Link>
      </div>
    </nav>
  );
}
