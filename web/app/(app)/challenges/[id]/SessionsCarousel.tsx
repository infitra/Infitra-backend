"use client";

/**
 * SessionsCarousel — Bundle 4.2.15.
 *
 * Flat horizontal carousel of all sessions in chronological order —
 * landing-page pattern. Each session is a vertical card with image on
 * top (full card width) and content below. The weekly structure is
 * communicated by the "WEEK N · DAY" eyebrow on each card; the
 * program-rhythm spec block above the carousel carries the "5 WEEKS"
 * framing.
 *
 * Bundle 4.2.15 polish:
 *   - Dropped the inner white container that wrapped the section
 *     header + carousel. Header and carousel sit directly inside the
 *     parent cream region — one fewer nested surface.
 *   - Inverted card color from cream (#FAF7F1) to white (#FFFFFF) so
 *     each card pops against the cream region instead of disappearing
 *     into a cream-on-cream-inside-white sandwich.
 *   - Carousel scroll track now bleeds with -mx-6 lg:-mx-10 + matching
 *     px-6 lg:px-10 padding so cards align with the cream region's
 *     content edge on the left and can scroll fully into view on the
 *     right without butting against the cream region's padding.
 *
 * Why this carousel and not a weekly one (revert path: see 4.2.13):
 *   - Nested navigation (swipe weeks → scan sessions) was wrong for the
 *     buyer page's conversion job. Buyers don't navigate at decision
 *     time — they need to UNDERSTAND, not explore.
 *   - Vertical cards give each session full card width for title,
 *     metadata, coach attribution, and description. Same shape every
 *     card. Reads instantly.
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

      {/* Section header — eyebrow left, pagination indicator right. */}
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
          {activeIndex + 1} of {sessions.length}
        </p>
      </div>

      {/* Carousel — horizontal scroll, snap-mandatory.
          Card width is ~85% on mobile so the next card peeks on the
          right edge (swipe affordance); wider screens show more cards.
          Negative-margin + matching padding bleeds the scroll track to
          the cream region's edges, so cards line up with the section
          header on the left and the last card can scroll fully into
          view without butting against the cream region's right padding. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-3 lg:gap-4 sessions-carousel -mx-6 lg:-mx-10 px-6 lg:px-10"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .sessions-carousel::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
 * SessionCard — vertical card with image on top, content below.
 * Landing-page pattern. Image takes the full card width with 4:3
 * aspect ratio; content fills the rest with consistent padding.
 *
 * Layout (top → bottom inside the card):
 *   - Image (4:3 aspect)
 *   - Eyebrow: WEEK N · DAY (cyan accent)
 *   - Title (font-black)
 *   - Meta: time · duration
 *   - Coach: avatar + name (role-color-coded)
 *   - Description preview (line-clamp-2)
 *   - See details → (bottom, mt-auto)
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

  return (
    <article
      className="w-[82%] sm:w-[55%] lg:w-[40%] shrink-0 rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(15,34,41,0.06)",
        boxShadow:
          "0 1px 2px rgba(15,34,41,0.03), 0 4px 14px rgba(15,34,41,0.05)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Image — top, full card width, 4:3 */}
      <div className="relative" style={{ aspectRatio: "4 / 3" }}>
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

      {/* Content */}
      <div className="p-4 lg:p-5 flex-1 flex flex-col">
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
          style={{ color: "#0891b2" }}
        >
          Week {session.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {dayLabel}
        </p>
        <h4
          className="font-black font-headline tracking-tight mt-2"
          style={{
            color: "#0F2229",
            fontSize: "clamp(1rem, 3.5vw, 1.125rem)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          {session.title}
        </h4>
        <p
          className="text-[11px] lg:text-[12px] font-bold font-headline uppercase tracking-[0.15em] mt-1.5"
          style={{ color: "#475569" }}
          suppressHydrationWarning
        >
          {timeLabel}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {durLabel}
        </p>

        {/* Coach attribution */}
        {session.host && (
          <div className="flex items-center gap-2 mt-3.5">
            <HostAvatar host={session.host} />
            <span
              className="text-[12px] lg:text-[13px] font-bold font-headline"
              style={{
                color:
                  session.host.role === "owner" ? "#FF6130" : "#0891b2",
              }}
            >
              {session.host.display_name ?? "Expert"}
            </span>
          </div>
        )}

        {/* Description preview */}
        {session.description && session.description.trim() && (
          <p
            className="text-[12px] lg:text-[13px] mt-3 leading-snug line-clamp-2"
            style={{ color: "#64748b" }}
          >
            {session.description}
          </p>
        )}

        {/* See details — pushed to bottom of card */}
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-auto pt-3.5 text-left text-[11px] lg:text-[12px] font-bold font-headline transition-opacity hover:opacity-70 active:opacity-50 self-start"
          style={{ color: "#FF6130" }}
        >
          See details →
        </button>
      </div>
    </article>
  );
}

function HostAvatar({ host }: { host: HostLite }) {
  if (host.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={host.avatar_url}
        alt={host.display_name ?? "Expert"}
        className="w-6 h-6 rounded-full object-cover"
        style={{
          border: "1.5px solid #FFFFFF",
          boxShadow: "0 1px 2px rgba(15,34,41,0.10)",
        }}
      />
    );
  }
  const isOwner = host.role === "owner";
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: isOwner
          ? "rgba(255,97,48,0.15)"
          : "rgba(8,145,178,0.15)",
        border: "1.5px solid #FFFFFF",
      }}
    >
      <span
        className="text-[10px] font-black font-headline"
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
