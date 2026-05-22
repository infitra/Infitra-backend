"use client";

/**
 * WeeklyJourneyCarousel — Bundle 4.2.4.
 *
 * Lives INSIDE the product card (PublicChallengeHero), positioned
 * between the tribe momentum line and the price tag. It's the
 * "what's actually in the box" preview of the bundled offer.
 *
 * Two key shape changes from 4.2.3:
 *
 *  1. Journey track at the TOP of the carousel, not the bottom.
 *     The structure ("you're looking at 5 weeks") must be visible
 *     BEFORE the content, otherwise slides feel like random session
 *     images cycling. The track is now the stepped-progress
 *     indicator: dots connected by a cyan line, week numbers above,
 *     active week enlarged + glowed, first week always orange.
 *
 *  2. Sessions render as compact rows (small thumbnail + title +
 *     metadata + 1-line description) instead of magazine-weight
 *     editorial spreads. This lets multi-session weeks (e.g. 3
 *     sessions in week 4) show ALL sessions without scrolling
 *     within the slide. Compact > editorial when the carousel
 *     itself is the editorial layer.
 *
 * Behavior unchanged from 4.2.3:
 *   - Auto-rotates every 5s after a 1.5s grace period
 *   - Pauses permanently on any user interaction
 *   - Respects prefers-reduced-motion
 *   - Native CSS scroll-snap for swipe
 *   - ARIA: live region announces active week
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

const AUTO_ROTATE_INTERVAL_MS = 5000;
const AUTO_ROTATE_DELAY_MS = 1500;

export function WeeklyJourneyCarousel({ weeks }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoRotateOn, setAutoRotateOn] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setAutoRotateOn(false);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setAutoRotateOn(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!autoRotateOn) return;
    if (weeks.length <= 1) return;
    const start = setTimeout(() => {
      const interval = setInterval(() => {
        programmaticScrollRef.current = true;
        setActiveIndex((prev) => (prev + 1) % weeks.length);
      }, AUTO_ROTATE_INTERVAL_MS);
      (start as unknown as { i?: number }).i = interval as unknown as number;
    }, AUTO_ROTATE_DELAY_MS);
    return () => {
      clearTimeout(start);
      const stashed = (start as unknown as { i?: number }).i;
      if (stashed) clearInterval(stashed);
    };
  }, [autoRotateOn, weeks.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!programmaticScrollRef.current) return;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: slideWidth * activeIndex,
      behavior: "smooth",
    });
    const t = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    function onScroll() {
      if (programmaticScrollRef.current) return;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!container) return;
        const slideWidth = container.clientWidth;
        const idx = Math.round(container.scrollLeft / slideWidth);
        setActiveIndex(idx);
      }, 120);
    }

    function pause() {
      setAutoRotateOn(false);
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("touchstart", pause, { passive: true });
    container.addEventListener("mousedown", pause);
    container.addEventListener("mouseenter", pause);

    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("touchstart", pause);
      container.removeEventListener("mousedown", pause);
      container.removeEventListener("mouseenter", pause);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, []);

  function jumpTo(index: number) {
    setAutoRotateOn(false);
    programmaticScrollRef.current = true;
    setActiveIndex(index);
  }

  if (weeks.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Weekly journey of the program"
    >
      {/* Journey track — at the TOP. The stepped-progress indicator
          establishes structure BEFORE the slide content. Buyer sees
          5 dots and knows "I'm looking at 5 weeks." */}
      <JourneyTrack
        totalWeeks={weeks.length}
        activeIndex={activeIndex}
        onJump={jumpTo}
      />

      {/* Carousel container — native scroll-snap. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto journey-carousel mt-6 lg:mt-7"
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
            className="min-w-full shrink-0"
            style={{ scrollSnapAlign: "center" }}
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

/** A single week's slide — week label, theme, compact session rows. */
function WeekSlide({ week }: { week: WeekData }) {
  return (
    <div className="px-1">
      <div className="text-center mb-5 lg:mb-6">
        <p
          className="text-[10px] font-bold font-headline uppercase tracking-[0.22em] mb-2"
          style={{ color: "#0891b2" }}
        >
          Week {week.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          <span style={{ color: "#94a3b8" }}>{week.weekRange}</span>
        </p>
        <h3
          className="font-black font-headline tracking-tight leading-[1.1]"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1.25rem, 4vw, 1.625rem)",
            letterSpacing: "-0.015em",
          }}
        >
          {week.theme && week.theme.trim() ? week.theme : `Week ${week.weekNumber}`}
        </h3>
      </div>

      {week.sessions.length > 0 ? (
        <ul className="space-y-3 lg:space-y-4">
          {week.sessions.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </ul>
      ) : (
        <p
          className="text-xs text-center italic py-4"
          style={{ color: "#94a3b8" }}
        >
          Tribe-space time — no live session this week.
        </p>
      )}
    </div>
  );
}

/**
 * SessionRow — compact horizontal row. Small thumbnail (left) + title,
 * metadata, optional 1-line description (right). Designed to fit
 * multiple sessions in one slide without scroll.
 */
function SessionRow({ session }: { session: SessionLite }) {
  return (
    <li
      className="flex items-start gap-3.5"
      style={{
        backgroundColor: "rgba(15,34,41,0.03)",
        border: "1px solid rgba(15,34,41,0.05)",
        borderRadius: "0.875rem",
        padding: "0.625rem",
      }}
    >
      {session.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.image_url}
          alt=""
          className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div
          className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg shrink-0 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(156,240,255,0.40), rgba(255,97,48,0.20))",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt=""
            width={16}
            height={16}
            style={{ opacity: 0.35 }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4
          className="text-[13px] lg:text-sm font-black font-headline leading-tight"
          style={{ color: "#0F2229" }}
        >
          {session.title}
        </h4>
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.15em] mt-1"
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
            className="text-[12px] mt-1.5 leading-snug line-clamp-1"
            style={{ color: "#64748b" }}
          >
            {session.description}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * JourneyTrack — stepped progress indicator. The 5 weeks shown as 5
 * dots connected by a cyan line, week numbers above each dot. The
 * active week's dot is enlarged with a soft glow ring. First week is
 * always orange (start signal); the rest cyan.
 *
 * Sits at the TOP of the carousel so the structure is unmistakable
 * before any slide content loads.
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
      {/* Week-number labels above the dots */}
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

      {/* The dot-and-line track */}
      <div className="relative h-6 flex items-center px-3">
        {/* Cyan connecting line */}
        <div
          className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px]"
          style={{ backgroundColor: "rgba(156,240,255,0.55)" }}
          aria-hidden
        />
        {/* Dots row */}
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
