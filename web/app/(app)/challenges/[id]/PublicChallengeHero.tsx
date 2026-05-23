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
import { SessionsCarousel, type CarouselSession } from "./SessionsCarousel";

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  role: "owner" | "cohost";
}

// Bundle 4.2.14: hero now receives a flat array of enriched sessions
// (with weekNumber + host attached) instead of the previous weeks
// shape. The carousel uses the flat list directly.

interface Props {
  challengeId: string;
  spaceId: string | null;
  title: string;
  /** Resolved promise text (may fall back to description if promise_text empty).
   *  Becomes the H1 inside the card. */
  promise: string | null;
  /** Raw description, ONLY when distinct from the promise. Renders as a
   *  paragraph under the cover image to explain HOW the promise is delivered.
   *  When the promise itself was a description-fallback, this is null. */
  description: string | null;
  /** Cover image — Bundle 4.2.8 lives INSIDE the card now, edge-to-edge
   *  between the H1 promise and the description paragraph. Skipped if null. */
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  priceCents: number;
  currency: string;
  creators: Creator[];
  sessions: CarouselSession[];
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

/**
 * Format the program's start-to-end date range with year baked in
 * (Bundle 4.2.11). When both dates fall in the same year, the year
 * is shown once at the end. When the program crosses a year boundary,
 * both ends get their own year.
 */
function formatProgramDateRangeWithYear(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const fmtNoYear = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const fmtWithYear = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (s.getFullYear() === e.getFullYear()) {
    return `${fmtNoYear(s)} → ${fmtWithYear(e)}`;
  }
  return `${fmtWithYear(s)} → ${fmtWithYear(e)}`;
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
  description,
  imageUrl,
  startDate,
  endDate,
  sessionCount,
  priceCents,
  currency,
  creators,
  sessions,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const totalWeeks = weeksBetween(startDate, endDate);
  const headline = resolveHeadline(promise, totalWeeks, creators);
  const priceLabel = formatPrice(priceCents, currency);
  const dateRangeWithYear = formatProgramDateRangeWithYear(startDate, endDate);
  const solo = creators.length === 1;

  // Caption split into two lines for stronger hierarchy (Bundle 4.2.9).
  // Line 1 is the brand-differentiator statement; line 2 is the qualifier.
  const captionPrimary = solo
    ? "Personal Expert."
    : creators.length === 2
      ? "Two Experts. One Program."
      : `${creators.length} Experts. One Program.`;
  const captionSecondary = solo
    ? "Followed in realtime."
    : "Followed together in realtime.";

  return (
    <section className="px-6 lg:px-12 pt-16 lg:pt-14 pb-0">
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
          {/* H1 — promise. Bundle 4.2.10: rendered in ALL CAPS for
              editorial campaign-cover treatment (Vogue/Wired-style).
              Same large display size; tighter letter-spacing tuned for
              uppercase (uppercase needs slightly more breath than
              sentence case at this weight). */}
          <h1
            className="font-black font-headline text-center uppercase"
            style={{
              color: "#0F2229",
              fontSize: "clamp(1.75rem, 5.5vw, 2.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {headline}
          </h1>

          {/* Cover image — edge-to-edge inside the card. */}
          {imageUrl && (
            <div className="-mx-6 lg:-mx-10 mt-7 lg:mt-9">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Program name (kicker) + description.
              Bundle 4.2.9: the kicker is the relocated program name
              with more weight (was the small eyebrow at the top of
              card). The description now sits ON TOP of stronger
              presentation — bigger, darker color, font-medium. Together
              they read as "this is what this program is, and here's
              how it works" anchored below the cover image. */}
          <div className="mt-7 lg:mt-9 text-center">
            <p
              className="text-sm lg:text-base font-black font-headline uppercase tracking-[0.18em]"
              style={{ color: "#FF6130" }}
            >
              {title}
            </p>
            {description && description.trim() && (
              <p
                className="mt-3 mx-auto leading-relaxed font-medium"
                style={{
                  color: "#1e293b",
                  fontSize: "1.0625rem",
                  maxWidth: "32rem",
                }}
              >
                {description}
              </p>
            )}
          </div>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* IDENTITY block — portraits + 2-line caption.
              Bundle 4.2.9: caption split into two lines with hierarchy.
              First line is the brand-differentiator statement (font-
              black, slate primary, display weight). Second line is the
              qualifier (font-medium, slate secondary). The two-line
              treatment gives the caption real punch — it was whispering
              as a single small-medium line previously. */}
          <div className="flex items-start justify-center gap-5 lg:gap-8 flex-wrap mb-6 lg:mb-7">
            {creators.map((c) => (
              <ExpertPortrait key={c.id} creator={c} />
            ))}
          </div>
          <p
            className="text-base lg:text-lg text-center font-black font-headline tracking-tight"
            style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
          >
            {captionPrimary}
          </p>
          <p
            className="text-sm text-center mt-1.5 font-medium"
            style={{ color: "#64748b" }}
          >
            {captionSecondary}
          </p>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* PROGRAM RHYTHM block — Bundle 4.2.11 restructure.
              Section eyebrow labels the beat. Two data pills (weeks +
              sessions) on the first row, then a single wide pill
              naming the always-on layer (replaces the previous "Plus
              your tribe — momentum that lasts" tagline with a
              concrete inclusion). Below the pills, the program dates
              with year as a big display element — the "when" anchor
              for the buyer's commitment. */}
          <div className="text-center">
            <p
              className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-5 lg:mb-6"
              style={{ color: "#FF6130" }}
            >
              Program Rhythm
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <SpecPill>
                {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
              </SpecPill>
              <SpecPill>
                {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
              </SpecPill>
            </div>
            <div className="flex justify-center mt-2.5">
              <SpecPill>
                Always on — Tribe Space + Expert Access
              </SpecPill>
            </div>
            <p
              className="font-black font-headline tracking-tight mt-7 lg:mt-9"
              style={{
                color: "#0F2229",
                fontSize: "clamp(1.375rem, 4.5vw, 1.875rem)",
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              {dateRangeWithYear}
            </p>
          </div>

          {/* Bundle 4.2.9: the cream-tinted region (below) replaces
              the divider here. The color change IS the section break. */}

          {/* SESSIONS region — Bundle 4.2.15.
              Cream-tinted edge-to-edge inset inside the hero card,
              containing a flat horizontal carousel of all sessions
              (vertical white cards, landing-page style). 4.2.15
              dropped the inner white container wrapper that used to
              sit between the cream region and the carousel — section
              header and carousel now live directly on the cream, and
              the session cards are white-on-cream (inverted from
              4.2.14) so they pop instead of competing with a nested
              white surface. The 5-week structure is conveyed by the
              eyebrow on each card ("WEEK N · DAY") plus the Program
              Rhythm spec block above the cream region. */}
          <div
            className="-mx-6 lg:-mx-10 mt-7 lg:mt-9 px-6 lg:px-10 py-9 lg:py-11"
            style={{ backgroundColor: "#FAF7F1" }}
          >
            <SessionsCarousel sessions={sessions} />
          </div>

          {/* PRICE-AS-CTA — edge-to-edge orange block at the card's
              bottom. Bundle 4.2.9: sits directly against the cream
              carousel region above (no white margin between cream and
              orange — the color transitions ARE the section breaks now,
              not white dividers or gaps). */}
          <div className="-mx-6 lg:-mx-10">
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
 * SpecPill — a containment chip for offer specs (weeks, sessions, dates).
 * Cyan-tinted background, hairline cyan border, small-caps font-bold.
 * Renders the contained content as a "concrete inclusion" instead of
 * floating data text.
 */
function SpecPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-3 lg:px-3.5 py-2 rounded-full text-[10px] lg:text-xs font-bold font-headline uppercase tracking-[0.16em] lg:tracking-[0.18em] text-center"
      style={{
        backgroundColor: "rgba(156, 240, 255, 0.20)",
        border: "1px solid rgba(8, 145, 178, 0.22)",
        color: "#0F2229",
      }}
    >
      {children}
    </span>
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
