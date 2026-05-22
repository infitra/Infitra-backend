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

      {/* Carousel — native scroll-snap. All slides share the tallest
          height (flex stretch). User swipes; no auto-advance. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto journey-carousel mt-7 lg:mt-9"
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
            style={{ scrollSnapAlign: "start" }}
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

/** A single week's slide — week label, theme, editorial session features. */
function WeekSlide({ week }: { week: WeekData }) {
  return (
    <div className="px-1">
      {/* Week header */}
      <div className="text-center mb-7 lg:mb-9">
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.22em] mb-2.5"
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
        <div className="space-y-9 lg:space-y-12">
          {week.sessions.map((s) => (
            <SessionFeature key={s.id} session={s} />
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
 * SessionFeature — magazine/editorial weight session.
 *   - Large 16:9 image (full content width)
 *   - ~22-28px display title (font-black)
 *   - Small-caps metadata strip
 *   - Full-weight description body when present (no line-clamp)
 */
function SessionFeature({ session }: { session: SessionLite }) {
  return (
    <article>
      {session.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.image_url}
          alt=""
          className="w-full mb-4 lg:mb-5"
          style={{
            aspectRatio: "16 / 9",
            objectFit: "cover",
            borderRadius: "1.125rem",
            boxShadow:
              "0 1px 2px rgba(15,34,41,0.04), 0 8px 24px rgba(15,34,41,0.08)",
          }}
        />
      ) : null}
      <h4
        className="font-black font-headline tracking-tight text-center"
        style={{
          color: "#0F2229",
          fontSize: "clamp(1.25rem, 4vw, 1.625rem)",
          letterSpacing: "-0.015em",
          lineHeight: 1.15,
        }}
      >
        {session.title}
      </h4>
      <p
        className="text-[11px] lg:text-xs font-bold font-headline uppercase tracking-[0.18em] text-center mt-2.5"
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
          className="text-sm lg:text-[15px] mt-3.5 leading-relaxed text-center max-w-md mx-auto"
          style={{ color: "#475569" }}
        >
          {session.description}
        </p>
      )}
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
      <div className="flex items-end justify-between mb-2 px-3">
        {Array.from({ length: totalWeeks }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <span
              key={i}
              className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] transition-colors"
              style={{
                color: isActive ? "#0F2229" : "#cbd5e1",
              }}
            >
              W{i + 1}
            </span>
          );
        })}
      </div>

      <div className="relative h-6 flex items-center px-3">
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
                className="relative flex items-center justify-center w-6 h-6 rounded-full transition-transform active:scale-90"
                aria-label={`Week ${i + 1}${isActive ? " (current)" : ""}`}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className="block rounded-full transition-all"
                  style={{
                    backgroundColor: dotColor,
                    width: isActive ? "14px" : "9px",
                    height: isActive ? "14px" : "9px",
                    boxShadow: isActive
                      ? `0 0 0 5px ${glowColor}, 0 1px 3px rgba(15,34,41,0.10)`
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
