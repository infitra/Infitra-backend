"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { CardWaves } from "@/app/components/BrandWaves";
import { FoundingExpertStar } from "@/app/components/FoundingBadge";
import { CardOverlay } from "./CardOverlay";
import { trackEvent } from "@/lib/analytics";

/**
 * The network, inside the hero (12 Sep 2026).
 *
 * The tile is signal; the card behind it is content. So the waves are not a
 * band here, they are the ground the whole card is printed on, the way a post
 * is mostly artwork: the portrait, the type pill and the name sit on them,
 * and a small cream end at the bottom carries the tagline and the way in.
 * Everything else, the city, the link, the two answers, the background,
 * belongs to the card itself, which opens on click. The founding mark rides
 * beside the name, where it costs no height.
 *
 * The band never ends. The set is laid out three times and the scroll
 * position is folded back by one set width whenever it crosses a boundary, so
 * the first card simply comes round again instead of the band snapping back.
 * It drifts by itself a frame at a time, which is also what makes the fold
 * invisible, and it is a real scroll container: drag, swipe, wheel and the
 * arrows all work, and any of them hands control back for a while.
 *
 * Below four profiles there is nothing to come round, so the band holds still
 * and centres instead.
 *
 * The cards arrive as ready-rendered nodes from the server, so the card
 * module and everything it imports never enter this bundle.
 */
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";
const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";
const FAINT_INK = "rgba(15,34,41,0.45)";

const GROUND_MASK = "linear-gradient(180deg, #000 0%, #000 84%, rgba(0,0,0,0) 100%)";
const FADE_BOTH = "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 6%, #000 94%, rgba(0,0,0,0) 100%)";

/** Pixels per second the band drifts when nobody is touching it. */
const DRIFT = 22;
/** How long the reader keeps control after touching the band. */
const HOLD_MS = 8000;
/** Below this the set cannot come round: there is nothing behind the edge. */
const LOOP_FROM = 4;

function ProfileTile({
  m,
  onOpen,
  innerRef,
  echo,
}: {
  m: FoundingMember;
  onOpen: () => void;
  innerRef?: (el: HTMLButtonElement | null) => void;
  echo?: boolean;
}) {
  const isStudio = m.entity_type === "studio";
  const accent = isStudio ? CYAN : ORANGE;
  const name = m.display_name ?? "Founding member";
  const initial = (name[0] ?? "?").toUpperCase();

  return (
    <button
      type="button"
      ref={innerRef}
      onClick={onOpen}
      aria-label={`Open ${name}'s profile`}
      aria-hidden={echo || undefined}
      tabIndex={echo ? -1 : undefined}
      className="group/tile relative shrink-0 w-[300px] sm:w-[340px] rounded-2xl overflow-hidden text-left flex flex-col shadow-[0_14px_40px_rgba(0,0,0,0.32)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)] hover:-translate-y-[2px] transition-[transform,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9CF0FF]"
      style={{ backgroundColor: CREAM, border: "1px solid rgba(15,34,41,0.07)" }}
    >
      {/* The waves are the ground, not a band: they carry the portrait, the
         type and the name, and fade out where the cream end begins. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[256px] pointer-events-none"
        style={{ maskImage: GROUND_MASK, WebkitMaskImage: GROUND_MASK }}
      >
        <CardWaves id={`tile-${m.id.slice(0, 8)}`} />
      </div>

      <div className="relative px-5 pt-[60px] flex flex-col items-center text-center">
        <span
          className="absolute top-4 left-5 text-[10px] font-bold font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
        >
          {isStudio ? "Studio" : "Expert"}
        </span>
        <div
          className="rounded-full w-[168px] h-[168px] sm:w-[190px] sm:h-[190px]"
          style={{ padding: 6, backgroundColor: "#FFFFFF", boxShadow: "0 18px 42px rgba(15,34,41,0.20)" }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 28%" }} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.12) 0%, rgba(8,145,178,0.14) 100%)" }}
              >
                <span className="text-6xl font-bold font-headline" style={{ color: CYAN }}>
                  {initial}
                </span>
              </div>
            )}
          </div>
        </div>

        <p
          className="mt-2.5 max-w-full text-[21px] font-bold font-headline leading-tight inline-flex items-center gap-2"
          style={{ color: INK, letterSpacing: "-0.03em" }}
        >
          <span className="truncate">{name}</span>
          {m.is_founding_expert && <FoundingExpertStar size={16} />}
        </p>
      </div>

      {/* The cream end: what they do, and the way in. */}
      <div className="relative mt-auto px-5 pt-2.5 pb-3.5 text-center">
        {m.tagline && (
          <p
            className="text-[13.5px] font-bold font-headline leading-[1.3]"
            style={{ color: CYAN, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
          >
            {m.tagline}
          </p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold font-headline uppercase tracking-[0.18em]" style={{ color: FAINT_INK }}>
          See details
          <svg
            className="transition-transform duration-200 group-hover/tile:translate-x-0.5"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous profiles" : "Next profiles"}
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center ${dir === "prev" ? "left-0" : "right-0"}`}
      style={{
        backgroundColor: "rgba(12,38,46,0.72)",
        border: "1px solid rgba(242,239,232,0.28)",
        color: CREAM,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dir === "prev" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </button>
  );
}

export function HeroCards({
  members,
  preview,
  more,
  cards,
}: {
  members: FoundingMember[];
  preview: boolean;
  more: boolean;
  cards: React.ReactNode[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);

  // Three copies, so a full set of runway sits on each side of what you see.
  const loop = members.length >= LOOP_FROM;
  const track = loop ? [...members, ...members, ...members] : members;

  /** The width of one set: the distance from the first tile to its echo. */
  const setWidth = useCallback(() => {
    const el = scroller.current;
    if (!el || !loop) return 0;
    const kids = el.children;
    const first = kids[0] as HTMLElement | undefined;
    const second = kids[members.length] as HTMLElement | undefined;
    if (!first || !second) return 0;
    return second.offsetLeft - first.offsetLeft;
  }, [loop, members.length]);

  /** Fold the scroll position back into the middle set. Invisible, because
   *  every set is identical. */
  const normalize = useCallback(() => {
    const el = scroller.current;
    if (!el || !loop) return;
    const w = setWidth();
    if (w <= 0) return;
    if (el.scrollLeft >= 2 * w) el.scrollLeft -= w;
    else if (el.scrollLeft <= 0) el.scrollLeft += w;
  }, [loop, setWidth]);

  // Start in the middle set, so the band can be pulled either way at once.
  // The fold also runs when a scroll finishes, so dragging to the far end
  // comes round instead of stopping, whether or not the drift is running.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !loop) return;
    const w = setWidth();
    if (w > 0) el.scrollLeft = w;
    el.addEventListener("scrollend", normalize);
    return () => el.removeEventListener("scrollend", normalize);
  }, [loop, setWidth, normalize]);

  // The drift: a frame at a time, which is what lets the fold pass unseen.
  useEffect(() => {
    if (!loop || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const el = scroller.current;
      if (el && Date.now() >= holdUntil.current) {
        el.scrollLeft += (DRIFT * dt) / 1000;
        normalize();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [loop, paused, normalize]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = scroller.current;
      if (!el) return;
      const first = el.firstElementChild as HTMLElement | null;
      const by = (first?.offsetWidth ?? 300) + 16;
      const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({ left: dir * by, behavior: calm ? "auto" : "smooth" });
      if (calm) normalize();
    },
    [normalize],
  );

  const hold = () => {
    holdUntil.current = Date.now() + HOLD_MS;
  };

  function openCard(i: number, id: string) {
    setOpen(i);
    trackEvent("Founding Card Opened", { id });
  }

  function close() {
    const i = open;
    setOpen(null);
    if (i !== null) requestAnimationFrame(() => tiles.current[i]?.focus());
  }

  const name = open !== null ? members[open]?.display_name ?? "Founding member" : "";

  return (
    <div>
      <div className="relative max-w-[1150px] mx-auto">
        <div
          ref={scroller}
          onPointerDown={hold}
          onTouchStart={hold}
          onWheel={hold}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className={`flex gap-4 px-6 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${loop ? "" : "justify-center"}`}
          style={loop ? { maskImage: FADE_BOTH, WebkitMaskImage: FADE_BOTH } : undefined}
        >
          {track.map((m, i) => (
            <ProfileTile
              key={`${m.id}-${i}`}
              m={m}
              echo={i >= members.length}
              onOpen={() => openCard(i % members.length, m.id)}
              innerRef={
                i < members.length
                  ? (el) => {
                      tiles.current[i] = el;
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {loop && (
          <>
            <Arrow
              dir="prev"
              onClick={() => {
                hold();
                step(-1);
              }}
            />
            <Arrow
              dir="next"
              onClick={() => {
                hold();
                step(1);
              }}
            />
          </>
        )}
      </div>

      {(more || preview) && (
        <div className="text-center mt-5">
          {more && (
            <Link
              href="/founding-network"
              className="inline-block text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
              style={{ color: CYAN_BRIGHT }}
            >
              All profiles
            </Link>
          )}
          {preview && (
            <p className="mt-2 text-[11px] font-bold font-headline uppercase tracking-[0.2em]" style={{ color: "rgba(156,240,255,0.7)" }}>
              Preview: what visitors see once the public reader opens.
            </p>
          )}
        </div>
      )}

      <CardOverlay open={open !== null} label={`${name}'s profile`} onClose={close}>
        {open !== null ? cards[open] : null}
      </CardOverlay>
    </div>
  );
}
