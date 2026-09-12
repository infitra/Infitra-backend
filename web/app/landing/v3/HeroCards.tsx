"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { CardWaves } from "@/app/components/BrandWaves";
import { FoundingExpertBadge } from "@/app/components/FoundingBadge";
import { CardOverlay } from "./CardOverlay";
import { trackEvent } from "@/lib/analytics";

/**
 * The network, inside the hero (12 Sep 2026).
 *
 * The tile is the founding card, compressed: the same cream paper, the same
 * brand waves as the band, the same round portrait on its white ring, the
 * same type pill and founding mark. Editorial comes from proportion, not from
 * throwing parts away: the portrait takes a third of the card's width, which
 * is proportionally larger than on the full card, and the name sits under it
 * at headline size. The answers and the background stay in the full card,
 * which opens on click.
 *
 * The band is a real scroll container, so it can be dragged, swiped, wheeled
 * and stepped with the arrows. It also advances on its own, and any touch of
 * it hands control back for a while. When the profiles fit in the band it
 * simply holds still: there is nothing behind the edge to reach.
 *
 * The cards arrive as ready-rendered nodes from the server, so the card
 * module and everything it imports never enter this bundle.
 */
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";
const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

const BAND_MASK = "linear-gradient(180deg, #000 0%, #000 52%, rgba(0,0,0,0) 100%)";
const FADE_BOTH = "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 6%, #000 94%, rgba(0,0,0,0) 100%)";
const FADE_END = "linear-gradient(90deg, #000 0%, #000 94%, rgba(0,0,0,0) 100%)";
const FADE_START = "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 6%, #000 100%)";

const STEP_MS = 5500;
const HOLD_MS = 8000;

function ProfileTile({
  m,
  onOpen,
  innerRef,
}: {
  m: FoundingMember;
  onOpen: () => void;
  innerRef: (el: HTMLButtonElement | null) => void;
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
      className="relative snap-start shrink-0 w-[280px] sm:w-[330px] rounded-2xl overflow-hidden text-left shadow-[0_14px_40px_rgba(0,0,0,0.32)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)] hover:-translate-y-[2px] transition-[transform,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9CF0FF]"
      style={{ backgroundColor: CREAM, border: "1px solid rgba(15,34,41,0.07)" }}
    >
      <div
        aria-hidden
        className="relative h-[118px] overflow-hidden"
        style={{ maskImage: BAND_MASK, WebkitMaskImage: BAND_MASK }}
      >
        <CardWaves id={`tile-${m.id.slice(0, 8)}`} />
      </div>
      <span
        className="absolute top-4 left-5 z-10 text-[10px] font-bold font-headline uppercase tracking-[0.16em] px-2.5 py-1 rounded-full text-white"
        style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
      >
        {isStudio ? "Studio" : "Expert"}
      </span>

      <div className="px-5 pb-5 -mt-14 relative">
        <div
          className="rounded-full w-[104px] h-[104px] sm:w-[112px] sm:h-[112px]"
          style={{ padding: 5, backgroundColor: "#FFFFFF", boxShadow: "0 14px 34px rgba(15,34,41,0.16)" }}
        >
          <div className="w-full h-full rounded-full overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
            {m.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.avatar_url} alt="" className="w-full h-full object-cover" style={{ objectPosition: "50% 30%" }} />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.12) 0%, rgba(8,145,178,0.14) 100%)" }}
              >
                <span className="text-4xl font-bold font-headline" style={{ color: CYAN }}>
                  {initial}
                </span>
              </div>
            )}
          </div>
        </div>

        <p
          className="mt-3.5 truncate text-[21px] font-bold font-headline leading-tight"
          style={{ color: INK, letterSpacing: "-0.03em" }}
        >
          {name}
        </p>
        {m.tagline && (
          <p
            className="mt-1.5 text-[13px] font-bold font-headline leading-snug"
            style={{ color: CYAN, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
          >
            {m.tagline}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          {m.facts?.city && (
            <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "#64748b" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 21s-6-5.3-6-10.5a6 6 0 0 1 12 0C18 15.7 12 21 12 21z" />
                <circle cx="12" cy="10.5" r="2.3" />
              </svg>
              {m.facts.city}
            </span>
          )}
          {m.is_founding_expert && <FoundingExpertBadge />}
        </div>
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
      className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center transition-colors ${dir === "prev" ? "left-0" : "right-0"}`}
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
  const [canScroll, setCanScroll] = useState(false);
  const [paused, setPaused] = useState(false);
  const [edge, setEdge] = useState<"start" | "middle" | "end">("start");
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const holdUntil = useRef(0);

  // Does anything sit behind the edge? Only then does the band move, and only
  // then do the arrows mean anything.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [members.length]);

  const step = useCallback((dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const by = (first?.offsetWidth ?? 300) + 16;
    const max = el.scrollWidth - el.clientWidth;
    let next = el.scrollLeft + dir * by;
    if (next > max - 4) next = 0;
    if (next < 0) next = max;
    const calm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next, behavior: calm ? "auto" : "smooth" });
  }, []);

  // It advances on its own, and hands control straight back the moment the
  // reader touches it.
  useEffect(() => {
    if (!canScroll || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (Date.now() < holdUntil.current) return;
      step(1);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [canScroll, paused, step]);

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
      <div className="relative max-w-[1110px] mx-auto">
        <div
          ref={scroller}
          onPointerDown={hold}
          onTouchStart={hold}
          onWheel={hold}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollWidth - el.clientWidth;
            setEdge(el.scrollLeft <= 4 ? "start" : el.scrollLeft >= max - 4 ? "end" : "middle");
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className={`flex gap-4 px-6 py-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${canScroll ? "" : "justify-center"}`}
          style={{
            scrollPaddingLeft: 24,
            scrollPaddingRight: 24,
            // Only the side that still has profiles behind it is faded, so a
            // band at rest shows its first card whole.
            ...(canScroll
              ? (() => {
                  const fade = edge === "start" ? FADE_END : edge === "end" ? FADE_START : FADE_BOTH;
                  return { maskImage: fade, WebkitMaskImage: fade };
                })()
              : {}),
          }}
        >
          {members.map((m, i) => (
            <ProfileTile
              key={m.id}
              m={m}
              onOpen={() => openCard(i, m.id)}
              innerRef={(el) => {
                tiles.current[i] = el;
              }}
            />
          ))}
        </div>

        {canScroll && (
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
