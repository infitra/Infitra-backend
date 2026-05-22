"use client";

/**
 * WeeklyJourneyCarousel — Bundle 4.2.3.
 *
 * Compact horizontal carousel that replaces the vertical cyan spine.
 * One slide per week. Sessions for the week stack vertically inside
 * each slide (magazine/editorial weight per session).
 *
 * The pagination indicator IS the spine — a thin cyan "journey track"
 * with 5 dots (first orange = "start here"). Tap a dot to jump.
 * The track is the spine concept finally in a form that actually
 * carries the journey feeling: compact, visible at a glance, the
 * buyer's position on the track is explicit.
 *
 * Behavior:
 *   - Auto-rotates every 5s once the user lands on the page (1.5s
 *     delay before the first rotation to let the user orient).
 *   - Pauses permanently when the user swipes, taps a dot, or hovers
 *     (desktop). One interaction = manual control for that session.
 *   - Respects prefers-reduced-motion: reduce → no auto-rotate.
 *   - Native CSS scroll-snap for swipe behavior (no library needed).
 *   - Scrollbar hidden. Smooth scroll behavior so auto-advance feels
 *     like a natural slide, not a jump.
 *
 * Accessibility:
 *   - Each dot is a real <button> with aria-label "Week N"
 *   - Carousel has role="region" with aria-roledescription="carousel"
 *   - Each slide has aria-label "Week N of M"
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
  // Tracks whether the active-index change came from auto-rotate (so we
  // programmatically scroll) vs from a user swipe (so we don't fight
  // the user's gesture).
  const programmaticScrollRef = useRef(false);

  // Respect prefers-reduced-motion
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

  // Auto-rotate. Cycles 0 → 1 → ... → N-1 → 0. Only when not paused.
  useEffect(() => {
    if (!autoRotateOn) return;
    if (weeks.length <= 1) return;
    const id = setTimeout(() => {
      const intervalId = setInterval(() => {
        setActiveIndex((prev) => {
          programmaticScrollRef.current = true;
          return (prev + 1) % weeks.length;
        });
      }, AUTO_ROTATE_INTERVAL_MS);
      // Stash interval id on the timeout's cleanup
      (id as unknown as { intervalId?: number }).intervalId = intervalId as unknown as number;
    }, AUTO_ROTATE_DELAY_MS);
    return () => {
      clearTimeout(id);
      const stashed = (id as unknown as { intervalId?: number }).intervalId;
      if (stashed) clearInterval(stashed);
    };
  }, [autoRotateOn, weeks.length]);

  // When activeIndex changes (auto-rotate OR dot tap), scroll the
  // carousel to match. Skip if the user is currently scrolling (we set
  // the flag below in onScroll to avoid fighting them).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!programmaticScrollRef.current) return;
    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: slideWidth * activeIndex,
      behavior: "smooth",
    });
    // Clear the flag after the scroll begins
    const t = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [activeIndex]);

  // Detect manual scroll → update activeIndex + pause auto-rotate.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    function onScroll() {
      // Don't reverse-sync when WE caused the scroll
      if (programmaticScrollRef.current) return;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!container) return;
        const slideWidth = container.clientWidth;
        const idx = Math.round(container.scrollLeft / slideWidth);
        setActiveIndex(idx);
      }, 120);
    }

    function pauseAutoRotate() {
      setAutoRotateOn(false);
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    // Any direct interaction (touch on mobile, mousedown on desktop)
    // pauses auto-rotate permanently for this session.
    container.addEventListener("touchstart", pauseAutoRotate, { passive: true });
    container.addEventListener("mousedown", pauseAutoRotate);
    container.addEventListener("mouseenter", pauseAutoRotate);

    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("touchstart", pauseAutoRotate);
      container.removeEventListener("mousedown", pauseAutoRotate);
      container.removeEventListener("mouseenter", pauseAutoRotate);
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
      {/* Carousel container — native CSS scroll-snap for swipe gestures.
          Scrollbar hidden via inline styles (no global CSS dependency). */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          // @ts-expect-error vendor prefix for Webkit scrollbar
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          [aria-roledescription="carousel"] > div::-webkit-scrollbar {
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

      {/* Journey track — the cyan line with N dots */}
      <JourneyTrack
        totalWeeks={weeks.length}
        activeIndex={activeIndex}
        onJump={jumpTo}
      />

      {/* Tiny live region announces the active week to screen readers */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Week {activeIndex + 1} of {weeks.length}
      </p>
    </div>
  );
}

/** A single week's slide — week label, theme, stacked sessions. */
function WeekSlide({ week }: { week: WeekData }) {
  return (
    <div className="px-4 lg:px-8 py-2">
      <div className="text-center mb-6 lg:mb-8">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.2em] mb-2.5"
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
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {week.theme && week.theme.trim() ? week.theme : `Week ${week.weekNumber}`}
        </h3>
      </div>

      {week.sessions.length > 0 ? (
        <div className="space-y-8 lg:space-y-10">
          {week.sessions.map((s) => (
            <SessionFeature key={s.id} session={s} />
          ))}
        </div>
      ) : (
        <p
          className="text-sm text-center italic"
          style={{ color: "#94a3b8" }}
        >
          No live sessions this week — keep up the momentum in your tribe space.
        </p>
      )}
    </div>
  );
}

/**
 * SessionFeature — magazine-weight session. Same treatment as the
 * previous spine version: large 16:9 image, editorial title, small-caps
 * metadata, optional description.
 */
function SessionFeature({ session }: { session: SessionLite }) {
  return (
    <article className="max-w-md mx-auto">
      {session.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.image_url}
          alt=""
          className="w-full mb-4 lg:mb-5"
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
          fontSize: "clamp(1.125rem, 3vw, 1.5rem)",
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
        }}
      >
        {session.title}
      </h4>
      <p
        className="text-[11px] font-bold font-headline uppercase tracking-[0.18em] text-center mt-2.5"
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
          className="text-sm mt-3 leading-relaxed text-center max-w-sm mx-auto"
          style={{ color: "#475569" }}
        >
          {session.description}
        </p>
      )}
    </article>
  );
}

/**
 * JourneyTrack — pagination indicator AND the spine, finally fused.
 *
 * Horizontal thin cyan line with N dots evenly spaced along it. First
 * dot is orange ("start here," same as the old vertical spine's first
 * marker). Active dot has a glow ring. Each dot is a tap target.
 *
 * The track caption beneath shows "Week N of M" — functional plus
 * subtle reinforcement of the journey feel.
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
    <div className="mt-8 lg:mt-10 mb-2">
      {/* The track itself */}
      <div className="relative max-w-[280px] mx-auto h-8 flex items-center">
        {/* The cyan line that the dots sit on */}
        <div
          className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px]"
          style={{ backgroundColor: "rgba(156,240,255,0.55)" }}
          aria-hidden
        />
        {/* Dots */}
        <div className="relative flex items-center justify-between w-full">
          {Array.from({ length: totalWeeks }).map((_, i) => {
            const isFirst = i === 0;
            const isActive = i === activeIndex;
            const dotColor = isFirst ? "#FF6130" : "#9CF0FF";
            const glowColor = isFirst
              ? "rgba(255,97,48,0.25)"
              : "rgba(8,145,178,0.25)";
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
                  className="block w-3 h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: dotColor,
                    boxShadow: isActive
                      ? `0 0 0 5px ${glowColor}`
                      : "0 1px 2px rgba(15,34,41,0.06)",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      {/* Caption beneath the track */}
      <p
        className="text-[10px] font-bold font-headline uppercase tracking-[0.22em] text-center mt-3"
        style={{ color: "#94a3b8" }}
      >
        Week {activeIndex + 1} of {totalWeeks}
      </p>
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
