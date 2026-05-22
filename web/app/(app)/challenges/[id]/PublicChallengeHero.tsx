/**
 * PublicChallengeHero — Bundle 4.2.5 (self-contained product card).
 *
 * The hero is one complete card holding the entire offer:
 *   1. Eyebrow           — program name (orange caps)
 *   2. H1                — the promise
 *   3. Divider
 *   4. Portraits         — Experts as photos + names + role-accented taglines
 *   5. Caption           — "Two Experts. One Program. Followed in realtime."
 *                          single supporting line (NOT a headline) so the
 *                          identity block doesn't visually duplicate the
 *                          spec block below
 *   6. Divider
 *   7. Spec block        — DATES leading: "22 May → 25 Jun"
 *                          metrics small-caps below: "5 WEEKS · 7 LIVE SESSIONS"
 *                          tribe momentum line at the bottom
 *   8. Divider
 *   9. Journey carousel  — manual swipe, editorial sessions, W1-W5 track
 *  10. Divider
 *  11. PRICE-AS-CTA      — the buy moment IS the price display. Orange
 *                          tappable block: CHF 287 + "For the full program"
 *                          + "I'm in →". Different states for purchased
 *                          (cyan, "open tribe space") and creator (preview).
 *
 * The card is self-contained — no external "first CTA" below it anymore.
 * Section 2 below the card still has its own "Commit" CTA at the page's
 * end as the second-chance moment.
 *
 * Brand language: "Expert" not "coach"; "tribe" not "cohort/community"
 * (buyer-facing copy only).
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";
import { WeeklyJourneyCarousel } from "./WeeklyJourneyCarousel";

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  role: "owner" | "cohost";
}

interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
}

interface WeekData {
  weekNumber: number;
  weekRange: string;
  theme: string | null;
  sessions: SessionLite[];
}

interface Props {
  challengeId: string;
  spaceId: string | null;
  title: string;
  promise: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  priceCents: number;
  currency: string;
  creators: Creator[];
  weeks: WeekData[];
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

function weeksBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(0)}`;
}

function formatProgramDateRange(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  return `${fmt(start)} → ${fmt(end)}`;
}

function resolveHeadline(
  promise: string | null,
  weeks: number,
  creators: Creator[],
): string {
  if (promise && promise.trim()) return promise.trim();
  const names = creators
    .map((c) => c.display_name)
    .filter(Boolean)
    .join(" & ");
  return `${weeks} ${weeks === 1 ? "week" : "weeks"} of live coaching${
    names ? ` with ${names}` : ""
  }.`;
}

export function PublicChallengeHero({
  challengeId,
  spaceId,
  title,
  promise,
  startDate,
  endDate,
  sessionCount,
  priceCents,
  currency,
  creators,
  weeks,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const totalWeeks = weeksBetween(startDate, endDate);
  const headline = resolveHeadline(promise, totalWeeks, creators);
  const priceLabel = formatPrice(priceCents, currency);
  const dateRange = formatProgramDateRange(startDate, endDate);
  const solo = creators.length === 1;

  const identityCaption = solo
    ? "Personal Expert. Followed in realtime."
    : creators.length === 2
      ? "Two Experts. One Program. Followed together in realtime."
      : `${creators.length} Experts. One Program. Followed together in realtime.`;

  return (
    <section className="px-6 lg:px-12 pt-10 lg:pt-14 pb-0">
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-[28px] lg:rounded-[32px] px-6 lg:px-10 pt-10 lg:pt-12 overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.06)",
            boxShadow:
              "0 1px 3px rgba(15,34,41,0.04), 0 24px 64px rgba(15,34,41,0.06)",
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-5 lg:mb-7 text-center"
            style={{ color: "#FF6130" }}
          >
            {title}
          </p>

          {/* H1 — promise */}
          <h1
            className="font-black font-headline text-center"
            style={{
              color: "#0F2229",
              fontSize: "clamp(1.75rem, 5.5vw, 2.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h1>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* IDENTITY block — portraits + caption.
              Caption is a single supporting line (not a headline), so the
              identity block doesn't visually duplicate the spec block. */}
          <div className="flex items-start justify-center gap-5 lg:gap-8 flex-wrap mb-5 lg:mb-6">
            {creators.map((c) => (
              <ExpertPortrait key={c.id} creator={c} />
            ))}
          </div>
          <p
            className="text-[13px] lg:text-sm text-center font-medium leading-snug max-w-xs mx-auto"
            style={{ color: "#475569" }}
          >
            {identityCaption}
          </p>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* SPEC block — Bundle 4.2.6 hierarchy swap. Metrics lead
              ("5 weeks · 7 live sessions") because that's WHAT YOU BUY;
              tribe line supports the metrics in the same "offer" group;
              dates are below as the smaller "when it happens" detail.
              Bigger gap between the offer group and the date line
              visually separates the two beats. */}
          <div className="text-center">
            <p
              className="font-black font-headline tracking-tight"
              style={{
                color: "#0F2229",
                fontSize: "clamp(1.5rem, 4.5vw, 2rem)",
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
              <span style={{ color: "#cbd5e1" }}> · </span>
              {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
            </p>
            <p
              className="text-sm lg:text-base text-center mt-3 font-medium"
              style={{ color: "#475569" }}
            >
              Plus your tribe — momentum that lasts
            </p>
            <p
              className="text-[11px] lg:text-xs font-bold font-headline uppercase tracking-[0.2em] mt-6 lg:mt-7"
              style={{ color: "#94a3b8" }}
            >
              {dateRange}
            </p>
          </div>

          <Divider className="mt-7 lg:mt-9 mb-6 lg:mb-8" />

          {/* WEEKLY JOURNEY CAROUSEL */}
          <WeeklyJourneyCarousel weeks={weeks} />

          {/* PRICE-AS-CTA — the buy moment is the price display.
              Negative margins bring it edge-to-edge of the card bottom.
              Bottom corners match the card's outer radius. */}
          <div className="-mx-6 lg:-mx-10 mt-8 lg:mt-10">
            <PriceCTA
              challengeId={challengeId}
              spaceId={spaceId}
              priceLabel={priceLabel}
              isAuthenticated={isAuthenticated}
              hasPurchased={hasPurchased}
              isCreator={isCreator}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Divider({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ height: "1px", backgroundColor: "rgba(15,34,41,0.06)" }}
      aria-hidden
    />
  );
}

/**
 * Expert portrait — 96px on mobile, 112px on desktop.
 */
function ExpertPortrait({ creator }: { creator: Creator }) {
  const roleColor = creator.role === "owner" ? "#FF6130" : "#0891b2";

  return (
    <div
      className="flex flex-col items-center min-w-0"
      style={{ maxWidth: "150px" }}
    >
      {creator.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creator.avatar_url}
          alt={creator.display_name ?? "Expert"}
          className="w-24 h-24 lg:w-28 lg:h-28 rounded-full object-cover"
          style={{
            border: "3px solid #FFFFFF",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 6px 16px rgba(15,34,41,0.08)",
          }}
        />
      ) : (
        <div
          className="w-24 h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center"
          style={{
            backgroundColor:
              creator.role === "owner"
                ? "rgba(255,97,48,0.12)"
                : "rgba(8,145,178,0.12)",
            border: "3px solid #FFFFFF",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 6px 16px rgba(15,34,41,0.08)",
          }}
        >
          <span
            className="text-3xl lg:text-4xl font-black font-headline"
            style={{ color: roleColor }}
          >
            {(creator.display_name ?? "?")[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <h2
        className="mt-3 lg:mt-4 text-sm lg:text-base font-black font-headline tracking-tight leading-tight text-center"
        style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
      >
        {creator.display_name ?? "Expert"}
      </h2>
      {creator.tagline && creator.tagline.trim() && (
        <p
          className="mt-1 text-[11px] lg:text-xs font-bold font-headline text-center leading-snug line-clamp-2"
          style={{ color: roleColor }}
        >
          {creator.tagline}
        </p>
      )}
    </div>
  );
}

/**
 * PriceCTA — the offer's buy moment AND price display in one element.
 * Sits at the bottom of the card (edge-to-edge via negative margins).
 *
 * States:
 *   - Creator (owner/cohost) → preview badge, no action
 *   - Already purchased       → cyan "open your tribe space" button
 *   - Authenticated buyer     → orange Stripe-checkout button
 *   - Anonymous               → orange link to /login w/ intent=buy
 *
 * The price IS the button's visual centerpiece (kept at the same
 * display-weight as the previous static price tag). Underneath:
 * "For the full program" + "I'm in →" — the action affordance.
 */
function PriceCTA({
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
        className="px-6 py-7 text-center"
        style={{
          backgroundColor: "rgba(255,97,48,0.08)",
          borderTop: "1px solid rgba(255,97,48,0.12)",
        }}
      >
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-1"
          style={{ color: "#c2410c" }}
        >
          Preview
        </p>
        <p className="text-sm" style={{ color: "#7c2d12" }}>
          You&apos;re an Expert on this program
        </p>
      </div>
    );
  }

  if (hasPurchased) {
    return (
      <Link
        href={spaceId ? `/communities/challenge/${spaceId}` : "/me"}
        className="block px-6 py-8 lg:py-10 text-center transition-opacity hover:opacity-95 active:opacity-90"
        style={{ backgroundColor: "#0891b2" }}
      >
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-2"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          You&apos;re in
        </p>
        <p
          className="font-black font-headline tracking-tight text-white"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Open your tribe space  →
        </p>
      </Link>
    );
  }

  // Anonymous or authenticated-not-purchased → orange buy block.
  // For authenticated buyers, PurchaseButton handles Stripe checkout.
  // For anonymous, it's a Link to /login with intent=buy.
  const innerContent = (
    <>
      <p
        className="font-black font-headline tracking-tight text-white"
        style={{
          fontSize: "clamp(2.5rem, 8vw, 3.25rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {priceLabel}
      </p>
      <p
        className="text-[11px] font-bold font-headline uppercase tracking-[0.22em] mt-2"
        style={{ color: "rgba(255,255,255,0.78)" }}
      >
        For the full program
      </p>
      <p
        className="text-base lg:text-lg font-black font-headline tracking-tight text-white mt-5"
        style={{ letterSpacing: "-0.01em" }}
      >
        I&apos;m in  →
      </p>
    </>
  );

  if (isAuthenticated) {
    return (
      <PurchaseButton
        kind="challenge"
        targetId={challengeId}
        label=""
        className="block w-full px-6 py-8 lg:py-10 text-center transition-opacity hover:opacity-95 active:opacity-90 disabled:opacity-70 bg-[#FF6130]"
      >
        {innerContent}
      </PurchaseButton>
    );
  }

  return (
    <Link
      href={`/login?intent=buy:challenge:${challengeId}&returnTo=/challenges/${challengeId}`}
      className="block px-6 py-8 lg:py-10 text-center transition-opacity hover:opacity-95 active:opacity-90"
      style={{ backgroundColor: "#FF6130" }}
    >
      {innerContent}
    </Link>
  );
}
