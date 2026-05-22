/**
 * PublicChallengeHero — Bundle 4.2.4 (carousel inside the card).
 *
 * The product card now contains the entire offer: header, Experts,
 * stats, tribe momentum line, weekly journey carousel, and price tag.
 * The card IS the product — one defined object that holds everything
 * the buyer needs to decide.
 *
 * The carousel sits between the tribe line and the price tag. Journey
 * track at the TOP of the carousel makes the 5-week structure
 * unmistakable before any slide content loads. Sessions render as
 * compact rows so multi-session weeks (e.g. 3 sessions in week 4)
 * show all sessions without internal scroll.
 *
 * The first CTA lives OUTSIDE the card, immediately below it. The
 * card is the offer; the CTA is the action.
 *
 * Composition (inside the card):
 *   1. Eyebrow:              program name in orange caps
 *   2. H1:                   the promise
 *   3. Divider
 *   4. Portraits row:        Experts with names + role-accented taglines
 *   5. Connective lines:     "Two Experts — One Program"
 *                            "Followed together in realtime"
 *   6. Divider
 *   7. Stats inline:         "5 weeks · 7 live sessions"
 *   8. Tribe momentum line:  "Plus your tribe — momentum that lasts"
 *   9. Divider
 *  10. Weekly journey carousel: stepped journey track + week slides
 *  11. Divider
 *  12. Price tag:            "CHF 287 / for the full program"
 *
 * Robustness:
 *   - No avatar uploaded → initial letter on role-tinted circle
 *   - No tagline → name renders alone
 *   - Solo creator → "One Expert — One Program" / "Followed in realtime"
 *   - No promise → falls back via resolveHeadline
 *   - No sessions → carousel renders the week labels + "tribe space" empty
 *     state per slide; still structurally complete
 */

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
  title: string;
  promise: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  priceCents: number;
  currency: string;
  creators: Creator[];
  weeks: WeekData[];
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
  title,
  promise,
  startDate,
  endDate,
  sessionCount,
  priceCents,
  currency,
  creators,
  weeks,
}: Props) {
  const totalWeeks = weeksBetween(startDate, endDate);
  const headline = resolveHeadline(promise, totalWeeks, creators);
  const priceLabel = formatPrice(priceCents, currency);
  const solo = creators.length === 1;

  const connective1 = solo
    ? "One Expert — One Program"
    : creators.length === 2
      ? "Two Experts — One Program"
      : `${creators.length} Experts — One Program`;
  const connective2 = solo
    ? "Followed in realtime"
    : "Followed together in realtime";

  return (
    <section className="px-6 lg:px-12 pt-10 lg:pt-14 pb-0">
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-[28px] lg:rounded-[32px] px-6 lg:px-10 py-10 lg:py-12"
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

          {/* Expert portraits */}
          <div className="flex items-start justify-center gap-5 lg:gap-8 flex-wrap mb-5">
            {creators.map((c) => (
              <ExpertPortrait key={c.id} creator={c} />
            ))}
          </div>

          {/* Connective lines */}
          <p
            className="text-sm lg:text-base text-center font-black font-headline tracking-tight"
            style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
          >
            {connective1}
          </p>
          <p
            className="text-xs lg:text-sm text-center mt-1.5 font-medium"
            style={{ color: "#475569" }}
          >
            {connective2}
          </p>

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* Stats + tribe momentum line */}
          <p
            className="text-base lg:text-lg text-center font-black font-headline tracking-tight"
            style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
          >
            {totalWeeks} {totalWeeks === 1 ? "week" : "weeks"}
            <span className="mx-3" style={{ color: "#cbd5e1" }}>·</span>
            {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
          </p>
          <p
            className="text-xs lg:text-sm text-center mt-2 font-medium"
            style={{ color: "#475569" }}
          >
            Plus your tribe — momentum that lasts
          </p>

          <Divider className="mt-7 lg:mt-9 mb-6 lg:mb-7" />

          {/* WEEKLY JOURNEY CAROUSEL — the in-card preview of what's
              inside the offer. Journey track at the top establishes
              "5 weeks" structure before slide content loads. */}
          <WeeklyJourneyCarousel weeks={weeks} />

          <Divider className="mt-7 lg:mt-9 mb-7 lg:mb-9" />

          {/* Price tag */}
          <div className="text-center">
            <div
              className="font-black font-headline tracking-tight"
              style={{
                color: "#0F2229",
                fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {priceLabel}
            </div>
            <p
              className="text-[11px] font-bold font-headline uppercase tracking-[0.18em] mt-2"
              style={{ color: "#94a3b8" }}
            >
              For the full program
            </p>
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
 * Expert portrait — 96px on mobile, 112px on desktop. Photo + name +
 * role-accented tagline.
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
