"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { CardOverlay } from "./CardOverlay";
import { trackEvent } from "@/lib/analytics";

/**
 * The network, inside the hero, as a band that keeps moving (12 Sep 2026).
 *
 * A column of cards beside the copy read as a sidebar. This runs the full
 * width of the stage instead and drifts from right to left without stopping,
 * fading into the teal at both edges, so the network reads as something in
 * motion rather than a list. It pauses under the pointer and under keyboard
 * focus, and it stands still for anyone who asks for reduced motion.
 *
 * The drift only runs once there are enough profiles to fill the band. Below
 * that the tiles simply sit in the middle: a loop of one repeated face would
 * claim a network that is not there yet.
 *
 * The full card is the wrong object at this size, so the tile keeps only what
 * makes a person recognisable and the card itself opens on click. The cards
 * arrive as ready-rendered nodes from the server, so the card module and
 * everything it imports never enter this bundle.
 */
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

const EDGE_MASK = "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 7%, #000 93%, rgba(0,0,0,0) 100%)";

/** One tile is about this wide with its gap; the track is filled to cover
 *  the band before it is doubled for the loop. The band is held to roughly
 *  three cards: a wider one reads as a carousel of many things rather than
 *  as the people who joined. */
const TILE_SPAN = 350;
const FILL_TO = 1200;
const SECONDS_PER_TILE = 13;

const DRIFT_CSS = `
@keyframes stage-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
.stage-track { animation: stage-drift var(--drift) linear infinite; will-change: transform; }
.stage-stripe:hover .stage-track,
.stage-stripe:focus-within .stage-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .stage-track { animation: none; } }
`;

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
      className="relative shrink-0 w-[280px] sm:w-[330px] rounded-2xl overflow-hidden text-left shadow-[0_14px_40px_rgba(0,0,0,0.32)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)] hover:-translate-y-[2px] transition-[transform,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9CF0FF]"
      style={{ backgroundColor: CREAM, border: "1px solid rgba(15,34,41,0.07)" }}
    >
      {/* The face, at the size a face deserves: this is a person who joined,
          not a row in a directory. The name sits on the photo, magazine
          style, which also keeps the card short enough for the stage. */}
      <div className="relative w-full" style={{ aspectRatio: "4 / 3" }}>
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "50% 22%" }} />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.14) 0%, rgba(8,145,178,0.16) 100%)" }}
          >
            <span className="text-5xl font-bold font-headline" style={{ color: CYAN }}>
              {initial}
            </span>
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(12,38,46,0.78) 0%, rgba(12,38,46,0) 100%)" }}
        />
        <span
          className="absolute top-3 left-3 text-[9.5px] font-bold font-headline uppercase tracking-[0.14em] px-2 py-[3px] rounded-full text-white"
          style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
        >
          {isStudio ? "Studio" : "Expert"}
        </span>
        <p
          className="absolute left-4 right-4 bottom-3 truncate text-[19px] font-bold font-headline leading-tight"
          style={{ color: "#FFFFFF", letterSpacing: "-0.03em", textShadow: "0 2px 12px rgba(12,38,46,0.5)" }}
        >
          {name}
        </p>
      </div>

      <div className="px-4 py-3">
        {m.tagline && (
          <p
            className="text-[13px] font-bold font-headline leading-snug"
            style={{ color: CYAN, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
          >
            {m.tagline}
          </p>
        )}
        {m.facts?.city && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[12px]" style={{ color: "#64748b" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 21s-6-5.3-6-10.5a6 6 0 0 1 12 0C18 15.7 12 21 12 21z" />
              <circle cx="12" cy="10.5" r="2.3" />
            </svg>
            {m.facts.city}
          </span>
        )}
      </div>
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
  const tiles = useRef<Array<HTMLButtonElement | null>>([]);

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

  const drift = members.length >= 3;
  const copies = drift ? Math.max(1, Math.ceil(FILL_TO / (members.length * TILE_SPAN))) : 1;
  const base = Array.from({ length: members.length * copies }, (_, i) => i % members.length);
  const track = drift ? [...base, ...base] : base;
  const seconds = base.length * SECONDS_PER_TILE;

  return (
    <div>
      <div
        className="stage-stripe relative overflow-hidden max-w-[1120px] mx-auto"
        style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
      >
        <style>{DRIFT_CSS}</style>
        <div
          className={`flex gap-4 ${drift ? "stage-track w-max" : "justify-center px-6 flex-wrap"}`}
          style={drift ? ({ "--drift": `${seconds}s` } as React.CSSProperties) : undefined}
        >
          {track.map((memberIndex, i) => (
            <ProfileTile
              key={i}
              m={members[memberIndex]}
              echo={i >= members.length}
              onOpen={() => openCard(memberIndex, members[memberIndex].id)}
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
