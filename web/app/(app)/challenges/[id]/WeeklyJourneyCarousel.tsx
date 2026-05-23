"use client";

/**
 * WeeklyJourneyCarousel — Bundle 4.2.5.
 *
 * Lives INSIDE the product card (PublicChallengeHero), between the
 * spec block and the price-as-CTA. The "what's actually in the box"
 * preview of the bundled offer.
 *
 * 4.2.5 changes from 4.2.4:
 *  - Auto-rotate DROPPED. Buyer controls their own pace. Editorial
 *    content needs dwell time; auto-rotate fought that. Manual swipe
 *    + dot-tap navigation only.
 *  - Sessions render with MAGAZINE/EDITORIAL weight again: large 16:9
 *    image, ~22-28px display title, generous metadata, full-weight
 *    description (no line-clamp). Multi-session weeks stack vertically
 *    with editorial weight per session.
 *  - All slides match the tallest slide's height (CSS flex stretch).
 *    Shorter weeks have whitespace at the bottom — that's editorial
 *    visual rest, not waste.
 *
 * Journey track at the TOP stays from 4.2.4 — stepped progress
 * indicator with W1-W5 labels, active dot enlarged + glow ring,
 * first week orange ("start here"). Tap a dot to jump.
 */

import { useEffect, useRef, useState } from "react";

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
  weeks: WeekData[];
}

export function WeeklyJourneyCarousel({ weeks }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Single source of truth: the DOM scroll position. activeIndex is
  // *derived* from scrollLeft via the scroll listener.
  //
  // Bundle 4.2.12: switched from setTimeout debounce (80ms) to
  // requestAnimationFrame. The debounce was visible as the dot
  // indicator "lagging" behind the user's swipe — the index updated
  // after the swipe settled, not as it progressed. rAF runs once per
  // frame (~16ms), and the (prev === idx) early return prevents
  // pointless re-renders when the rounded index hasn't actually
  // changed. The indicator now follows the swipe smoothly.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!container) return;
        const slideWidth = container.clientWidth;
        if (slideWidth === 0) return;
        const idx = Math.round(container.scrollLeft / slideWidth);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      });
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  function jumpTo(index: number) {
    const container = containerRef.current;
    if (!container) return;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
    // No setState here — the scroll listener will update activeIndex
    // as the smooth scroll progresses. Indicator literally tracks the
    // scroll position, which gives a nice "dot travelling along the
    // track" effect as you skip multiple weeks.
  }

  if (weeks.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Weekly journey of the program"
    >
      {/* Inner WEEK card — Bundle 4.2.12.
          The W-track is now INSIDE this card (was outside, on cream).
          The card holds the whole journey beat: navigation (spine) at
          top, divider, then the swipable slides below. The cream outer
          region around it still provides ambient breathing room. */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(15, 34, 41, 0.06)",
          boxShadow:
            "0 1px 2px rgba(15, 34, 41, 0.03), 0 4px 14px rgba(15, 34, 41, 0.05)",
        }}
      >
        {/* Journey track — sits inside the white card at the top.
            Padding around it for breath; the cyan dots POP against
            white (they were under-contrasted on cream). */}
        <div className="px-4 lg:px-5 pt-6 lg:pt-7 pb-4 lg:pb-5">
          <JourneyTrack
            totalWeeks={weeks.length}
            activeIndex={activeIndex}
            onJump={jumpTo}
          />
        </div>

        {/* Subtle divider — inside the card, between the navigation
            (spine) above and the swipable content below. */}
        <div
          className="h-px mx-4 lg:mx-5"
          style={{ backgroundColor: "rgba(8, 145, 178, 0.18)" }}
          aria-hidden
        />

        {/* Swipable slides */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto journey-carousel"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            .journey-carousel::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {weeks.map((week, i) => (
            <div
              key={week.weekNumber}
              className="w-full shrink-0"
              style={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Week ${week.weekNumber} of ${weeks.length}`}
              aria-hidden={i !== activeIndex}
            >
              <WeekSlide week={week} />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Week {activeIndex + 1} of {weeks.length}
      </p>
    </div>
  );
}

/** A single week's slide — week header (umbrella) over indented sessions.
 *
 *  Bundle 4.2.10: the week is now visually the UMBRELLA over its
 *  sessions. The centered week header (date label + theme) sits at top.
 *  Below it, a thin cyan vertical rail runs down the LEFT side of the
 *  session area, with sessions indented to the right of the rail. The
 *  rail visualizes "everything below this is INSIDE this week."
 *
 *  Bundle 4.2.7 carryover: multi-session weeks get SessionSeparator
 *  numbering; single-session weeks omit the separator (one session
 *  doesn't need numbering). */
function WeekSlide({ week }: { week: WeekData }) {
  const isMultiSession = week.sessions.length > 1;

  return (
    // Slide-level padding for the inner card (Bundle 4.2.11). The
    // slide content has clean breath from the inner card's edges.
    <div className="px-4 lg:px-5 py-5 lg:py-6">
      {/* Week header — Bundle 4.2.11 hierarchy swap.
          The week-with-dates is now the BIG uppercase header (anchor
          for which slide you're on); the theme is the subtitle below.
          Inverted from previous treatment where theme was the display
          element and week-date was a small caps label. */}
      <div className="text-center mb-6 lg:mb-8">
        <h3
          className="font-black font-headline uppercase tracking-tight leading-[1.1]"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1.125rem, 3.8vw, 1.5rem)",
            letterSpacing: "-0.015em",
          }}
        >
          Week {week.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {week.weekRange}
        </h3>
        {week.theme && week.theme.trim() && (
          <p
            className="text-base lg:text-lg mt-2 font-medium"
            style={{ color: "#475569" }}
          >
            {week.theme}
          </p>
        )}
      </div>

      {week.sessions.length > 0 ? (
        // Bundle 4.2.12: rail removed (read as noise). The inner white
        // card already creates the umbrella around the week — a
        // vertical rail inside it was redundant. Sessions stack
        // vertically across the full slide width; the separator and
        // session card are properly centered/aligned without the
        // rail's left offset.
        <div>
          {week.sessions.map((s, idx) => (
            <div
              key={s.id}
              className={idx > 0 ? "mt-7 lg:mt-9" : undefined}
            >
              {isMultiSession && (
                <SessionSeparator
                  number={idx + 1}
                  dateLabel={formatSessionDay(s.start_time)}
                />
              )}
              <SessionFeature
                session={s}
                showDayInMeta={!isMultiSession}
              />
            </div>
          ))}
        </div>
      ) : (
        <p
          className="text-sm text-center italic py-6"
          style={{ color: "#94a3b8" }}
        >
          Tribe-space time — no live session this week.
        </p>
      )}
    </div>
  );
}

/**
 * SessionSeparator — within-week structural marker.
 *
 * Same visual language as the W1-W5 journey track at the carousel
 * level (thin cyan line + small-caps text), but at the session scope.
 * The number gives sequential structure ("1, 2, 3"); the day label
 * places the session in the week's calendar without echoing the
 * date-time metadata below.
 */
function SessionSeparator({
  number,
  dateLabel,
}: {
  number: number;
  dateLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4 lg:mb-5">
      <div
        className="flex-1 h-[1.5px] rounded-full"
        style={{ backgroundColor: "rgba(156,240,255,0.55)" }}
        aria-hidden
      />
      <span
        className="text-[11px] font-bold font-headline uppercase tracking-[0.2em] shrink-0"
        style={{ color: "#0891b2" }}
      >
        {number}
        <span style={{ color: "#cbd5e1" }}> · </span>
        <span style={{ color: "#94a3b8" }}>{dateLabel}</span>
      </span>
      <div
        className="flex-1 h-[1.5px] rounded-full"
        style={{ backgroundColor: "rgba(156,240,255,0.55)" }}
        aria-hidden
      />
    </div>
  );
}

/**
 * SessionFeature — Bundle 4.2.8 compact horizontal row.
 *
 * "Editorial in principle, compact in execution." Each session keeps
 * its own image, strong typographic title, metadata, and description —
 * but in a horizontal layout (image left, content right) that's ~120-
 * 160px tall instead of ~400px. Multi-session weeks now fit all
 * sessions on one slide without internal scroll.
 *
 * showDayInMeta — when false (multi-session week), the day is already
 * in the SessionSeparator above, so the metadata drops it ("19:00 · 1H"
 * instead of "FRI 12 JUN · 19:00 · 1H").
 */
function SessionFeature({
  session,
  showDayInMeta,
}: {
  session: SessionLite;
  showDayInMeta: boolean;
}) {
  return (
    <article
      // Bundle 4.2.12: items-stretch lets the image column fill the
      // card height edge-to-edge (top, left, bottom). overflow-hidden
      // + rounded-2xl on the card clips the image to the card's
      // rounded corners. Image flush to card edges; text has padding
      // on right + top + bottom only.
      className="flex items-stretch gap-3.5 lg:gap-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#FAF7F1",
        border: "1px solid rgba(15,34,41,0.05)",
      }}
    >
      {/* Image — left column, flush to card edges. Relative wrapper +
          absolute image lets it stretch to match content column height
          while preserving aspect-correct cropping via object-cover. */}
      <div className="shrink-0 w-32 lg:w-40 relative">
        {session.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(156,240,255,0.40), rgba(255,97,48,0.20))",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt=""
              width={18}
              height={18}
              style={{ opacity: 0.35 }}
            />
          </div>
        )}
      </div>

      {/* Content — right column. Padded on right + top + bottom
          (the image-side has no padding because the image fills it). */}
      <div className="flex-1 min-w-0 text-left py-3.5 lg:py-4 pr-3.5 lg:pr-4">
        <h4
          className="font-black font-headline tracking-tight"
          style={{
            color: "#0F2229",
            fontSize: "clamp(0.95rem, 3.5vw, 1.0625rem)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {session.title}
        </h4>
        {/* Metadata — Bundle 4.2.12 bump.
            Was: 10-11px in slate tertiary (#94a3b8) → whispered.
            Now: 11-12px in slate secondary (#475569) with slightly
            tighter tracking. Same small-caps treatment, clearly
            readable without dominating the title. */}
        <p
          className="text-[11px] lg:text-[12px] font-bold font-headline uppercase tracking-[0.15em] mt-2"
          style={{ color: "#475569" }}
          suppressHydrationWarning
        >
          {showDayInMeta && (
            <>
              {formatSessionDay(session.start_time)}
              <span style={{ color: "#cbd5e1" }}> · </span>
            </>
          )}
          {formatSessionTime(session.start_time)}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {formatDuration(session.duration_minutes)}
        </p>
        {session.description && session.description.trim() && (
          <p
            className="text-[12px] lg:text-[13px] mt-2 leading-snug line-clamp-2"
            style={{ color: "#64748b" }}
          >
            {session.description}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * JourneyTrack — stepped progress indicator. Week-number labels (W1, W2,
 * ...) above the dots; dots connected by a thin cyan line; active dot
 * enlarged with a soft glow ring; first dot always orange ("start
 * here"). Tapping a dot jumps to that week.
 */
function JourneyTrack({
  totalWeeks,
  activeIndex,
  onJump,
}: {
  totalWeeks: number;
  activeIndex: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-end justify-between mb-2.5 px-3">
        {Array.from({ length: totalWeeks }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <span
              key={i}
              className="text-[11px] lg:text-xs font-bold font-headline uppercase tracking-[0.2em] transition-colors"
              style={{
                color: isActive ? "#0F2229" : "#cbd5e1",
              }}
            >
              W{i + 1}
            </span>
          );
        })}
      </div>

      <div className="relative h-7 flex items-center px-3">
        <div
          className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px]"
          style={{ backgroundColor: "rgba(156,240,255,0.55)" }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between w-full">
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const isActive = i === activeIndex;
            // Bundle 4.2.12: orange now means "you are here" (active),
            // not "start of program" (first week). The dot moves with
            // the swipe — active dot is orange and larger; inactive
            // dots are cyan and smaller. Cleaner indicator semantics.
            const dotColor = isActive ? "#FF6130" : "#9CF0FF";
            const glowColor = "rgba(255,97,48,0.28)";
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                className="relative flex items-center justify-center w-7 h-7 rounded-full transition-transform active:scale-90"
                aria-label={`Week ${i + 1}${isActive ? " (current)" : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className="block rounded-full transition-all"
                  style={{
                    backgroundColor: dotColor,
                    width: isActive ? "16px" : "10px",
                    height: isActive ? "16px" : "10px",
                    boxShadow: isActive
                      ? `0 0 0 6px ${glowColor}, 0 1px 3px rgba(15,34,41,0.10)`
                      : "0 1px 2px rgba(15,34,41,0.06)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Format helpers ─────────────────────────────────────────────── */

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
