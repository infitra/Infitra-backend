/**
 * PublicChallengeHero — Bundle 4.2 rewrite.
 *
 * Typography-led hero. The cover image is supporting, not load-bearing —
 * a contained 16:9 band when present, gracefully absent when not.
 *
 * Composition (top to bottom):
 *   - Optional cover image (contained, rounded)
 *   - Eyebrow:  program name in brand orange (was the H1 before)
 *   - H1:       the promise as billboard display type (was a quoted block)
 *   - Stats:    weeks · sessions · co-led by [Y][Y] Names — inline
 *   - CTA:      "I'm in — CHF 287 →" (auth-aware)
 *
 * Robustness:
 *   - No cover image → hero just starts with the eyebrow on cream.
 *     No placeholder gradient (looks like a missing asset, worse than nothing).
 *   - No promise text → falls back to description, then to a synthesized line.
 *   - Solo creator → singular language ("led by", one avatar).
 *
 * The CTA wording escalates across the page: "I'm in" here, "Join program"
 * in the sticky bar, "Commit — CHF 287" at the final commit block. Same
 * destination, different emotional moment.
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

interface Props {
  challengeId: string;
  spaceId: string | null;
  title: string;
  /** Promise (already coalesced with description by vw_challenge_buyer_view —
   *  when promise_text is empty the view substitutes description). May still
   *  be null if both fields are empty. */
  promise: string | null;
  imageUrl: string | null;
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

/**
 * Pick the hero headline. The promise prop already includes description as
 * a fallback (coalesced server-side by vw_challenge_buyer_view). When both
 * are empty we synthesize a line from the data so the hero stays composed.
 */
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
  imageUrl,
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

  return (
    <section className="px-6 lg:px-12 pt-24 lg:pt-32 pb-12 lg:pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Cover image — contained band, rounded, fixed 16:9. Only renders
            when an image is set; no fallback gradient (looks like a broken
            asset, worse than just being absent). */}
        {imageUrl && (
          <div
            className="mb-10 lg:mb-14 rounded-3xl overflow-hidden relative"
            style={{
              aspectRatio: "16 / 9",
              boxShadow:
                "0 1px 2px rgba(15,34,41,0.04), 0 12px 40px rgba(15,34,41,0.08)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Eyebrow — program name in orange, demoted from H1 to context */}
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-5 lg:mb-7"
          style={{ color: "#FF6130" }}
        >
          {title}
        </p>

        {/* H1 — the promise as billboard display type. Drop the quote
            marks: this is the offer, not a testimonial. */}
        <h1
          className="font-black font-headline tracking-tight mb-7 lg:mb-9"
          style={{
            color: "#0F2229",
            fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          {headline}
        </h1>

        {/* Stats + creators inline. Mini avatars in the line so co-led
            identity is established without a dedicated "Led by" block. */}
        <div
          className="flex items-center gap-x-3 gap-y-2 flex-wrap text-sm lg:text-base mb-9 lg:mb-12"
          style={{ color: "#475569" }}
        >
          <span className="font-medium">
            {weeks} {weeks === 1 ? "week" : "weeks"}
          </span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span className="font-medium">
            {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
          </span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span className="font-medium">{solo ? "led by" : "co-led by"}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {creators.map((c) => (
                <MiniAvatar key={c.id} creator={c} />
              ))}
            </div>
            <span
              className="font-bold font-headline ml-1"
              style={{ color: "#0F2229" }}
            >
              {creators
                .map((c) => c.display_name ?? "Creator")
                .join(" & ")}
            </span>
          </div>
        </div>

        {/* Primary CTA — auth-aware, matches the rest of the page's logic.
            Hero copy: "I'm in" (emotional intent). Sticky uses "Join program",
            commit block uses "Commit — CHF X" — escalating across the scroll. */}
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

function MiniAvatar({ creator }: { creator: Creator }) {
  if (creator.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={creator.avatar_url}
        alt={creator.display_name ?? "Creator"}
        className="w-7 h-7 rounded-full object-cover"
        style={{
          border: "2px solid #F2EFE8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      />
    );
  }
  const bg = creator.role === "owner" ? "#FF6130" : "#9CF0FF";
  const fg = creator.role === "owner" ? "#FFFFFF" : "#0F2229";
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black font-headline"
      style={{
        backgroundColor: bg,
        color: fg,
        border: "2px solid #F2EFE8",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {(creator.display_name ?? "?")[0]}
    </div>
  );
}

/**
 * Hero CTA — mirrors PublicCommitBlock's auth-aware logic but with hero
 * wording ("I'm in" instead of "Commit"). The duplication is intentional:
 * each CTA on the page has its own emotional register.
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
