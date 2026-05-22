/**
 * PublicChallengeHero — Bundle 4.2.3 (product card, carousel below).
 *
 * The hero is a defined PRODUCT CARD — a card-shaped offer summary
 * that floats on the cream + wave background. Below the card sits
 * the WeeklyJourneyCarousel (in PublicProgramRhythm) as section 1's
 * second beat. Card and carousel are coupled by adjacency and shared
 * cyan vocabulary — the docking-dot from 4.2.2 was dropped now that
 * the carousel replaces the vertical spine.
 *
 * No CTA inside the card. The card is the offer summary; the first CTA
 * lives at the end of section 1 (after the carousel). The price is
 * shown prominently in the card as a price tag, not a button.
 *
 * Composition (inside the card):
 *   1. Eyebrow:              program name in orange caps
 *   2. H1:                   the promise as the offer's headline
 *   3. Divider
 *   4. Portraits row:        96-112px circular photos, side-by-side,
 *                            each with name + role-accented tagline
 *   5. Connective lines:     "Two Experts — One Program"
 *                            "Followed together in realtime"
 *   6. Divider
 *   7. Stats inline:         "5 weeks · 7 live sessions"
 *   8. Tribe momentum line:  "Plus your tribe — momentum that lasts"
 *   9. Price tag:            "CHF 287 / for the full program"
 *
 * Robustness:
 *   - No avatar uploaded → initial letter on role-tinted circle
 *   - No tagline → name renders alone
 *   - Solo creator → "One Expert — One Program" / "Followed in realtime"
 *   - No promise → falls back via resolveHeadline
 *
 * Brand language: "Expert" not "coach" (Bundle 4.2.2 rename). Capitalized
 * as a noun when referring to the people, lowercase as adjective.
 */

interface Creator {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  tagline: string | null;
  role: "owner" | "cohost";
}

interface Props {
  title: string;
  /** Promise text — view already coalesces description as fallback. */
  promise: string | null;
  startDate: string;
  endDate: string;
  sessionCount: number;
  priceCents: number;
  currency: string;
  creators: Creator[];
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
}: Props) {
  const weeks = weeksBetween(startDate, endDate);
  const headline = resolveHeadline(promise, weeks, creators);
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
      {/* The card itself. Bundle 4.2.3: docking-dot dropped — the
          journey is now a carousel below (not a vertical spine), so
          there's nothing for the dot to physically connect to. Card
          and carousel are coupled by adjacency + cyan vocabulary on
          both surfaces. */}
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-[28px] lg:rounded-[32px] px-7 lg:px-12 py-10 lg:py-14"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.06)",
            boxShadow:
              "0 1px 3px rgba(15,34,41,0.04), 0 24px 64px rgba(15,34,41,0.06)",
          }}
        >
          {/* Eyebrow — program name in orange caps */}
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-5 lg:mb-7 text-center"
            style={{ color: "#FF6130" }}
          >
            {title}
          </p>

          {/* H1 — the promise as the offer's headline. Sized to fit
              within the card width (no clamp jump to massive sizes). */}
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

          <Divider className="mt-8 lg:mt-10 mb-8 lg:mb-10" />

          {/* Expert portraits — the visual core of the offer */}
          <div className="flex items-start justify-center gap-5 lg:gap-8 flex-wrap mb-5">
            {creators.map((c) => (
              <ExpertPortrait key={c.id} creator={c} />
            ))}
          </div>

          {/* Connective lines — "Two Experts — One Program / Followed
              together in realtime." The brand differentiator stated
              explicitly. */}
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

          <Divider className="mt-8 lg:mt-10 mb-8 lg:mb-10" />

          {/* Stats inline + tribe momentum line */}
          <p
            className="text-base lg:text-lg text-center font-black font-headline tracking-tight"
            style={{ color: "#0F2229", letterSpacing: "-0.01em" }}
          >
            {weeks} {weeks === 1 ? "week" : "weeks"}
            <span className="mx-3" style={{ color: "#cbd5e1" }}>·</span>
            {sessionCount} live {sessionCount === 1 ? "session" : "sessions"}
          </p>
          <p
            className="text-xs lg:text-sm text-center mt-2 font-medium"
            style={{ color: "#475569" }}
          >
            Plus your tribe — momentum that lasts
          </p>

          {/* Price tag — not a button. Just the price displayed
              prominently as a product price. The buy action lives at
              the end of section 1, after the journey. */}
          <div className="mt-9 lg:mt-12 text-center">
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
 * Expert portrait — 96px on mobile, 112px on desktop (scaled down from
 * the open-layout 128/160 because they live inside a card now and need
 * to be proportional to the container). Photo + name + role-accented
 * tagline.
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
