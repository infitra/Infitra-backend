"use client";

import { useEffect, useRef } from "react";

/**
 * The vignette language — shared primitives for showing INFITRA decomposed
 * (pliability-style): real UI atoms at landing scale, layered in depth,
 * drifting gently with scroll. Plus the ONE shared rAF scroll store every
 * scroll-linked piece subscribes to (a single window listener for the page).
 */

/* ── Shared scroll store ───────────────────────────────────── */

type Fn = () => void;
const listeners = new Set<Fn>();
let rafId = 0;

function pump() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    listeners.forEach((l) => l());
  });
}

export function subscribeScroll(fn: Fn): Fn {
  if (typeof window === "undefined") return () => {};
  if (listeners.size === 0) {
    window.addEventListener("scroll", pump, { passive: true });
    window.addEventListener("resize", pump);
  }
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      window.removeEventListener("scroll", pump);
      window.removeEventListener("resize", pump);
    }
  };
}

/* ── Drift — viewport-relative parallax for flow sections ──── */

/**
 * Wraps a fragment in gentle parallax: translateY proportional to the
 * element's distance from the viewport center × depth. Imperative writes
 * (no re-renders); disabled for reduced motion; renders static without JS.
 */
export function Drift({
  depth = 12,
  children,
  className,
  style,
}: {
  depth?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tick = () => {
      const vh = window.innerHeight;
      if (!vh) return;
      const r = el.getBoundingClientRect();
      const rel = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5 on screen
      el.style.transform = `translateY(${(-rel * depth).toFixed(2)}px)`;
    };
    const un = subscribeScroll(tick);
    tick();
    return un;
  }, [depth]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform", ...style }}>
      {children}
    </div>
  );
}

/* ── Composition atoms ─────────────────────────────────────── */

/** A collage fragment: static placement (position/rotation via className +
 *  style) with an inner parallax layer the pinned chapter drives via
 *  data-fdepth (local-progress drift). */
export function Frag({
  depth = 0,
  className,
  style,
  children,
}: {
  depth?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div className={`absolute ${className ?? ""}`} style={style}>
      <div data-fdepth={depth} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}

/** The abstracted surface a vignette floats over — suggests the real screen
 *  (header + faint structure) without being a screenshot. */
export function Plate({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute rounded-[1.6rem] ${className ?? ""}`}
      style={{
        background: "linear-gradient(165deg, #FFFFFF 0%, #FAF8F2 70%, #F6F2EA 100%)",
        boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 24px 70px rgba(15,34,41,0.10)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Faint structure hint inside a Plate. */
export function Skel({ w, className }: { w: string; className?: string }) {
  return <div className={`h-2 rounded-full ${className ?? ""}`} style={{ width: w, backgroundColor: "rgba(15,34,41,0.05)" }} />;
}
