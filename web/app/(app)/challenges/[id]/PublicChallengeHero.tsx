/**
 * PublicChallengeHero — Bundle 4.2.18 (stripped middle band).
 *
 * The hero is one complete card holding the entire offer:
 *   1. H1                — the promise (ALL CAPS editorial display)
 *   2. Cover image       — edge-to-edge inside the card
 *   3. Program name kicker + description
 *   4. Divider
 *   5. Portraits         — Experts as photos + names + role-accented taglines
 *   6. Divider
 *   7. Stats             — "5 weeks · 7 live sessions" + "Always on:
 *                          Tribe Space + Expert Access" subtitle
 *   8. Date range        — "22 May → 25 Jun 2026" display anchor
 *   9. Sessions region   — flat horizontal carousel
 *  10. PRICE-AS-CTA      — orange tappable block, the buy moment IS
 *                          the price display
 *
 * Bundle 4.2.18 simplification (vs 4.2.17):
 *   - Dropped "Two Experts. One Program." / "Followed together in
 *     realtime." caption — redundant with the portraits visual.
 *   - Dropped "PROGRAM RHYTHM" eyebrow + 3-pill chip rail. Replaced
 *     with two clean text lines (stats + always-on qualifier).
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

  // Bundle 4.2.18: dropped the caption block ("Two Experts. One
  // Program." / "Followed together in realtime.") — it was
  // rhetorical chrome on top of the experts visual which already
  // communicates the same thing.

  return (
    <section className="px-6 lg:px-12 pt-12 lg:pt-16 pb-0">
      <div className="max-w-2xl mx-auto">
        {/* PAGE HERO — Bundle 4.2.21.
            The H1 promise was previously inside the product card,
            which made the card carry both page-level editorial voice
            AND product offer in one container — the card swelled
            because it had to. Pulled out here as a page-level header
            (eyebrow + H1) sitting above the card. The card below now
            opens directly with the cover image and reads as a
            contained product tile. */}
        <div className="text-center mb-9 lg:mb-12">
          <p
            className="text-[11px] lg:text-xs font-bold font-headline uppercase tracking-[0.28em] mb-3 lg:mb-4"
            style={{ color: "#0891b2" }}
          >
            INFITRA Experience
          </p>
          <h1
            className="font-black font-headline uppercase"
            style={{
              color: "#0F2229",
              fontSize: "clamp(1.75rem, 5.5vw, 2.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {headline}
          </h1>
        </div>

        <div
          className="rounded-[28px] lg:rounded-[32px] px-6 lg:px-10 overflow-hidden"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.06)",
            boxShadow:
              "0 1px 3px rgba(15,34,41,0.04), 0 24px 64px rgba(15,34,41,0.06)",
          }}
        >
          {/* Cover image — edge-to-edge at the top of the card.
              Bundle 4.2.21: card lost its top padding when the H1
              moved out; image now starts flush with the card's top
              rounded corners (clipped by overflow-hidden). */}
          {imageUrl && (
            <div className="-mx-6 lg:-mx-10">
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
              The kicker (program name in orange caps) IS the card's
              opening voice — it stays inside the card as the
              product's local context. */}
          <div className={`${imageUrl ? "mt-7 lg:mt-9" : "mt-10 lg:mt-12"} text-center`}>
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

          {/* IDENTITY block — portraits only.
              Bundle 4.2.18: the 2-line caption ("Two Experts. One
              Program." / "Followed together in realtime.") was
              removed — it restated what the portraits already show.
              The portraits alone now carry the "who" beat. */}
          <div className="flex items-start justify-center gap-5 lg:gap-8 flex-wrap">
            {creators.map((c) => (
              <ExpertPortrait key={c.id} creator={c} />
            ))}
          </div>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* PROGRAM RHYTHM block — Bundle 4.2.18 simplification.
              Was: "PROGRAM RHYTHM" eyebrow + three SpecPill chips +
              date. Five visual elements, lots of chip chrome.
              Now: two text lines (primary stat + always-on
              qualifier) + date. The chip rail was creating "chip
              soup" — the content speaks better as plain text. */}
          <div className="text-center">
            <p
              className="font-bold font-headline"
              style={{
                color: "#0F2229",
                fontSize: "clamp(1rem, 3.2vw, 1.125rem)",
                letterSpacing: "-0.005em",
              }}
            >
              {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
              <span style={{ color: "#cbd5e1" }}>{"  ·  "}</span>
              {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
            </p>
            <p
              className="text-sm lg:text-base font-medium mt-2"
              style={{ color: "#64748b" }}
            >
              Always on: Tribe Space + Expert Access
            </p>
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

          {/* SESSIONS region — Bundle 4.2.19.
              Edge-to-edge inset inside the hero card, containing a
              flat horizontal carousel of all sessions. 4.2.19 flips
              the contrast direction once more: the region itself
              goes back to white (blending into the hero card), and
              the session cards become cream. The result: sessions
              feel like part of the hero card surface, with cream
              cards as the only distinct chips.
              Color history on this region:
                4.2.14 cream region, cream cards in white container
                4.2.15 cream region, white cards (drop container)
                4.2.19 white region, cream cards (this) */}
          <div
            className="-mx-6 lg:-mx-10 mt-7 lg:mt-9 px-6 lg:px-10 py-9 lg:py-11"
            style={{ backgroundColor: "#FFFFFF" }}
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
    // Bundle 4.2.23: padding tightened to match the slimmed buy
    // state for visual consistency across CTA states.
    return (
      <Link
        href={spaceId ? `/communities/challenge/${spaceId}` : "/me"}
        className="block px-6 py-5 lg:py-6 text-center transition-opacity hover:opacity-95 active:opacity-90"
        style={{ backgroundColor: "#0891b2" }}
      >
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-1.5"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          You&apos;re in
        </p>
        <p
          className="font-black font-headline tracking-tight text-white"
          style={{
            fontSize: "clamp(1.25rem, 4vw, 1.625rem)",
            letterSpacing: "-0.015em",
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
  //
  // Bundle 4.2.23: slimmed to editorial proportions. Was a full-
  // throated "hero button" with a display-display price + tagline
  // + "I'm in →" arrow stacked over generous padding — landed as
  // shouty on mobile. Now: tighter padding, refined display price
  // (~1.5–2rem instead of ~2.5–3.25rem), compact "I'm in →"
  // affordance kept inline on the same row as the eyebrow tag.
  // The persistent StickyJoinCTA bar still carries the main
  // click moment; this block is the *price reveal*, not the
  // primary action.
  const innerContent = (
    <>
      <p
        className="font-black font-headline tracking-tight text-white"
        style={{
          fontSize: "clamp(1.625rem, 5vw, 2.125rem)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {priceLabel}
      </p>
      <div className="mt-2 flex items-center justify-center gap-3">
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.22em]"
          style={{ color: "rgba(255,255,255,0.78)" }}
        >
          For the full program
        </p>
        <span
          aria-hidden
          className="text-[10px] lg:text-[11px] font-bold font-headline"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          ·
        </span>
        <p
          className="text-[12px] lg:text-[13px] font-black font-headline text-white"
          style={{ letterSpacing: "-0.005em" }}
        >
          I&apos;m in  →
        </p>
      </div>
    </>
  );

  if (isAuthenticated) {
    return (
      <PurchaseButton
        kind="challenge"
        targetId={challengeId}
        label=""
        className="block w-full px-6 py-5 lg:py-6 text-center transition-opacity hover:opacity-95 active:opacity-90 disabled:opacity-70 bg-[#FF6130]"
      >
        {innerContent}
      </PurchaseButton>
    );
  }

  return (
    <Link
      href={`/login?intent=buy:challenge:${challengeId}&returnTo=/challenges/${challengeId}`}
      className="block px-6 py-5 lg:py-6 text-center transition-opacity hover:opacity-95 active:opacity-90"
      style={{ backgroundColor: "#FF6130" }}
    >
      {innerContent}
    </Link>
  );
}
