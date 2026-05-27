"use client";

/**
 * SessionsCarousel — Bundle 4.2.17.
 *
 * Flat horizontal carousel of all sessions in chronological order —
 * landing-page pattern. Each session is a vertical card with image on
 * top (full card width) and minimal content below. The weekly
 * structure is communicated by the "WEEK N · DAY" eyebrow on each
 * card; the program-rhythm spec block above the carousel carries the
 * "5 WEEKS" framing.
 *
 * Bundle 4.2.17 polish — strip-to-landing-page simplicity:
 *   - Cards reduced from 8 content elements to 5: image, eyebrow
 *     (WEEK N · DAY DD MON), title, time + duration, host (avatar +
 *     name). Description, "Led by" label, and "See details →" CTA
 *     are gone — they all live in SessionDetailModal now.
 *   - Whole card is the click target (a <button>). Removed the
 *     separate "See details →" link; hover gives a subtle lift +
 *     stronger shadow as the affordance.
 *   - Section header right label: static "M sessions" instead of
 *     the live "N of M" counter. Less motion noise; the WEEK
 *     eyebrow on each card already conveys position.
 *
 * Bundle 4.2.16 polish (kept):
 *   - Scrollbar-hide <style> sits OUTSIDE the scroll container so
 *     container.children is purely SessionCards (was breaking the
 *     activeIndex math — still used for the sr-only live region).
 *   - Carousel internal padding px-8 lg:px-12 indents first card
 *     past the cream region's content edge for visible breath.
 *
 * Bundle 4.2.15 polish (kept):
 *   - No inner white container. Section header + carousel sit
 *     directly on the parent cream region. White cards on cream.
 *
 * Revert path:
 *   - 4.2.17 (this): minimal card + click-to-detail
 *   - 4.2.16: full-metadata card + "See details" button
 *   - 4.2.15: drop inner container, invert cards to white
 *   - 4.2.14: flat carousel introduced (replaced WeeklyJourney)
 *   - 4.2.13: WeeklyJourneyCarousel (nested weeks navigation)
 * Each step is one `git revert <sha>` away.
 *
 * Cohort-space (post-purchase) will get its own weekly navigation
 * tuned for participant flow. The buyer page's job is conversion,
 * which is a different surface.
 */

import { useEffect, useRef, useState } from "react";

interface HostLite {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "owner" | "cohost";
}

export interface CarouselSession {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  start_time: string;
  duration_minutes: number;
  weekNumber: number;
  weekRange: string;
  host: HostLite | null;
}

interface Props {
  sessions: CarouselSession[];
}

export function SessionsCarousel({ sessions }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active index follows scrollLeft via rAF. Card-to-card distance is
  // measured from the actual rendered cards (offsetLeft difference)
  // so it picks up any gap/margin between them automatically.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!container) return;
        const cards = container.children;
        if (cards.length === 0) return;
        let cardWidth: number;
        if (cards.length >= 2) {
          cardWidth =
            (cards[1] as HTMLElement).offsetLeft -
            (cards[0] as HTMLElement).offsetLeft;
        } else {
          cardWidth = (cards[0] as HTMLElement).offsetWidth;
        }
        if (cardWidth === 0) return;
        const idx = Math.round(container.scrollLeft / cardWidth);
        setActiveIndex((prev) => (prev === idx ? prev : idx));
      });
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const openSession =
    openSessionId !== null
      ? sessions.find((s) => s.id === openSessionId) ?? null
      : null;

  if (sessions.length === 0) return null;

  return (
    <div role="region" aria-label="Program sessions">
      {/* Bundle 4.2.15: dropped the inner white card. Section header and
          carousel sit directly inside the parent cream region. Cards
          are now white-on-cream (inverted contrast) which lets each
          session card pop instead of sitting inside a triple-nested
          container. */}

      {/* Section header — eyebrow left, static session-count right.
          Bundle 4.2.17: replaced the live "N of M" counter with a
          static "M sessions" label. The ticking counter added motion
          noise that competed with the calm landing-page reference;
          the WEEK eyebrow on each card already gives positional
          context, so the right label can just declare the total. */}
      <div className="flex items-baseline justify-between pb-5 lg:pb-6">
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.22em]"
          style={{ color: "#FF6130" }}
        >
          Sessions
        </p>
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.22em]"
          style={{ color: "#94a3b8" }}
        >
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </p>
      </div>

      {/* Scrollbar-hide rule — kept OUTSIDE the scroll container.
          Bundle 4.2.16: was inside as the first child, which made it
          children[0] in the activeIndex calculation, producing a tiny
          (~24px) phantom cardWidth and a runaway pagination count
          ("19 of 7"). Moving it here makes container.children purely
          SessionCards. */}
      <style>{`
        .sessions-carousel::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Carousel — horizontal scroll, snap-mandatory.
          Bundle 4.2.22:
            - Dropped the -mx-6 lg:-mx-10 bleed. The carousel now
              sits inside the region's content area, aligned with
              the section header above it. The 4.2.20 attempt at
              "bleed wider than content" still read as flush
              against the hero card's outer edge because the
              hero card itself sits very close to the screen
              edge on mobile.
            - First card sits at (region-content-edge + px-3)
              ≈ hero-card-content-edge + 12px on mobile, properly
              inset from the hero card boundary.
            - pr-3 lg:pr-4 mirrors the left so the last card can
              scroll fully into view with symmetric breath. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-3 lg:gap-4 sessions-carousel px-3 lg:px-4"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {sessions.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            onOpenDetail={() => setOpenSessionId(s.id)}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Session {activeIndex + 1} of {sessions.length}: {sessions[activeIndex]?.title}
      </p>

      {openSession && (
        <SessionDetailModal
          session={openSession}
          onClose={() => setOpenSessionId(null)}
        />
      )}
    </div>
  );
}

/**
 * SessionCard — vertical card with image on top, condensed content
 * below. Whole card is the click target → opens SessionDetailModal.
 *
 * Bundle 4.2.17: stripped to landing-page-level simplicity.
 *   - Dropped the "LED BY" mini-label (redundant label noise).
 *   - Dropped the inline description preview (moved entirely to modal).
 *   - Dropped the "See details →" CTA (whole card is now the affordance).
 *   - Kept: image, eyebrow (WEEK N · DAY date), title, time + duration,
 *     avatar + name (role-color-coded).
 *
 * Anything stripped from the card still lives in SessionDetailModal —
 * the card is a glance-and-tap surface; the modal carries depth.
 *
 * Layout (top → bottom inside the card):
 *   - Image (4:3 aspect)
 *   - Eyebrow: WEEK N · DAY DD MON (cyan accent)
 *   - Title (font-black billboard)
 *   - Time · duration (sentence-case info line)
 *   - Avatar + name (role-color-coded, no label)
 */
function SessionCard({
  session,
  onOpenDetail,
}: {
  session: CarouselSession;
  onOpenDetail: () => void;
}) {
  const dayLabel = formatSessionDayShort(session.start_time);
  const timeLabel = formatSessionTime(session.start_time);
  const durLabel = formatDuration(session.duration_minutes);

  // Whole card is a <button>. Default button chrome (background,
  // border, font, alignment) is overridden so it renders as a card.
  // aria-label gives screen readers a single clear announcement
  // instead of having them read every child element individually.
  const ariaLabel = `${session.title}, week ${session.weekNumber}, ${dayLabel}. Open details.`;

  return (
    <button
      type="button"
      onClick={onOpenDetail}
      aria-label={ariaLabel}
      className="session-card w-[70%] sm:w-[48%] lg:w-[32%] shrink-0 rounded-2xl overflow-hidden flex flex-col text-left p-0 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        // Bundle 4.2.19: re-flipped. Region is white now; cards
        // are cream so they read as distinct chips on the hero
        // card surface.
        backgroundColor: "#FAF7F1",
        border: "1px solid rgba(15,34,41,0.06)",
        boxShadow:
          "0 1px 2px rgba(15,34,41,0.03), 0 4px 14px rgba(15,34,41,0.05)",
        scrollSnapAlign: "start",
        font: "inherit",
        color: "inherit",
        // @ts-expect-error CSS custom property for focus ring color
        "--tw-ring-color": "#FF6130",
      }}
    >
      <style>{`
        .session-card:hover {
          box-shadow: 0 2px 4px rgba(15,34,41,0.05), 0 10px 24px rgba(15,34,41,0.10);
        }
      `}</style>

      {/* Image — top, full card width, 4:3 */}
      <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
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
              width={28}
              height={28}
              style={{ opacity: 0.35 }}
            />
          </div>
        )}
      </div>

      {/* Content — four lines max. The card is a billboard, not a
          spec sheet. Everything else lives in the modal. */}
      <div className="p-5 lg:p-6 flex-1 flex flex-col">
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
          style={{ color: "#0891b2" }}
        >
          Week {session.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {dayLabel}
        </p>

        <h4
          className="font-black font-headline tracking-tight mt-2.5"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1.25rem, 4.2vw, 1.375rem)",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
          }}
        >
          {session.title}
        </h4>

        <p
          className="text-[14px] lg:text-[15px] font-bold font-headline mt-2.5"
          style={{ color: "#475569", letterSpacing: "-0.005em" }}
          suppressHydrationWarning
        >
          {timeLabel}
          <span style={{ color: "#cbd5e1" }}>{"  ·  "}</span>
          {durLabel}
        </p>

        {/* Host — avatar + name, no "LED BY" label. Role color
            (orange = owner, cyan = cohost) IS the signifier. */}
        {session.host && (
          <div className="flex items-center gap-3 mt-auto pt-5">
            <HostAvatar host={session.host} />
            <span
              className="text-[14px] lg:text-[15px] font-black font-headline truncate"
              style={{
                color:
                  session.host.role === "owner" ? "#FF6130" : "#0891b2",
              }}
            >
              {session.host.display_name ?? "Expert"}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

function HostAvatar({ host }: { host: HostLite }) {
  // Bundle 4.2.16: bumped 24px → 36px so the avatar actually
  // registers on the card. Matched the initial-letter fallback
  // to the new size so empty-avatar cards stay readable.
  if (host.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={host.avatar_url}
        alt={host.display_name ?? "Expert"}
        className="w-9 h-9 rounded-full object-cover shrink-0"
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
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{
        backgroundColor: isOwner
          ? "rgba(255,97,48,0.15)"
          : "rgba(8,145,178,0.15)",
        border: "1.5px solid #FFFFFF",
        boxShadow: "0 1px 3px rgba(15,34,41,0.08)",
      }}
    >
      <span
        className="text-[13px] font-black font-headline"
        style={{ color: isOwner ? "#FF6130" : "#0891b2" }}
      >
        {(host.display_name ?? "?")[0]?.toUpperCase()}
      </span>
    </div>
  );
}

/**
 * SessionDetailModal — Bundle 4.2.14 (carried from previous bundle,
 * enhanced with coach attribution). Opens on "See details" click,
 * closes on backdrop click / × / Escape, locks body scroll.
 */
function SessionDetailModal({
  session,
  onClose,
}: {
  session: CarouselSession;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${session.title} — session details`}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 34, 41, 0.65)" }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl overflow-y-auto max-w-lg w-full max-h-[90vh] relative"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="px-6 lg:px-8 pt-6 lg:pt-7 pb-7 lg:pb-8">
          <p
            className="text-[11px] font-bold font-headline uppercase tracking-[0.22em]"
            style={{ color: "#0891b2" }}
          >
            Week {session.weekNumber}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatSessionDayShort(session.start_time)}
          </p>
          <h3
            className="font-black font-headline tracking-tight mt-2"
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
            className="text-[12px] lg:text-[13px] font-bold font-headline uppercase tracking-[0.15em] mt-2"
            style={{ color: "#475569" }}
            suppressHydrationWarning
          >
            {formatSessionDayLong(session.start_time)}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatSessionTime(session.start_time)}
            <span style={{ color: "#cbd5e1" }}> · </span>
            {formatDuration(session.duration_minutes)}
          </p>

          {session.host && (
            <div className="flex items-center gap-3 mt-5">
              <HostAvatar host={session.host} />
              <div>
                <p
                  className="text-[10px] font-bold font-headline uppercase tracking-[0.2em]"
                  style={{ color: "#94a3b8" }}
                >
                  Led by
                </p>
                <p
                  className="text-sm font-black font-headline mt-0.5"
                  style={{
                    color:
                      session.host.role === "owner" ? "#FF6130" : "#0891b2",
                  }}
                >
                  {session.host.display_name ?? "Expert"}
                </p>
              </div>
            </div>
          )}

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

/* ── Format helpers ─────────────────────────────────────────────── */

function formatSessionDayShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSessionDayLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
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
