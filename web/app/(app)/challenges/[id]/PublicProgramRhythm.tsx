/**
 * PublicProgramRhythm — Bundle 4.2.4 (reduced to first CTA).
 *
 * The weekly journey content was absorbed INTO the product card
 * (PublicChallengeHero) in 4.2.4. This module now exists only to
 * render the first CTA immediately below the card — the decision
 * moment after the buyer has seen the entire offer.
 *
 * Kept as a named component (instead of inlining in page.tsx) so the
 * auth-aware CTA logic has one canonical home that's reused on the
 * published celebration page.
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Props {
  challengeId: string;
  spaceId: string | null;
  priceCents: number;
  currency: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(0)}`;
}

export function PublicProgramRhythm({
  challengeId,
  spaceId,
  priceCents,
  currency,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const priceLabel = formatPrice(priceCents, currency);

  return (
    <section className="px-6 lg:px-12 pt-8 lg:pt-10 pb-16 lg:pb-24">
      <div className="flex justify-center">
        <FirstCTA
          challengeId={challengeId}
          spaceId={spaceId}
          priceLabel={priceLabel}
          isAuthenticated={isAuthenticated}
          hasPurchased={hasPurchased}
          isCreator={isCreator}
        />
      </div>
    </section>
  );
}

function FirstCTA({
  challengeId,
  spaceId,
  priceLabel,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: {
  challengeId: string;
  spaceId: string | null;
  priceLabel: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}) {
  if (isCreator) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold font-headline"
        style={{
          backgroundColor: "rgba(255,97,48,0.10)",
          color: "#c2410c",
          border: "1px solid rgba(255,97,48,0.20)",
        }}
      >
        <span>👀</span>
        <span>Preview — you&apos;re an Expert on this program</span>
      </div>
    );
  }

  if (hasPurchased) {
    return (
      <Link
        href={spaceId ? `/communities/challenge/${spaceId}` : "/me"}
        className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01]"
        style={{
          backgroundColor: "#0891b2",
          boxShadow:
            "0 6px 20px rgba(8,145,178,0.30), 0 2px 6px rgba(8,145,178,0.20)",
        }}
      >
        You&apos;re in — open your tribe space →
      </Link>
    );
  }

  if (isAuthenticated) {
    return (
      <PurchaseButton
        kind="challenge"
        targetId={challengeId}
        label={`I'm in — ${priceLabel} →`}
        className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01] disabled:opacity-70 bg-[#FF6130] shadow-[0_6px_20px_rgba(255,97,48,0.40),0_2px_6px_rgba(255,97,48,0.20)]"
      />
    );
  }

  return (
    <Link
      href={`/login?intent=buy:challenge:${challengeId}&returnTo=/challenges/${challengeId}`}
      className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01]"
      style={{
        backgroundColor: "#FF6130",
        boxShadow:
          "0 6px 20px rgba(255,97,48,0.40), 0 2px 6px rgba(255,97,48,0.20)",
      }}
    >
      I&apos;m in — {priceLabel} →
    </Link>
  );
}
