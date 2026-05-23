"use client";

/**
 * SessionsCarousel — Bundle 4.2.16.
 *
 * Flat horizontal carousel of all sessions in chronological order —
 * landing-page pattern. Each session is a vertical card with image on
 * top (full card width) and content below. The weekly structure is
 * communicated by the "WEEK N · DAY" eyebrow on each card; the
 * program-rhythm spec block above the carousel carries the "5 WEEKS"
 * framing.
 *
 * Bundle 4.2.16 polish (on top of 4.2.15's drop-inner-container):
 *   - FIX: pagination count was reading children[0] / children[1] of
 *     the scroll container to derive cardWidth, but the scrollbar-hide
 *     <style> tag was children[0], producing a ~24px phantom width and
 *     a runaway count ("19 of 7"). Moved <style> outside the scroll
 *     container so children is purely SessionCards.
 *   - Bumped carousel internal padding (px-6 → px-8 mobile, px-10 →
 *     px-12 lg) so the first card has visible breath from the hero
 *     card's edge instead of sitting flush against it.
 *   - Scaled up card hierarchy now that cards have more horizontal
 *     room: title 16–18 → 20–22px, time line de-capped to 14–15px
 *     sentence-case (no longer competes with WEEK eyebrow), avatar
 *     24 → 36px with a "Led by" mini-label, host/description both
 *     14–15px, card padding p-4/5 → p-5/6, inter-block spacing
 *     opened up.
 *
 * Bundle 4.2.15 polish (kept):
 *   - Dropped the inner white container that wrapped the section
 *     header + carousel. Header and carousel sit directly inside the
 *     parent cream region — one fewer nested surface.
 *   - Inverted card color from cream (#FAF7F1) to white (#FFFFFF) so
 *     each card pops against the cream region.
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
          Card width is ~82% on mobile so the next card peeks on the
          right edge (swipe affordance); wider screens show more cards.
          Negative-margin bleeds the scroll track out to the cream
          region's outer edges; the slightly-deeper internal padding
          (px-8 vs cream's px-6) indents the first card a few px past
          the section header so it has visible breath from the hero
          card's edge. */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto gap-3 lg:gap-4 sessions-carousel -mx-6 lg:-mx-10 px-8 lg:px-12"
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

      {/* Content — Bundle 4.2.16: scaled-up hierarchy.
          The card was originally sized for a narrower inside-the-
          white-container context; now that it sits on cream with
          more horizontal room, every line goes bigger so the card
          reads as a billboard, not a metadata strip. */}
      <div className="p-5 lg:p-6 flex-1 flex flex-col">
        <p
          className="text-[10px] lg:text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
          style={{ color: "#0891b2" }}
        >
          Week {session.weekNumber}
          <span style={{ color: "#cbd5e1" }}> · </span>
          {dayLabel}
        </p>

        {/* Title — the card's billboard. Clamp 1.25–1.375rem so it
            scales smoothly on the in-between widths. */}
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

        {/* Time + duration — demoted from tiny-uppercase-tracked
            (which competed with the WEEK eyebrow) to a calmer
            sentence-case font-bold info line. Reads as data, not
            a second label. */}
        <p
          className="text-[14px] lg:text-[15px] font-bold font-headline mt-2.5"
          style={{ color: "#475569", letterSpacing: "-0.005em" }}
          suppressHydrationWarning
        >
          {timeLabel}
          <span style={{ color: "#cbd5e1" }}>{"  ·  "}</span>
          {durLabel}
        </p>

        {/* Coach attribution — bigger avatar (was 24px, now 36px)
            with a "Led by" mini-label so the role of the person is
            unambiguous, and the name itself reads at proper body
            weight rather than as a tiny tag. */}
        {session.host && (
          <div className="flex items-center gap-3 mt-5">
            <HostAvatar host={session.host} />
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold font-headline uppercase tracking-[0.2em]"
                style={{ color: "#94a3b8" }}
              >
                Led by
              </p>
              <p
                className="text-[14px] lg:text-[15px] font-black font-headline mt-0.5 truncate"
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

        {/* Description preview — bumped to 14-15px with relaxed
            leading for actual readability. line-clamp-2 still
            caps it at two lines. */}
        {session.description && session.description.trim() && (
          <p
            className="text-[14px] lg:text-[15px] mt-5 leading-relaxed line-clamp-2"
            style={{ color: "#64748b" }}
          >
            {session.description}
          </p>
        )}

        {/* See details — pushed to bottom of card */}
        <button
          type="button"
          onClick={onOpenDetail}
          className="mt-auto pt-5 text-left text-[13px] lg:text-[14px] font-bold font-headline transition-opacity hover:opacity-70 active:opacity-50 self-start"
          style={{ color: "#FF6130" }}
        >
          See details →
        </button>
      </div>
    </article>
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
