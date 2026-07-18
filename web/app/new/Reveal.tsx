"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One-time fade-up reveal on viewport entry (the chapter rhythm).
 * No-JS-safe and flash-free: content renders VISIBLE on the server; on mount,
 * only elements still well below the fold are hidden and then eased in when
 * they enter. `prefers-reduced-motion` disables the effect entirely.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Only hide if the element hasn't been seen yet (deferred a frame — the
    // element is below the fold, so nothing visible changes).
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) return;
    const raf = requestAnimationFrame(() => setHidden(true));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setHidden(false);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(26px)" : "none",
        transition: "opacity 700ms cubic-bezier(.22,.61,.36,1), transform 700ms cubic-bezier(.22,.61,.36,1)",
      }}
    >
      {children}
    </div>
  );
}
