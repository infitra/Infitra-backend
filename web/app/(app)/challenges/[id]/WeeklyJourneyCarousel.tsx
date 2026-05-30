"use client";

/**
 * WeeklyJourneyCarousel — canonical sessions carousel (Bundle 4.2.47).
 *
 * Lives INSIDE the product card (PublicChallengeHero). Contains the
 * whole "journey" beat: a W1-WN navigation track + per-week sessions
 * shown as agenda items. Active dot = orange, other dots = cyan.
 *
 * Originally introduced in 4.2.13, replaced by a flat
 * SessionsCarousel in 4.2.14, then resurrected for an A/B test in
 * 4.2.37 (/weekly route), upgraded in 4.2.39 with agenda-style
 * cards + chapter-heading week titles, and promoted to the canonical
 * variant in 4.2.47 after the weekly experience won the feedback
 * round. The /weekly route was retired in the same bundle.
 *
 * Bundle 4.2.39 polish (current shape):
 *
 *  - Week header reframed: "WEEK 2 · 10 JAN – 16 JAN" + "Building
 *    Consistency" (two beats) → "Week 2: Building Consistency"
 *    (single editorial beat). Dates dropped — the W-track dots
 *    already convey position; the theme is what matters.
 *
 *  - Session cards reframed as AGENDA ITEMS:
 *      * Lead with WHEN: day eyebrow + time line above the title.
 *      * Title is the centerpiece, not the lede.
 *      * No description preview, no See-details link — depth
 *        lives in the modal.
 *      * Whole card is the click target (button + hover lift).
 *      * Image 1:1 → 3:4 portrait for proper visual weight.
 *
 * Bundle 4.2.37 (resurrection / parity with flat):
 *
 *  - Resurrected from commit 295c7ef so the /weekly A/B route
 *    can render the older weekly-nav pattern alongside the flat
 *    SessionsCarousel at /challenges/[id].
 *
 *  - Cohost-aware: SessionLite carries host + cohosts; cards
 *    render a small facepile + role-tinted names ("Alex & Mira").
 *    Modal shows "Led by" / "Co-led by" + facepile.
 *
 *  - Times pinned to Asia/Phnom_Penh (DISPLAY_TZ) for deterministic
 *    SSR/CSR rendering — mirror of the flat carousel's TZ fix.
 *
 * Bundle 4.2.13 carryover:
 *
 *  - rAF-based scroll listener for smooth indicator tracking.
 *  - Active dot = orange (moves with swipe); other dots = cyan.
 *  - W-track INSIDE the white inner card with breathing room
 *    above + below.
 *  - SessionSeparator dropped; all sessions share the same card
 *    layout regardless of week count.
 */

import { Fragment, useEffect, useRef, useState } from "react";

// Bundle 4.2.37: mirror of the cohost-aware shape used by the flat
// SessionsCarousel (added there in 4.2.35) so the A/B comparison
// between flat and weekly stays apples-to-apples — both variants
// surface co-led sessions, both pin formatting to Asia/Phnom_Penh.

interface HostLite {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

interface SessionLite {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
  host: HostLite | null;
  cohosts: HostLite[];
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
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Bundle 4.2.40: dynamic carousel height. Each slide has different
  // content (1 session vs 3+), so the default flex behavior (container
  // grows to the tallest slide) left dead space in the shorter ones.
  // We track each slide's natural height and tween the container to
  // the active slide's height.
  //
  // Bundle 4.2.42 fix (after 4.2.41 didn't fully resolve it): the
  // height measurement is keyed off the SCROLL itself ending, not off
  // activeIndex changing. activeIndex updates the moment scrollLeft
  // crosses a slide's midpoint — which is mid-gesture, before
  // scroll-snap has settled. Now: a debounced scroll-end detector
  // (200ms after the last scroll event) measures and applies the
  // new height. Transition cut from 250ms → 100ms so the resulting
  // vertical motion reads as a quick "settle," not a "drag." Plus
  // overflow-y-hidden on the carousel as a safety net so the slide
  // content can't escape the container's box during the transition.
  const slideRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [activeHeight, setActiveHeight] = useState<number | undefined>();
  const activeIndexRef = useRef(0);

  // Bundle 4.2.43: slides are now narrower than the container (92% so
  // 8% of the next week peeks on the right — universal carousel
  // "swipe me" affordance). Container-width can no longer drive
  // scroll math; we use the actual slide width measured from the
  // first slide's DOM node so activeIndex stays accurate regardless
  // of total-week count.
  function getSlideWidth(): number {
    const container = containerRef.current;
    if (!container) return 0;
    const first = slideRefs.current.get(0);
    return first ? first.offsetWidth : container.clientWidth;
  }

  // rAF-based scroll listener — activeIndex follows scrollLeft smoothly.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!container) return;
        const slideWidth = getSlideWidth();
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

  // Keep a ref to the latest activeIndex so the scroll-end listener
  // (set up once on mount) always reads the current value.
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Measure on scroll-end — i.e. 200ms after the LAST scroll event
  // from the carousel. This is the single reliable signal that the
  // gesture + snap-snapping is fully done. Tying measurement to this
  // (instead of to activeIndex changes, which fire mid-gesture) is
  // what stops the carousel from feeling like it drags vertically.
  // Effect runs once; the activeIndexRef gives the listener fresh
  // values across renders.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollEndTimer: number | null = null;

    function measure() {
      const node = slideRefs.current.get(activeIndexRef.current);
      if (!node) return;
      setActiveHeight(node.scrollHeight);
    }

    function onScroll() {
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(measure, 200);
    }

    // Initial measure on mount (no scroll event has fired yet).
    const initialT = window.setTimeout(measure, 50);

    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      window.clearTimeout(initialT);
    };
  }, []);

  function jumpTo(index: number) {
    const container = containerRef.current;
    if (!container) return;
    const slideWidth = getSlideWidth();
    container.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  }

  // Look up the session for the modal when openSessionId is set.
  const openSession =
    openSessionId !== null
      ? weeks.flatMap((w) => w.sessions).find((s) => s.id === openSessionId) ?? null
      : null;

  if (weeks.length === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Weekly journey of the program"
    >
      {/* Inner WEEK card — contains the navigation (W-track) + content
          (swipable slides) as one unified journey container. */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid rgba(15, 34, 41, 0.06)",
          boxShadow:
            "0 1px 2px rgba(15, 34, 41, 0.03), 0 4px 14px rgba(15, 34, 41, 0.05)",
        }}
      >
        {/* Journey track + prev/next arrows — Bundle 4.2.44.
            The W-track alone wasn't reading as "swipeable" to
            testers. Flanking it with explicit prev/next buttons
            makes the navigation unambiguous on every device,
            without breaking slide alignment (which is what the
            4.2.43 peek attempt did). Arrows fade to disabled at
            the boundaries rather than disappearing, so the
            W-track stays horizontally stable. */}
        <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 pt-8 lg:pt-10 pb-6 lg:pb-7">
          <NavArrow
            direction="prev"
            disabled={activeIndex === 0}
            onClick={() => jumpTo(activeIndex - 1)}
          />
          <div className="flex-1 min-w-0">
            <JourneyTrack
              totalWeeks={weeks.length}
              activeIndex={activeIndex}
              onJump={jumpTo}
            />
          </div>
          <NavArrow
            direction="next"
            disabled={activeIndex === weeks.length - 1}
            onClick={() => jumpTo(activeIndex + 1)}
          />
        </div>

        {/* Subtle divider between navigation and content */}
        <div
          className="h-px mx-4 lg:mx-5"
          style={{ backgroundColor: "rgba(8, 145, 178, 0.18)" }}
          aria-hidden
        />

        {/* Swipable slides — Bundle 4.2.44: reverted the 4.2.43 slide
            peek (was w-[92%] + paddingRight: 8%). The peek shifted
            the centered content off-center within the outer white
            card, cramped card content at the narrower slide width,
            and produced cross-week alignment problems when headers
            wrapped to different line counts. Discoverability is now
            handled by the explicit prev/next arrows flanking the
            W-track above (see JourneyTrack changes), not by a peek.
            - Slides at w-full again — clean centering, no cramping
            - items-start: slides take their natural content height
            - overflow-y-hidden + dynamic height + 100ms transition
              for the post-settle height adjustment (4.2.42) */}
        <div
          ref={containerRef}
          className="flex items-start overflow-x-auto overflow-y-hidden journey-carousel"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            height: activeHeight ? `${activeHeight}px` : undefined,
            transition: "height 100ms ease",
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
              ref={(el) => { slideRefs.current.set(i, el); }}
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
              <WeekSlide
                week={week}
                onOpenDetail={(sessionId) => setOpenSessionId(sessionId)}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Week {activeIndex + 1} of {weeks.length}
      </p>

      {/* Session detail modal — only when a session is open. */}
      {openSession && (
        <SessionDetailModal
          session={openSession}
          onClose={() => setOpenSessionId(null)}
        />
      )}
    </div>
  );
}

/** A single week's slide — week header (umbrella) over stacked sessions.
 *
 *  Bundle 4.2.13: no separators between sessions. All sessions use the
 *  same uniform layout, regardless of whether the week has 1 or many.
 *  Sessions stack with tight margin between them. */
function WeekSlide({
  week,
  onOpenDetail,
}: {
  week: WeekData;
  onOpenDetail: (sessionId: string) => void;
}) {
  return (
    <div className="px-4 lg:px-5 py-5 lg:py-6">
      {/* Week header — chapter-heading format.
          Single editorial beat ("Week 2: Building Consistency").
          Dates dropped (the W-track dots convey position via
          highlight). Bundle 4.2.40 upgrades the typography to
          ALL CAPS so the heading carries proper editorial weight
          — matches the campaign-cover treatment the brand uses
          for display headlines elsewhere, and reads as a
          magazine section break rather than a quiet subtitle.
          Falls back to plain "WEEK N" when no theme is set. */}
      <div className="text-center mb-6 lg:mb-8">
        <h3
          className="font-black font-headline uppercase leading-[1.1]"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1.25rem, 4vw, 1.625rem)",
            letterSpacing: "-0.01em",
          }}
        >
          Week {week.weekNumber}
          {week.theme && week.theme.trim() ? `: ${week.theme.trim()}` : null}
        </h3>
      </div>

      {week.sessions.length > 0 ? (
        <div>
          {week.sessions.map((s, idx) => (
            <div
              key={s.id}
              className={idx > 0 ? "mt-3.5 lg:mt-4" : undefined}
            >
              <SessionFeature
                session={s}
                onOpenDetail={() => onOpenDetail(s.id)}
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
 * SessionFeature — Bundle 4.2.39 redesign: agenda-item card.
 *
 * The weekly variant's mental model is "your schedule this week,"
 * not "browse posters of sessions." This card reshapes the content
 * to match: WHEN leads, title second, person third. Whole card is
 * the click target → opens SessionDetailModal. Depth (description,
 * full date+time line, modal team block) lives in the modal.
 *
 * Layout:
 *   ┌───────────┬─────────────────────────────────┐
 *   │           │ MON 11 JAN          (cyan eyebrow)
 *   │  Image    │ 19:00 — 1h          (slate semibold)
 *   │  (3:4)    │ Full Body Strength  (font-black h4)
 *   │           │ [👤] Alex Mercer    (role-tinted name)
 *   └───────────┴─────────────────────────────────┘
 */
function SessionFeature({
  session,
  onOpenDetail,
}: {
  session: SessionLite;
  onOpenDetail: () => void;
}) {
  const people = sessionPeople(session);
  const dayLabel = formatSessionDay(session.start_time);
  const timeLabel = formatSessionTime(session.start_time);
  const durLabel = formatDuration(session.duration_minutes);
  const personSummary =
    people.length === 0
      ? "no host"
      : people.length === 1
        ? people[0].display_name ?? "Expert"
        : `${people.length} experts`;
  const ariaLabel = `${session.title}, ${dayLabel} at ${timeLabel}, ${durLabel}, ${personSummary}. Open details.`;

  return (
    // Bundle 4.2.39 redesign — agenda-item card.
    // Was: horizontal mini-billboard with title-first, then day,
    // then description preview, then See-details link. The card
    // worked as a campaign teaser but didn't match the weekly
    // navigation's mental model (your schedule for this week).
    // Now: whole card is the click target (matches flat 4.2.17
    // pattern). Content column LEADS with WHEN (day eyebrow + time
    // line), then title, then who. No description preview, no
    // explicit CTA — depth lives in the modal. Reads as "a session
    // on your calendar this week," not "a poster of a session."
    // Image is 3:4 portrait so it carries proper visual weight
    // against the typography hierarchy.
    <button
      type="button"
      onClick={onOpenDetail}
      aria-label={ariaLabel}
      // Bundle 4.2.40: stronger hover lift + hover-only chevron at
      // the right edge (see below). Static state stays clean and
      // card-like; hover gives a clear "tap me" affordance via a
      // bigger translate-y + deeper shadow + the chevron sliding in.
      // Touch devices don't see hover, but the card shape, image
      // dominance, and rounded chrome already read as tappable.
      className="weekly-session-card w-full flex items-stretch gap-0 rounded-2xl overflow-hidden text-left p-0 transition-all duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: "#FAF7F1",
        border: "1px solid rgba(15,34,41,0.05)",
        font: "inherit",
        color: "inherit",
        // @ts-expect-error CSS custom property for focus ring color
        "--tw-ring-color": "#FF6130",
      }}
    >
      <style>{`
        .weekly-session-card:hover {
          box-shadow:
            0 4px 8px rgba(15,34,41,0.06),
            0 16px 32px rgba(15,34,41,0.12);
        }
        .weekly-session-card .weekly-card-chevron {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .weekly-session-card:hover .weekly-card-chevron {
          opacity: 1;
          transform: translateX(0);
        }
        /* Bundle 4.2.43: touch devices don't fire hover events, so the
           hover-only chevron silently disappears for everyone on
           mobile. Force it visible on (hover: none) devices — touch
           gets a static chevron as the tap affordance; desktop keeps
           the elegant fade-in. */
        @media (hover: none) {
          .weekly-session-card .weekly-card-chevron {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Image — 3:4 portrait (Bundle 4.2.39, was 1:1 square).
          Taller image gives the card more visual presence and
          balances the typography hierarchy in the content column. */}
      <div
        className="shrink-0 w-28 lg:w-32 relative"
        style={{ aspectRatio: "3 / 4" }}
      >
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
              width={20}
              height={20}
              style={{ opacity: 0.35 }}
            />
          </div>
        )}
      </div>

      {/* Content — right column, agenda hierarchy.
          1. Day eyebrow (small caps, slate) — WHEN, scans first
          2. Time + duration (sentence case, semibold, larger) — practical detail
          3. Title (font-black, the centerpiece)
          4. Person (facepile + role-tinted name)
          No description preview, no See-details link. */}
      <div className="flex-1 min-w-0 flex flex-col py-4 px-4 lg:py-4 lg:px-5">
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
          style={{ color: "#0891b2" }}
          suppressHydrationWarning
        >
          {dayLabel}
        </p>
        <p
          className="text-[13px] lg:text-[14px] font-bold font-headline mt-1"
          style={{ color: "#475569", letterSpacing: "-0.005em" }}
          suppressHydrationWarning
        >
          {timeLabel}
          <span style={{ color: "#cbd5e1" }}>{"  —  "}</span>
          {durLabel}
        </p>
        <h4
          className="font-black font-headline tracking-tight mt-2"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1rem, 3.6vw, 1.125rem)",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
          }}
        >
          {session.title}
        </h4>
        {people.length > 0 && (
          <div className="flex items-center gap-2 mt-auto pt-3">
            <TeamFacepile people={people} size="sm" />
            <PeopleNames
              people={people}
              className="text-[12px] lg:text-[13px] font-black font-headline truncate"
            />
          </div>
        )}
      </div>

      {/* Bundle 4.2.40: hover-only chevron. Invisible at rest (so the
          static card doesn't read as a list item with a > drilldown
          indicator), fades + slides in on hover as a clear "tap me"
          affordance. Touch devices don't see hover and don't need
          this — the card's shape + image dominance carry the
          affordance there. */}
      <div
        className="weekly-card-chevron shrink-0 self-center pr-3 lg:pr-4"
        aria-hidden
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FF6130"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

/**
 * SessionDetailModal — Bundle 4.2.13.
 *
 * Fixed full-screen backdrop + centered white card containing the
 * session's full detail (large 16:9 image, title, metadata, full
 * description). Closes on:
 *   - Backdrop click
 *   - × button
 *   - Escape key
 *
 * Body scroll lock is set on mount and cleared on unmount.
 */
function SessionDetailModal({
  session,
  onClose,
}: {
  session: SessionLite;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${session.title} — session details`}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: "rgba(15, 34, 41, 0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl overflow-y-auto max-w-lg w-full max-h-[90vh] relative"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — top-right, floats over image */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 active:opacity-60"
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,34,41,0.10)",
            boxShadow: "0 2px 6px rgba(15,34,41,0.10)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F2229"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Image — 16:9 cinematic at top of modal */}
        {session.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.image_url}
            alt=""
            className="w-full block"
            style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
          />
        ) : (
          <div
            className="w-full"
            style={{
              aspectRatio: "16 / 9",
              background:
                "linear-gradient(135deg, rgba(156,240,255,0.40), rgba(255,97,48,0.20))",
            }}
          />
        )}

        {/* Content */}
        <div className="px-6 lg:px-8 pt-6 lg:pt-7 pb-7 lg:pb-8">
          <h3
            className="font-black font-headline tracking-tight"
            style={{
              color: "#0F2229",
              fontSize: "clamp(1.25rem, 4.5vw, 1.625rem)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            {session.title}
          </h3>
          <p
            className="text-[11px] lg:text-[12px] font-bold font-headline uppercase tracking-[0.15em] mt-3"
            style={{ color: "#475569" }}
            suppressHydrationWarning
          >
            {formatSessionDay(session.start_time)}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatSessionTime(session.start_time)}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatDuration(session.duration_minutes)}
          </p>

          {/* Bundle 4.2.37: team block. "Led by" / "Co-led by" label
              over the facepile + role-tinted names. Same pattern as
              the flat carousel's modal. */}
          {(() => {
            const people = sessionPeople(session);
            if (people.length === 0) return null;
            return (
              <div className="flex items-center gap-3 mt-5">
                <TeamFacepile people={people} size="md" />
                <div>
                  <p
                    className="text-[10px] font-bold font-headline uppercase tracking-[0.2em]"
                    style={{ color: "#94a3b8" }}
                  >
                    {people.length > 1 ? "Co-led by" : "Led by"}
                  </p>
                  <PeopleNames
                    people={people}
                    className="text-sm font-black font-headline mt-0.5 block"
                  />
                </div>
              </div>
            );
          })()}

          {session.description && session.description.trim() && (
            <p
              className="text-[15px] mt-5 leading-relaxed whitespace-pre-wrap"
              style={{ color: "#475569" }}
            >
              {session.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * NavArrow — Bundle 4.2.44. Previous/next week button flanking the
 * W-track. Small (32x32 / 36x36) rounded button with a chevron icon.
 * Visible at the boundaries too (just disabled + faded) so the
 * W-track stays horizontally stable regardless of activeIndex.
 */
function NavArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={direction === "prev" ? "Previous week" : "Next week"}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      className="shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: disabled ? "rgba(15,34,41,0.03)" : "rgba(8,145,178,0.10)",
        border: `1px solid ${disabled ? "rgba(15,34,41,0.06)" : "rgba(8,145,178,0.25)"}`,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={disabled ? "#94a3b8" : "#0891b2"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: direction === "prev" ? "rotate(180deg)" : undefined,
        }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

/**
 * JourneyTrack — stepped progress indicator. Active dot is ORANGE
 * (moves with swipe); other dots are cyan. Tapping a dot jumps to
 * that week.
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
            const dotColor = isActive ? "#FF6130" : "#9CF0FF";
            const glowColor = "rgba(255,97,48,0.28)";
            return (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                // Bundle 4.2.43: added hover:scale-110 so dots
                // visibly respond on desktop (signals "tap me" on
                // hover-capable devices). Touch devices don't see
                // hover and don't need this — the W-track tap area
                // is already 28x28px on touch and tapping triggers
                // the active:scale-90 feedback.
                className="relative flex items-center justify-center w-7 h-7 rounded-full transition-transform active:scale-90 hover:scale-110"
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

/* ── Team helpers (mirror of SessionsCarousel, Bundle 4.2.37) ──── */

/**
 * The session team in display order: host first, then any session
 * cohosts. De-duped by id so a person listed in both slots only
 * appears once. Same shape and behavior as SessionsCarousel.sessionPeople.
 */
function sessionPeople(session: SessionLite): HostLite[] {
  const out: HostLite[] = [];
  const seen = new Set<string>();
  if (session.host) {
    out.push(session.host);
    seen.add(session.host.id);
  }
  for (const c of session.cohosts) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

/**
 * Names rendered inline, each tinted by its own role (owner = orange,
 * cohost = cyan) so a co-led session matches solo-session coloring
 * instead of collapsing both names into one neutral color. Separator
 * is neutral grey: "Alex, Mira & Sam".
 */
function PeopleNames({
  people,
  className,
}: {
  people: HostLite[];
  className?: string;
}) {
  return (
    <span className={className}>
      {people.map((p, i) => (
        <Fragment key={p.id}>
          {i > 0 && (
            <span style={{ color: "#94a3b8" }}>
              {i === people.length - 1 ? " & " : ", "}
            </span>
          )}
          <span
            style={{ color: p.role === "owner" ? "#FF6130" : "#0891b2" }}
          >
            {p.display_name ?? "Expert"}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Single avatar or overlapping avatars for a co-led session.
 * `size`: "sm" = 24px (card chrome — the weekly card is compact;
 * the larger 36px of the flat-card facepile would dominate the
 * narrow content column); "md" = 32px (modal — bigger surface,
 * more room to breathe).
 */
function TeamFacepile({
  people,
  size,
}: {
  people: HostLite[];
  size: "sm" | "md";
}) {
  if (people.length === 1) return <Avatar host={people[0]} size={size} />;
  return (
    <div className="flex shrink-0">
      {people.map((p, i) => (
        <div
          key={p.id}
          style={{
            marginLeft: i === 0 ? 0 : size === "sm" ? "-7px" : "-9px",
            zIndex: people.length - i,
          }}
        >
          <Avatar host={p} size={size} />
        </div>
      ))}
    </div>
  );
}

function Avatar({ host, size }: { host: HostLite; size: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const fontSize = size === "sm" ? "text-[10px]" : "text-[12px]";
  if (host.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={host.avatar_url}
        alt={host.display_name ?? "Expert"}
        className={`${dim} rounded-full object-cover shrink-0`}
        style={{
          border: "1.5px solid #FFFFFF",
          boxShadow: "0 1px 3px rgba(15,34,41,0.12)",
        }}
      />
    );
  }
  const isOwner = host.role === "owner";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0`}
      style={{
        backgroundColor: isOwner
          ? "rgba(255,97,48,0.15)"
          : "rgba(8,145,178,0.15)",
        border: "1.5px solid #FFFFFF",
        boxShadow: "0 1px 3px rgba(15,34,41,0.08)",
      }}
    >
      <span
        className={`${fontSize} font-black font-headline`}
        style={{ color: isOwner ? "#FF6130" : "#0891b2" }}
      >
        {(host.display_name ?? "?")[0]?.toUpperCase()}
      </span>
    </div>
  );
}

/* ── Format helpers ─────────────────────────────────────────────── */

// Bundle 4.2.37: timezone pin — mirror of the same fix in
// SessionsCarousel (Bundle 4.2.35). Sessions are created and
// displayed in a single canonical wall-clock zone (the workspace
// interprets datetime inputs as Asia/Phnom_Penh). Times are
// stored UTC; we pin formatting to that same zone so the buyer
// page shows the intended local time deterministically on both
// server and client (otherwise the server-rendered UTC time gets
// frozen by suppressHydrationWarning).
const DISPLAY_TZ = "Asia/Phnom_Penh";

function formatSessionDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    timeZone: DISPLAY_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", {
    timeZone: DISPLAY_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
