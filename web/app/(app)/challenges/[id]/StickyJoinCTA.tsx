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
    function onScroll() {
      // Show once the user has scrolled past the hero (~600px down).
      // Hide when within 700px of page bottom (the commit block CTA is
      // visible at that point — no need for two CTAs at once).
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setScrolledPast(scrollTop > 500);
      setNearBottom(docHeight - (scrollTop + viewportHeight) < 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        backgroundColor: "rgba(252,250,246,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 -4px 20px rgba(15,34,41,0.06)",
      }}
    >
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <div className="shrink-0">
          <div
            className="text-base font-black font-headline leading-none"
            style={{ color: "#0F2229" }}
          >
            {price}
          </div>
          <div
            className="text-[10px] font-bold font-headline mt-0.5"
            style={{ color: "#94a3b8" }}
          >
            Full program
          </div>
        </div>
        <div className="flex-1">
          {hasPurchased ? (
            <Link
              href={spaceId ? `/communities/challenge/${spaceId}` : "/me"}
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
              href={`/login?intent=buy:challenge:${challengeId}&returnTo=/challenges/${challengeId}`}
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
