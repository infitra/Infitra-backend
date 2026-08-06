/**
 * PublicCommitBlock — Bundle 4.2.2 (simplified second CTA).
 *
 * The final beat. By this point the buyer has seen:
 *   - Section 1: product card + journey + first CTA ("I'm in")
 *   - Section 2: Experts + Inside the program
 *
 * They don't need a restated offer card with price + bullets — that's
 * already in the hero card. This block is just the final commit moment:
 * a date confirmation, a CTA, a trust strip.
 *
 * Auth-aware (same logic as the hero / first CTA):
 *  - Anonymous → sign-in link with buy intent
 *  - Authenticated buyer (not yet purchased) → Stripe checkout
 *  - Already purchased → "open your tribe space" link
 *  - Creator (owner/cohost) → preview badge
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Props {
  challengeId: string;
  spaceId: string | null;
  priceCents: number;
  currency: string;
  startDate: string;
  endDate: string;
  sessionCount: number;
  /** Capacity remaining (null = no cap set). When set + small, we render
   *  a "Only N spots left" urgency line. Bundle 4.1. */
  spotsLeft: number | null;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
  /** Materials attached to sessions (count only). The line renders ONLY
   *  when true, and "released as you go" states the time-bound design on
   *  the marketing page itself — added value, never a downloadable
   *  program. */
  materialsCount?: number;
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(0)}`;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function PublicCommitBlock({
  challengeId,
  spaceId,
  priceCents,
  currency,
  startDate,
  endDate,
  sessionCount,
  spotsLeft,
  isAuthenticated,
  hasPurchased,
  isCreator,
  materialsCount = 0,
}: Props) {
  const priceLabel = formatPrice(priceCents, currency);

  return (
    <section
      className="px-6 lg:px-12 py-12 lg:py-16"
      style={{
        // Transparent at the top so the (app) layout's cream + wave
        // shines through; warms toward the orange CTA at the bottom.
        background:
          "linear-gradient(180deg, rgba(242,239,232,0) 0%, rgba(255,97,48,0.05) 100%)",
      }}
    >
      <div className="max-w-xl mx-auto text-center">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
          style={{ color: "#FF6130" }}
        >
          Commit
        </p>
        <h2
          className="text-3xl lg:text-5xl font-black font-headline tracking-tight mb-5"
          style={{ color: "#0F2229", letterSpacing: "-0.02em" }}
        >
          All of it opens the moment you join.
        </h2>
        <p
          className="text-base lg:text-lg leading-relaxed mb-10"
          style={{ color: "#475569" }}
        >
          The experience runs{" "}
          <span className="font-bold" style={{ color: "#0F2229" }}>
            {formatLongDate(startDate)} → {formatLongDate(endDate)}
          </span>
          . Commit now and join a movement with real people, momentum and
          focused experts.
        </p>

        {materialsCount > 0 && (
          <p
            className="text-[12.5px] font-bold font-headline inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 -mt-4"
            style={{
              color: "#0891b2",
              backgroundColor: "rgba(8,145,178,0.07)",
              border: "1px solid rgba(8,145,178,0.18)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
              <path d="M14 3v5h5" />
            </svg>
            Includes {materialsCount} {materialsCount === 1 ? "guide" : "guides & templates"} from
            your experts, released as you go
          </p>
        )}

        {/* Spots-left urgency badge — bundle 4.1, only when cap is set
            and there are few enough remaining for urgency to matter. */}
        {spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 10 && (
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.18em] mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              color: "#c2410c",
              backgroundColor: "rgba(255,97,48,0.10)",
              border: "1px solid rgba(255,97,48,0.20)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#FF6130" }}
            />
            Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
          </p>
        )}
        {spotsLeft === 0 && (
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.18em] mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              color: "#475569",
              backgroundColor: "rgba(15,34,41,0.06)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#94a3b8" }}
            />
            Sold out
          </p>
        )}

        {/* CTA */}
        <div className="flex justify-center mb-7">
          <SecondCTA
            challengeId={challengeId}
            spaceId={spaceId}
            priceLabel={priceLabel}
            isAuthenticated={isAuthenticated}
            hasPurchased={hasPurchased}
            isCreator={isCreator}
          />
        </div>

      </div>
    </section>
  );
}

function SecondCTA({
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
  /** Materials attached to sessions (count only). The line renders ONLY
   *  when true, and "released as you go" states the time-bound design on
   *  the marketing page itself — added value, never a downloadable
   *  program. */
  materialsCount?: number;
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
        <span>Preview — you&apos;re an Expert on this experience</span>
      </div>
    );
  }

  if (hasPurchased) {
    return (
      <Link
        href={spaceId ? `/experiences/${challengeId}/space` : "/me"}
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
        label={`Commit — ${priceLabel} →`}
        className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01] disabled:opacity-70 bg-[#FF6130] shadow-[0_6px_20px_rgba(255,97,48,0.40),0_2px_6px_rgba(255,97,48,0.20)]"
      />
    );
  }

  return (
    <Link
      href={`/login?intent=buy:challenge:${challengeId}&returnTo=/experiences/${challengeId}`}
      className="inline-block px-7 py-4 rounded-full text-white text-base font-black font-headline transition-transform hover:scale-[1.01]"
      style={{
        backgroundColor: "#FF6130",
        boxShadow:
          "0 6px 20px rgba(255,97,48,0.40), 0 2px 6px rgba(255,97,48,0.20)",
      }}
    >
      Commit — {priceLabel} →
    </Link>
  );
}
