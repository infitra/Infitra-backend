"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

const INK = "#0F2229";
const ORANGE = "#FF6130";

/**
 * Gates a surface to desktop. Renders `children` on screens ≥1024px; on smaller
 * screens shows a clean "best on desktop" card instead. Used for the
 * collaboration workspace — a detailed two-creator editor that's genuinely too
 * complex for a phone (per the pilot plan H1 boundary). The buyer page and the
 * Experience Space stay mobile-first; only heavy editing surfaces gate.
 *
 * JS-gated (not just CSS) so the heavy child (realtime channel + Zustand store)
 * never mounts on mobile. `isDesktop === null` until mount → SSR and the first
 * client render agree (no hydration mismatch); matchMedia resolves on mount.
 */
export function DesktopOnly({
  children,
  title = "Best viewed on desktop",
  message = "This screen is a detailed editor built for a larger display. Open INFITRA on your laptop or desktop to continue.",
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: {
  children: ReactNode;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isDesktop === null) return null;
  if (isDesktop) return <>{children}</>;

  return (
    <div
      className="flex flex-col items-center justify-center text-center px-6 py-16 rounded-2xl"
      style={{ backgroundColor: "#FAF7F1", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: "rgba(255,97,48,0.10)" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </div>
      <h2 className="text-lg font-black font-headline" style={{ color: INK }}>{title}</h2>
      <p className="text-sm mt-2 max-w-xs leading-relaxed" style={{ color: "#64748b" }}>{message}</p>
      <Link
        href={backHref}
        className="mt-6 px-5 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.3)" }}
      >
        ← {backLabel}
      </Link>
    </div>
  );
}
