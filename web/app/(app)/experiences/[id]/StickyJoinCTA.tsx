"use client";

/**
 * StickyJoinCTA — mobile-only sticky bottom bar.
 *
 * Always-visible during scroll so the buyer can join the moment they're
 * convinced. Hidden on desktop (≥lg) — desktop has the centered
 * PublicCommitBlock card which stays prominent on scroll already.
 *
 * Hides itself once the user has scrolled the PublicCommitBlock into
 * view (no point in two CTAs in the viewport at once). Done via
 * IntersectionObserver on a sentinel placed by the parent CommitBlock —
 * but to avoid coupling, the sticky bar uses a viewport-bottom heuristic:
 * if the user is within ~600px of the page bottom, hide the bar.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Props {
  challengeId: string;
  /** Tribe space ID (door into the cohort). Distinct from challengeId. */
  spaceId: string | null;
  priceCents: number;
  currency: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

export function StickyJoinCTA({
  challengeId,
  spaceId,
  priceCents,
  currency,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const [nearBottom, setNearBottom] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    // Bundle 4.2.55: rAF-throttle + cache layout reads. The old handler
    // read document.documentElement.scrollHeight on EVERY scroll event —
    // a forced synchronous layout each event, a real per-scroll cost on
    // mobile. scrollHeight + innerHeight only change on resize/content
    // shifts, not on scroll, so we cache them and recompute on resize
    // (which on iOS also fires when the address bar collapses). The
    // scroll path now reads only window.scrollY (cheap, no reflow) and
    // runs at most once per frame.
    let rafId: number | null = null;
    let viewportHeight = window.innerHeight;
    let docHeight = document.documentElement.scrollHeight;

    function recalcDims() {
      viewportHeight = window.innerHeight;
      docHeight = document.documentElement.scrollHeight;
      update();
    }

    function update() {
      rafId = null;
      // Show once the user has scrolled past the hero (~600px down).
      // Hide when within 700px of page bottom (the commit block CTA is
      // visible at that point — no need for two CTAs at once).
      const scrollTop = window.scrollY;
      setScrolledPast(scrollTop > 500);
      setNearBottom(docHeight - (scrollTop + viewportHeight) < 700);
    }

    function onScroll() {
      if (rafId === null) rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recalcDims);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recalcDims);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Don't render for creators (no CTA needed in preview mode)
  if (isCreator) return null;

  const visible = scrolledPast && !nearBottom;
  const price = `${currency} ${(priceCents / 100).toFixed(2)}`;

  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        // Was backdrop-filter blur(12px); a fixed bottom bar blurring the
        // scrolling/animated content beneath re-rasterises every frame on
        // mobile. Bumped to near-opaque solid (was 0.92) and dropped the
        // blur — visually near-identical, removes the per-frame cost.
        backgroundColor: "rgba(252,250,246,0.97)",
        borderTop: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 -4px 20px rgba(15,34,41,0.06)",
      }}
    >
      <div className="flex items-center gap-3 max-w-md mx-auto">
        {/* Bundle 4.2.45: dropped the "Full program" subtitle so the
            sticky bar shows just the price + the action. The
            in-card CTA's two-line positioning sentence and the
            "I'm in · CHF 99" pill carry the framing; this bar is
            just the persistent commit affordance. */}
        <div className="shrink-0">
          <div
            className="text-base font-black font-headline leading-none"
            style={{ color: "#0F2229" }}
          >
            {price}
          </div>
        </div>
        <div className="flex-1">
          {hasPurchased ? (
            <Link
              href={spaceId ? `/experiences/${challengeId}/space` : "/me"}
              className="block w-full text-center py-3 rounded-full text-white text-sm font-black font-headline"
              style={{
                backgroundColor: "#0891b2",
                boxShadow: "0 4px 14px rgba(8,145,178,0.30)",
              }}
            >
              Open space →
            </Link>
          ) : isAuthenticated ? (
            <PurchaseButton
              kind="challenge"
              targetId={challengeId}
              label="Join program"
              className="block w-full text-center py-3 rounded-full text-white text-sm font-black font-headline bg-[#FF6130] shadow-[0_4px_14px_rgba(255,97,48,0.35)] transition-transform hover:scale-[1.01] disabled:opacity-70"
            />
          ) : (
            // intent=buy:* sends the user straight to Stripe after auth;
            // returnTo is the fallback if checkout can't be created.
            <Link
              href={`/login?intent=buy:challenge:${challengeId}&returnTo=/experiences/${challengeId}`}
              className="block w-full text-center py-3 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.01]"
              style={{
                backgroundColor: "#FF6130",
                boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
              }}
            >
              Join program
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
