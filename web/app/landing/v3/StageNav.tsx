"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The landing's nav.
 *
 * The bar takes its tone from whatever is actually behind it, sampled under
 * its own bottom edge on every scroll. A cream bar is right over the cream
 * page and turns into a grey slab the moment a dark chapter passes beneath
 * it, and this page alternates dark and light several times, including inside
 * the shared showcase, which this file cannot annotate. Sampling is the only
 * version that stays right everywhere.
 *
 * The ask appears once the stage's own button has scrolled away, and it sits
 * directly beside Sign in at the outer edge, so the bar reads as one group
 * rather than three things spread across the width.
 */
const INK = "#0F2229";
const CREAM = "#F2EFE8";

export function StageNav() {
  const [dark, setDark] = useState(true);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const stage = document.getElementById("stage");

    /** What is under the bar right now: walk up from the point just below it
     *  to the first element that actually paints a background. */
    const tone = () => {
      const el = document.elementFromPoint(Math.round(window.innerWidth / 2), 72);
      let node: Element | null = el;
      while (node) {
        const parts = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
        if (parts && parts.length >= 3) {
          const [r, g, b] = parts.map(Number);
          const a = parts.length > 3 ? Number(parts[3]) : 1;
          if (a > 0.5) {
            setDark((0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5);
            return;
          }
        }
        node = node.parentElement;
      }
    };

    const edge = () => (stage ? stage.getBoundingClientRect().bottom + window.scrollY - 56 : 0);
    let stageEnds = edge();

    const onScroll = () => {
      setAsking(!stage || window.scrollY > stageEnds);
      tone();
    };
    const onResize = () => {
      stageEnds = edge();
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
          background: dark ? "rgba(12, 38, 46, 0.72)" : "rgba(242, 239, 232, 0.62)",
          backdropFilter: "blur(20px) saturate(1.2)",
          WebkitBackdropFilter: "blur(20px) saturate(1.2)",
          borderBottom: dark ? "1px solid rgba(242,239,232,0.10)" : "1px solid rgba(255, 255, 255, 0.25)",
          transition: "background 260ms ease, border-color 260ms ease",
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

        <div className="flex items-center gap-3 sm:gap-4">
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
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-[11px] sm:text-xs font-headline font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300"
            style={
              dark
                ? { color: CREAM, border: "1px solid rgba(242,239,232,0.45)" }
                : { color: INK, border: "1px solid rgba(15,34,41,0.28)" }
            }
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}
