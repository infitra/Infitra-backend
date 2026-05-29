"use client";

/**
 * WeeklyJourneyCarousel — Bundle 4.2.13.
 *
 * Lives INSIDE the product card (PublicChallengeHero). Contains the
 * whole "journey" beat: a W1-W5 navigation track + swipable week
 * content. Cyan dots represent live peaks; the rest of the always-on
 * layer is described by the spec block above the carousel (the
 * "Always on — Tribe Space + Expert Access" pill).
 *
 * 4.2.13 changes from 4.2.12:
 *
 *  - Spine breathing room: more pt/pb around the W-track inside the
 *    inner white card.
 *
 *  - SessionSeparator dropped entirely. The previous numbered separator
 *    ("1 · Sat 13 Jun") between sessions was extra UI noise. All
 *    sessions now use the same layout regardless of whether the week
 *    has one or many — including the same two-line metadata format
 *    (day on top, time/duration below) — so the visual rhythm stays
 *    consistent. Sessions stack with a tighter vertical gap.
 *
 *  - Session card layout: SQUARE image (1:1 aspect, fixed size). With
 *    items-center, the image always dominates row height — every
 *    session ends up the same size regardless of content. The 16:9
 *    cinematic version is preserved for the modal (See details).
 *
 *  - Description kept inline with line-clamp-2 + ellipsis, plus a
 *    small orange "See details →" action. Tapping the button opens a
 *    modal with the full session detail (large image + full
 *    description) on the same page.
 *
 * Other carryovers from 4.2.12: rAF-based scroll listener for smooth
 * indicator tracking; active dot = orange (moves with swipe); no
 * umbrella rail; W-track INSIDE the white inner card.
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

  // rAF-based scroll listener — activeIndex follows scrollLeft smoothly.
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
        {/* Journey track — Bundle 4.2.13: more breath above + below. */}
        <div className="px-4 lg:px-5 pt-8 lg:pt-10 pb-6 lg:pb-7">
          <JourneyTrack
            totalWeeks={weeks.length}
            activeIndex={activeIndex}
            onJump={jumpTo}
          />
        </div>

        {/* Subtle divider between navigation and content */}
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
      {/* Week header — date+range as the big uppercase title, theme
          as subtitle below. */}
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
 * SessionFeature — Bundle 4.2.13 uniform layout.
 *
 *  - Square image (1:1) at fixed size, flush to card edges (left
 *    column items-center → image dominates row height).
 *  - Title (font-black)
 *  - Two-line metadata: day on top, time + duration below — consistent
 *    across all sessions in all weeks.
 *  - Inline description with line-clamp-2 + ellipsis — kept so the
 *    buyer gets a preview without tapping.
 *  - Small orange "See details →" action — opens the modal with the
 *    full session detail.
 */
function SessionFeature({
  session,
  onOpenDetail,
}: {
  session: SessionLite;
  onOpenDetail: () => void;
}) {
  return (
    <article
      className="flex items-center gap-3.5 lg:gap-5 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#FAF7F1",
        border: "1px solid rgba(15,34,41,0.05)",
      }}
    >
      {/* Image — square 1:1, flush to card edges. */}
      <div
        className="shrink-0 w-32 lg:w-36 relative self-stretch"
        style={{ aspectRatio: "1 / 1" }}
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
              width={18}
              height={18}
              style={{ opacity: 0.35 }}
            />
          </div>
        )}
      </div>

      {/* Content — right column. Padded on right + top + bottom. */}
      <div className="flex-1 min-w-0 text-left py-3 lg:py-3.5 pr-3.5 lg:pr-4">
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
        {/* Metadata — Bundle 4.2.13: two-line layout always.
            Day on top, time + duration below. Keeps the metadata
            shape consistent across all sessions and avoids ugly
            mid-string wraps on tight viewports. */}
        <p
          className="text-[11px] lg:text-[12px] font-bold font-headline uppercase tracking-[0.15em] mt-2 leading-snug"
          style={{ color: "#475569" }}
          suppressHydrationWarning
        >
          <span className="block">
            {formatSessionDay(session.start_time)}
          </span>
          <span className="block">
            {formatSessionTime(session.start_time)}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatDuration(session.duration_minutes)}
          </span>
        </p>
        {session.description && session.description.trim() && (
          <p
            className="text-[12px] lg:text-[13px] mt-2 leading-snug line-clamp-2"
            style={{ color: "#64748b" }}
          >
            {session.description}
          </p>
        )}
        {/* Bundle 4.2.37: team facepile + names. Mirrors the flat
            carousel so co-led sessions read as co-led at a glance
            (small overlapping avatars + "Alex & Mira" with the
            role-tinted name colors). */}
        {(() => {
          const people = sessionPeople(session);
          if (people.length === 0) return null;
          return (
            <div className="flex items-center gap-2 mt-2.5">
              <TeamFacepile people={people} size="sm" />
              <PeopleNames
                people={people}
                className="text-[12px] lg:text-[13px] font-black font-headline truncate"
              />
            </div>
          );
        })()}
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-2 text-[11px] lg:text-[12px] font-bold font-headline transition-opacity hover:opacity-70 active:opacity-50"
          style={{ color: "#FF6130" }}
        >
          See details →
        </button>
      </div>
    </article>
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
