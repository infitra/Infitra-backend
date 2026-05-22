/**
 * PublicChallengeHero — Bundle 4.2.1 rewrite (creator-led).
 *
 * The hero is now CREATOR-LED. INFITRA's brand differentiator is
 * multi-creator collaboration — "two experts in one program." Every
 * other cohort platform leads with a cover image and reduces creators
 * to a footnote. We lead with the humans because the humans are the
 * product.
 *
 * Composition (centered, top to bottom):
 *   1. Eyebrow:           program name in orange caps
 *   2. H1:                the promise (no quote marks — this is the offer)
 *   3. Coach portraits:   128px (mobile) / 160px (desktop) circles, side-by-side,
 *                         each with name + role-accented tagline beneath
 *   4. Connective line:   "Two coaches, one program" (or singular for solo)
 *   5. Stat strip:        2 big numbers (weeks · live sessions) with cyan divider.
 *                         Coach count dropped from stats — the portraits already
 *                         say "2" visually.
 *   6. CTA:               "I'm in — CHF X →"
 *
 * No backdrop wash. The hero territory is defined by composition,
 * typography, and spacing — past attempts at color washes on cream
 * came out muddy and unintentional. Clean cream surface only.
 *
 * Cover image is NOT in the hero anymore. It moved to the Journey
 * section as a cinematic chapter-cover band. The hero's visual core
 * is the two humans behind the program.
 *
 * Robustness:
 *   - No avatar uploaded → initial letter on role-colored circle
 *     (fallback flagged for workspace preview coaching in Bundle 4.3)
 *   - No tagline → name renders alone, no placeholder
 *   - Solo creator → singular language + single centered portrait
 *   - No promise → fallback to synthesized line (view-coalesced description
 *     handles the first fallback layer; resolveHeadline handles the rest)
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  role: "owner" | "cohost";
}

interface Props {
  challengeId: string;
  spaceId: string | null;
  title: string;
  /** Promise text — view already coalesces description as fallback.
   *  Null only when both promise_text and description are empty. */
  promise: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  priceCents: number;
  currency: string;
  creators: Creator[];
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
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const weeks = weeksBetween(startDate, endDate);
  const headline = resolveHeadline(promise, weeks, creators);
  const priceLabel = formatPrice(priceCents, currency);
  const solo = creators.length === 1;
  const connectiveLine = solo
    ? "Personal coaching"
    : creators.length === 2
      ? "Two coaches, one program"
      : `${creators.length} coaches, one program`;

  return (
    <section className="px-6 lg:px-12 pt-24 lg:pt-32 pb-12 lg:pb-20">
      <div className="max-w-3xl mx-auto text-center">
        {/* Eyebrow — program name, demoted from H1 to identifier */}
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-6 lg:mb-8"
          style={{ color: "#FF6130" }}
        >
          {title}
        </p>

        {/* H1 — the promise as the offer's headline */}
        <h1
          className="font-black font-headline mb-12 lg:mb-16"
          style={{
            color: "#0F2229",
            fontSize: "clamp(2.5rem, 7.5vw, 4.5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          {headline}
        </h1>

        {/* Coach portraits — the visual core of the hero. Big enough
            to feel human, not avatar-sized. flex-wrap so 3+ creators
            (rare) flow to a second row gracefully. */}
        <div className="flex items-start justify-center gap-5 lg:gap-10 flex-wrap mb-5 lg:mb-7">
          {creators.map((c) => (
            <CoachPortrait key={c.id} creator={c} />
          ))}
        </div>

        {/* Connective line — names the brand differentiator literally.
            Sits between the portraits (who) and the stats (how much). */}
        <p
          className="text-sm lg:text-base mb-12 lg:mb-16 font-medium"
          style={{ color: "#475569" }}
        >
          {connectiveLine}
        </p>

        {/* Stat strip — 2 columns. Coach count dropped because the
            portraits above already answer "how many coaches" visually.
            These two stats are the time-commitment evidence. */}
        <div className="flex items-stretch justify-center mb-12 lg:mb-14 max-w-md mx-auto">
          <Stat number={weeks} label={weeks === 1 ? "week" : "weeks"} />
          <div
            className="w-px mx-8 lg:mx-12 self-stretch"
            style={{ backgroundColor: "rgba(8,145,178,0.30)" }}
            aria-hidden
          />
          <Stat
            number={sessionCount}
            label={sessionCount === 1 ? "live session" : "live sessions"}
          />
        </div>

        {/* CTA */}
        <HeroCTA
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

/**
 * Coach portrait — circular photo + name + role-accented tagline.
 * 128px on mobile, 160px on desktop. The visual centerpiece of the hero.
 */
function CoachPortrait({ creator }: { creator: Creator }) {
  const roleColor = creator.role === "owner" ? "#FF6130" : "#0891b2";

  return (
    <div
      className="flex flex-col items-center min-w-0"
      style={{ maxWidth: "180px" }}
    >
      {creator.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creator.avatar_url}
          alt={creator.display_name ?? "Coach"}
          className="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover"
          style={{
            border: "3px solid #FFFFFF",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 8px 24px rgba(15,34,41,0.10)",
          }}
        />
      ) : (
        <div
          className="w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center"
          style={{
            backgroundColor:
              creator.role === "owner"
                ? "rgba(255,97,48,0.12)"
                : "rgba(8,145,178,0.12)",
            border: "3px solid #FFFFFF",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 8px 24px rgba(15,34,41,0.10)",
          }}
        >
          <span
            className="text-4xl lg:text-5xl font-black font-headline"
            style={{ color: roleColor }}
          >
            {(creator.display_name ?? "?")[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <h2
        className="mt-4 lg:mt-5 text-base lg:text-lg font-black font-headline tracking-tight leading-tight text-center"
        style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
      >
        {creator.display_name ?? "Coach"}
      </h2>
      {creator.tagline && creator.tagline.trim() && (
        <p
          className="mt-1.5 text-xs lg:text-sm font-bold font-headline text-center leading-snug line-clamp-2"
          style={{ color: roleColor }}
        >
          {creator.tagline}
        </p>
      )}
    </div>
  );
}

/**
 * Stat block — single number on top, label beneath. Used in the
 * 2-column stat strip. Numbers use the page's Billboard tier; labels
 * use the eyebrow tier.
 */
function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-0">
      <span
        className="font-black font-headline leading-none"
        style={{
          color: "#0F2229",
          fontSize: "clamp(3rem, 11vw, 5rem)",
          letterSpacing: "-0.04em",
        }}
      >
        {number}
      </span>
      <span
        className="mt-2.5 text-[11px] font-bold font-headline uppercase tracking-[0.18em]"
        style={{ color: "#94a3b8" }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Hero CTA — auth-aware. Same logic as PublicCommitBlock but with
 * hero wording ("I'm in" — emotional intent, not transactional).
 */
function HeroCTA({
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
        <span>Preview — you&apos;re a coach on this program</span>
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
        You&apos;re in — open your space →
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
