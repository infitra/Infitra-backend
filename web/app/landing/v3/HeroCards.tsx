"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { CardWaves } from "@/app/components/BrandWaves";
import { CardOverlay } from "./CardOverlay";
import { trackEvent } from "@/lib/analytics";

/**
 * The network, inside the hero. The full card is the wrong object here: it
 * carries both answers, the background table and a 116px portrait, which at
 * hero size reads as a directory entry. So the tile keeps only what makes a
 * person recognisable (the wave band, the portrait, the name, what they do,
 * where they are) and the full card opens on click.
 *
 * The cards arrive as ready-rendered nodes from the server so the card
 * module, and everything it imports, never enters this bundle.
 */
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";
const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

const BAND_MASK = "linear-gradient(180deg, #000 0%, #000 55%, rgba(0,0,0,0) 100%)";

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
      className="relative shrink-0 snap-start w-[76vw] max-w-[300px] lg:w-full lg:max-w-none rounded-2xl overflow-hidden text-left shadow-[0_14px_40px_rgba(0,0,0,0.32)] hover:shadow-[0_22px_60px_rgba(0,0,0,0.42)] hover:-translate-y-[2px] transition-[transform,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#9CF0FF]"
      style={{ backgroundColor: CREAM, border: "1px solid rgba(15,34,41,0.07)" }}
    >
      <div
        aria-hidden
        className="relative h-16 overflow-hidden"
        style={{ maskImage: BAND_MASK, WebkitMaskImage: BAND_MASK }}
      >
        <CardWaves id={`tile-${m.id.slice(0, 8)}`} />
      </div>
      <span
        className="absolute top-3 left-3 z-10 text-[9.5px] font-bold font-headline uppercase tracking-[0.14em] px-2 py-[3px] rounded-full text-white"
        style={{ backgroundColor: accent, boxShadow: `0 4px 12px ${accent}55` }}
      >
        {isStudio ? "Studio" : "Expert"}
      </span>

      <div className="px-4 pb-4 -mt-7 relative">
        <div className="flex items-end gap-3">
          <div
            className="rounded-full shrink-0 w-14 h-14"
            style={{ padding: 3, backgroundColor: "#FFFFFF", boxShadow: "0 8px 20px rgba(15,34,41,0.18)" }}
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
                  <span className="text-lg font-bold font-headline" style={{ color: CYAN }}>
                    {initial}
                  </span>
                </div>
              )}
            </div>
          </div>
          <p
            className="min-w-0 flex-1 truncate text-[16px] font-bold font-headline leading-tight pb-1"
            style={{ color: INK, letterSpacing: "-0.03em" }}
          >
            {name}
          </p>
        </div>

        {m.tagline && (
          <p
            className="mt-2.5 text-[13px] font-bold font-headline leading-snug"
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

  return (
    <div>
      <p className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-4" style={{ color: CYAN_BRIGHT }}>
        In the network
      </p>

      {/* Phones: one swipe row that bleeds to both edges. From lg: a column. */}
      <div className="-mx-6 px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:px-0 lg:flex-col lg:overflow-visible">
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

      {more && (
        <Link
          href="/founding-network"
          className="inline-block mt-4 text-[11px] font-bold font-headline uppercase tracking-[0.2em]"
          style={{ color: CYAN_BRIGHT }}
        >
          All profiles
        </Link>
      )}

      {preview && (
        <p className="mt-4 text-[11px] font-bold font-headline uppercase tracking-[0.2em]" style={{ color: "rgba(156,240,255,0.7)" }}>
          Preview: what visitors see once the public reader opens.
        </p>
      )}

      <CardOverlay open={open !== null} label={`${name}'s profile`} onClose={close}>
        {open !== null ? cards[open] : null}
      </CardOverlay>
    </div>
  );
}
