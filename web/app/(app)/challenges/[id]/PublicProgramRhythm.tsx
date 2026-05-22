/**
 * PublicProgramRhythm — Bundle 4.2.2 (centered spine + editorial sessions).
 *
 * Section 1's second half. The spine VISUALLY EMERGES from the product
 * card above (alpha coupling per the design discussion) — its top dot
 * sits at the same X coordinate as the card's bottom-center docking dot,
 * making them feel like one continuous object.
 *
 * Spine architecture:
 *   - Centered (not left-aligned like 4.2.0/4.2.1)
 *   - Solid cyan from top of section to bottom
 *   - Tiny "ALWAYS ON · YOUR TRIBE" tag pinned at the top
 *   - Week markers as cyan filled circles, first marker orange ("start here")
 *   - Week themes as chapter-title display type
 *   - Sessions as MAGAZINE-WEIGHT features hanging from each week
 *
 * Session treatment (editorial weight):
 *   - Image: large, ~16:9 contained within the centered content column.
 *     Strong shadow, rounded corners. The image carries real weight as
 *     a feature photo, not a thumbnail.
 *   - Title: editorial display, ~24-28px font-black
 *   - Metadata: small caps, slate tertiary
 *   - Description: when set, 2-3 lines with readable body weight
 *
 * No "THE JOURNEY" eyebrow header anymore — the visual connection to the
 * card above makes the section's identity self-evident. The journey is
 * NOT a separate marketing beat; it's the unfold of the product card.
 *
 * First CTA — "I'm in" — sits at the end of this block as the natural
 * decision moment after the buyer has seen the entire offer.
 */

import Link from "next/link";
import { PurchaseButton } from "@/app/components/PurchaseButton";

interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
}

interface Props {
  challengeId: string;
  spaceId: string | null;
  startDate: string;
  endDate: string;
  weeklyArc: Array<{ week: number; theme: string }>;
  sessions: SessionLite[];
  priceCents: number;
  currency: string;
  isAuthenticated: boolean;
  hasPurchased: boolean;
  isCreator: boolean;
}

function weekRange(startDate: string, weekNumber: number): { start: Date; end: Date } {
  const programStart = new Date(startDate + "T00:00:00");
  const start = new Date(programStart.getTime() + (weekNumber - 1) * 7 * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start, end };
}

function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function computeTotalWeeks(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return 0;
  const days = Math.floor((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

function sessionWeekNumber(startDate: string, totalWeeks: number, sessionIso: string): number {
  const programStart = new Date(startDate + "T00:00:00");
  const sStart = new Date(sessionIso);
  if (isNaN(programStart.getTime()) || isNaN(sStart.getTime())) return 1;
  const days = Math.floor((sStart.getTime() - programStart.getTime()) / 86400000);
  if (days < 0) return 1;
  return Math.max(1, Math.min(totalWeeks, Math.floor(days / 7) + 1));
}

function formatSessionDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatPrice(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toFixed(0)}`;
}

export function PublicProgramRhythm({
  challengeId,
  spaceId,
  startDate,
  endDate,
  weeklyArc,
  sessions,
  priceCents,
  currency,
  isAuthenticated,
  hasPurchased,
  isCreator,
}: Props) {
  const totalWeeks = computeTotalWeeks(startDate, endDate);
  if (totalWeeks === 0) return null;

  const sessionsByWeek = new Map<number, SessionLite[]>();
  for (const s of sessions) {
    const w = sessionWeekNumber(startDate, totalWeeks, s.start_time);
    if (!sessionsByWeek.has(w)) sessionsByWeek.set(w, []);
    sessionsByWeek.get(w)!.push(s);
  }
  for (const arr of sessionsByWeek.values()) {
    arr.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  const priceLabel = formatPrice(priceCents, currency);

  return (
    <section className="px-6 lg:px-12 pt-0 pb-16 lg:pb-24">
      <div className="max-w-2xl mx-auto relative">
        {/* The cyan spine — centered, solid, runs from top (just below
            the card's docking dot) to the bottom of the last session.
            Same X-axis as the card's docking dot so visually they feel
            like one continuous element. */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full"
          style={{
            top: "0",
            bottom: "120px", // ends above the first CTA
            backgroundColor: "#9CF0FF",
          }}
          aria-hidden
        />

        {/* Always-on tag — pinned at the top of the spine, just below
            where the card ends. */}
        <div className="relative pt-16 lg:pt-20 pb-12 lg:pb-16 flex justify-center">
          <span
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[10px] font-bold font-headline uppercase tracking-[0.2em] relative z-10"
            style={{
              backgroundColor: "#F2EFE8",
              color: "#c2410c",
              border: "1px solid rgba(255,97,48,0.25)",
              boxShadow: "0 1px 3px rgba(15,34,41,0.04)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "#FF6130" }}
            />
            Always on · your tribe
          </span>
        </div>

        {/* Weeks — each is a centered chapter with the marker on the
            spine, theme as chapter title, sessions as magazine-weight
            feature spreads below. */}
        <div className="space-y-16 lg:space-y-20">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
            const range = weekRange(startDate, weekNum);
            const focus = weeklyArc.find((f) => f.week === weekNum)?.theme;
            const weekSessions = sessionsByWeek.get(weekNum) ?? [];
            const isFirst = weekNum === 1;

            return (
              <div key={weekNum} className="relative">
                {/* Week marker — centered on the spine. First week is
                    orange ("start here"); the rest are cyan. */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full z-10"
                  style={{
                    top: "0",
                    backgroundColor: isFirst ? "#FF6130" : "#9CF0FF",
                    border: "4px solid #F2EFE8",
                    boxShadow: isFirst
                      ? "0 0 0 1px rgba(255,97,48,0.30), 0 4px 14px rgba(255,97,48,0.25)"
                      : "0 0 0 1px rgba(8,145,178,0.20)",
                  }}
                  aria-hidden
                />

                {/* Week label — centered, beneath the marker */}
                <div className="text-center pt-10 lg:pt-12">
                  <div
                    className="text-[11px] font-bold font-headline uppercase tracking-[0.2em] mb-3"
                    style={{ color: "#0891b2" }}
                  >
                    Week {weekNum}{" "}
                    <span style={{ color: "#cbd5e1" }}>·</span>{" "}
                    <span style={{ color: "#94a3b8" }}>
                      {formatWeekRange(range.start, range.end)}
                    </span>
                  </div>

                  {/* Week theme as chapter title */}
                  <h3
                    className="font-black font-headline tracking-tight leading-[1.05] mb-8 lg:mb-10"
                    style={{
                      color: "#0F2229",
                      fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {focus && focus.trim() ? focus : `Week ${weekNum}`}
                  </h3>
                </div>

                {/* Sessions for this week — magazine-weight feature
                    spreads. Large image + display title + metadata. */}
                {weekSessions.length > 0 && (
                  <div className="space-y-10 lg:space-y-14">
                    {weekSessions.map((s) => (
                      <SessionFeature key={s.id} session={s} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* First CTA — the decision moment after the entire offer has
            been laid out. Lives at the end of section 1, just below
            the spine. */}
        <div className="mt-20 lg:mt-24 flex justify-center">
          <FirstCTA
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

/**
 * SessionFeature — magazine-weight session card. Image is prominent
 * (16:9), title is editorial display, metadata is small. Description
 * gets readable body weight when present.
 */
function SessionFeature({ session }: { session: SessionLite }) {
  return (
    <article className="max-w-xl mx-auto">
      {session.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.image_url}
          alt=""
          className="w-full mb-5 lg:mb-6"
          style={{
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: "1.25rem",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 8px 24px rgba(15,34,41,0.08)",
          }}
        />
      ) : null}
      <h4
        className="font-black font-headline tracking-tight text-center"
        style={{
          color: "#0F2229",
          fontSize: "clamp(1.25rem, 3.5vw, 1.75rem)",
          letterSpacing: "-0.015em",
          lineHeight: 1.15,
        }}
      >
        {session.title}
      </h4>
      <p
        className="text-[11px] lg:text-xs font-bold font-headline uppercase tracking-[0.18em] text-center mt-3"
        style={{ color: "#94a3b8" }}
        suppressHydrationWarning
      >
        {formatSessionDay(session.start_time)}
        <span style={{ color: "#cbd5e1" }}> · </span>
        {formatSessionTime(session.start_time)}
        <span style={{ color: "#cbd5e1" }}> · </span>
        {formatDuration(session.duration_minutes)}
      </p>
      {session.description && session.description.trim() && (
        <p
          className="text-sm lg:text-[15px] mt-4 leading-relaxed text-center max-w-md mx-auto"
          style={{ color: "#475569" }}
        >
          {session.description}
        </p>
      )}
    </article>
  );
}

/**
 * First CTA — auth-aware. Lives at the end of section 1 as the
 * decision moment after card + spine. "I'm in" wording — emotional
 * intent, the moment the buyer commits in their head.
 */
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
