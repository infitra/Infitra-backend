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
  // *derived* from scrollLeft via the scroll listener. No flag, no
  // timing races between programmatic scroll and user scroll —
  // whichever causes the scroll, the listener picks it up and updates
  // state accordingly. (Bundle 4.2.5 had a programmatic/user-scroll
  // flag with a 600ms timer that drifted out of sync with iOS smooth-
  // scroll, causing dot indicator and slide content to land one apart.)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onScroll() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!container) return;
        const slideWidth = container.clientWidth;
        if (slideWidth === 0) return;
        const idx = Math.round(container.scrollLeft / slideWidth);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      }, 80);
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
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
      {/* Journey track — TOP of the carousel. Stepped progress with
          W-labels above each dot. Active dot enlarged + glow ring. */}
      <JourneyTrack
        totalWeeks={weeks.length}
        activeIndex={activeIndex}
        onJump={jumpTo}
      />

      {/* Constants layer — Bundle 4.2.10.
          The W-track ABOVE shows the PEAKS (discrete live sessions).
          The orange arrow BELOW shows the CONTINUOUS layer that runs
          through all weeks AND keeps going past the final session
          (the tribe + Expert access don't end when the program does).
          Same horizontal width as the W-track, with an arrowhead
          extending slightly past the right edge to visualize "going
          beyond." Persistent — lives in the carousel chrome, doesn't
          change as the user swipes weeks. */}
      <div className="mt-5 lg:mt-6 flex flex-col items-center">
        <svg
          viewBox="0 0 340 14"
          preserveAspectRatio="xMidYMid meet"
          className="w-full max-w-[340px] block"
          aria-hidden
        >
          {/* Origin dot at the left — matches the orange "first marker"
              motif from the W-track ("start here"). */}
          <circle cx="7" cy="7" r="5" fill="#FF6130" />
          {/* Continuous line */}
          <line
            x1="12"
            y1="7"
            x2="310"
            y2="7"
            stroke="#FF6130"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Arrowhead — extends past where the line ends, pointing
              forward to imply "this continues past the program." */}
          <polyline
            points="302,1 320,7 302,13"
            fill="none"
            stroke="#FF6130"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="mt-2.5 text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.22em]"
          style={{ color: "#c2410c" }}
        >
          Always on · Expert access · Tribe
        </span>
      </div>

      {/* Carousel — native scroll-snap. All slides share the tallest
          height (flex stretch). User swipes; no auto-advance. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto journey-carousel mt-8 lg:mt-10"
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
              // Bundle 4.2.8: force a snap-stop at every slide so a hard
              // swipe / fling can't skip past multiple weeks. iOS Safari
              // is particularly aggressive about momentum scrolling
              // through scroll-snap mandatory; "always" stops at each
              // snap point regardless of velocity.
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
    <div className="px-1">
      {/* Week header — the umbrella. Centered, more prominent than
          individual sessions below. */}
      <div className="text-center mb-6 lg:mb-8">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.22em] mb-2.5"
          style={{ color: "#0891b2" }}
        >
          Week {week.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          <span style={{ color: "#94a3b8" }}>{week.weekRange}</span>
        </p>
        <h3
          className="font-black font-headline tracking-tight leading-[1.05]"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1.5rem, 4.5vw, 2rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {week.theme && week.theme.trim() ? week.theme : `Week ${week.weekNumber}`}
        </h3>
      </div>

      {week.sessions.length > 0 ? (
        // Rail-and-sessions container. The left rail visually nests
        // sessions under the week header. Origin dot at the top of the
        // rail visually anchors it to "where the week begins."
        <div className="relative pl-6 lg:pl-7">
          {/* Left rail */}
          <div
            className="absolute left-2 lg:left-2.5 top-0 bottom-0 w-0.5 rounded-full"
            style={{ backgroundColor: "rgba(156, 240, 255, 0.55)" }}
            aria-hidden
          >
            {/* Origin dot — straddles the top of the rail to anchor it
                visually as "the start of this week's content." */}
            <span
              className="absolute -left-[5px] -top-[6px] block w-3 h-3 rounded-full"
              style={{
                backgroundColor: "#9CF0FF",
                border: "3px solid #FAF7F1",
                boxShadow: "0 0 0 1px rgba(8,145,178,0.20)",
              }}
              aria-hidden
            />
          </div>

          {/* Sessions */}
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
      className="flex items-start gap-3.5 lg:gap-5 rounded-2xl p-3.5 lg:p-4"
      // Bundle 4.2.9: each session now lives in its own white card,
      // floating on the cream carousel region. Gives each session
      // visual weight + clear separation, while the carousel still
      // connects them as a week sequence. Hairline border + subtle
      // shadow for premium card feel.
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(15,34,41,0.06)",
        boxShadow:
          "0 1px 2px rgba(15,34,41,0.03), 0 4px 12px rgba(15,34,41,0.04)",
      }}
    >
      {/* Image — left column. Fixed width so layout is predictable
          regardless of image content. 16:9 aspect, rounded, subtle
          shadow to give it a "feature image" feel. */}
      <div className="shrink-0 w-32 lg:w-40">
        {session.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.image_url}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              objectFit: "cover",
              borderRadius: "0.75rem",
              boxShadow:
                "0 1px 2px rgba(15,34,41,0.04), 0 4px 12px rgba(15,34,41,0.06)",
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "0.75rem",
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

      {/* Content — right column. Left-aligned for readability inside
          the row (contrasts cleanly with the centered week header
          and centered SessionSeparator above). */}
      <div className="flex-1 min-w-0 text-left">
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
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.18em] mt-1.5"
          style={{ color: "#94a3b8" }}
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
            const isFirst = i === 0;
            const isActive = i === activeIndex;
            const dotColor = isFirst ? "#FF6130" : "#9CF0FF";
            const glowColor = isFirst
              ? "rgba(255,97,48,0.28)"
              : "rgba(8,145,178,0.28)";
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
