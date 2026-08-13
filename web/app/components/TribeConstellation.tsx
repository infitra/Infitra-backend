"use client";

import Image from "next/image";
import { ProfileTrigger } from "@/app/components/ProfileModal";

/**
 * TribeConstellation — the experience card's new subject: the GROUP, not the
 * product. Experts sit at the centre; the tribe orbits them; seats not yet
 * taken are open slots waiting to be filled.
 *
 * Why this shape: INFITRA is not a hierarchy. Experts are at the centre of a
 * circle that includes everyone, not above a roster, and the visual should
 * say that before a single number does. It also earns its space
 * functionally, because every face opens that person's profile.
 *
 * Fully on brand and LIGHT: cream/white ground with the brand gradient wash,
 * cyan orbit rings, orange for the experts, cyan haloes for members. No dark
 * canvas, no invented colours.
 *
 * States it must carry:
 *   FORMING  — experts + open slots. Honest and full of anticipation, which
 *              is exactly the pilot's real state for weeks.
 *   FILLING  — real faces replace open slots, newest first.
 *   FULL     — capped, with a +N bubble as a peer of the faces.
 */

const ORANGE = "#FF6130";
const CYAN = "#0891b2";
const CYAN_BRIGHT = "#9CF0FF";
const INK = "#0F2229";

export interface TribeFace {
  profileId: string;
  name: string;
  avatar: string | null;
}

export interface ConstellationExpert {
  id: string;
  name: string;
  avatar: string | null;
}

/** Ring capacity. Beyond this the overflow bubble takes the last slot. */
const SLOTS = 10;

export function TribeConstellation({
  experts,
  members,
  memberTotal,
  viewerId,
  className,
}: {
  experts: ConstellationExpert[];
  members: TribeFace[];
  memberTotal: number;
  /** Highlights the viewer's own face ("you are in this circle"). */
  viewerId?: string | null;
  className?: string;
}) {
  // Reserve one slot for the overflow bubble when the tribe outgrows the ring.
  const hasOverflow = memberTotal > SLOTS;
  const overflow = hasOverflow ? memberTotal - (SLOTS - 1) : 0;
  const shown = members.slice(0, hasOverflow ? SLOTS - 1 : SLOTS);
  const filled = shown.length + (hasOverflow ? 1 : 0);

  // Occupied slots are spread EVENLY around the ring rather than filling
  // clockwise from the top: four members bunched on one side reads as an
  // accident, four spaced around the circle reads as a group forming.
  const takenIndex = new Set<number>();
  for (let j = 0; j < filled; j++) {
    let idx = Math.round((j * SLOTS) / filled) % SLOTS;
    while (takenIndex.has(idx)) idx = (idx + 1) % SLOTS;
    takenIndex.add(idx);
  }
  const occupied = [...takenIndex].sort((a, b) => a - b);
  const ghostSlots = Array.from({ length: SLOTS }, (_, i) => i).filter((i) => !takenIndex.has(i));

  // Even placement around the ring, starting at the top.
  const pos = (i: number) => {
    const angle = (-90 + i * (360 / SLOTS)) * (Math.PI / 180);
    const r = 39;
    return { left: `${50 + r * Math.cos(angle)}%`, top: `${50 + r * Math.sin(angle)}%` };
  };


  return (
    <div
      className={`relative w-full aspect-square ${className ?? ""}`}
      style={{ maxWidth: 420 }}
    >
      {/* Ground: brand wash, same language as the experience header. */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95) 0%, rgba(242,239,232,0.85) 45%, rgba(156,240,255,0.20) 72%, rgba(255,97,48,0.10) 100%)",
        }}
      />

      {/* Orbit rings */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <circle cx="50" cy="50" r="39" fill="none" stroke={CYAN} strokeOpacity="0.22" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="26" fill="none" stroke={CYAN} strokeOpacity="0.14" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="47" fill="none" stroke={ORANGE} strokeOpacity="0.14" strokeWidth="0.4" strokeDasharray="1.5 2.5" />
      </svg>

      {/* CENTRE — the experts. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="flex -space-x-3">
          {experts.slice(0, 3).map((e) => (
            <ProfileTrigger key={e.id} profileId={e.id} className="cursor-pointer">
              <Face src={e.avatar} name={e.name} size={64} ring={ORANGE} lift />
            </ProfileTrigger>
          ))}
        </div>
        <span
          className="mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black font-headline uppercase tracking-[0.14em] whitespace-nowrap"
          style={{ backgroundColor: "#FFFFFF", color: "#c2410c", boxShadow: "0 0 0 1px rgba(255,97,48,0.28)" }}
        >
          {experts.length > 1 ? "Your experts" : "Your expert"}
        </span>
      </div>

      {/* RING — real faces first, then the overflow bubble, then open slots. */}
      {shown.map((m, i) => {
        const p = pos(occupied[i]);
        const isYou = !!viewerId && m.profileId === viewerId;
        return (
          <div key={m.profileId} className="absolute -translate-x-1/2 -translate-y-1/2" style={p}>
            <ProfileTrigger profileId={m.profileId} className="cursor-pointer block">
              <Face src={m.avatar} name={m.name} size={44} ring={isYou ? ORANGE : CYAN} lift={isYou} />
            </ProfileTrigger>
            {isYou && (
              <span
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded-full text-[8px] font-black font-headline uppercase tracking-wider"
                style={{ backgroundColor: ORANGE, color: "#FFFFFF" }}
              >
                You
              </span>
            )}
          </div>
        );
      })}

      {hasOverflow &&
        (() => {
          const p = pos(occupied[occupied.length - 1]);
          return (
            <div key="overflow" className="absolute -translate-x-1/2 -translate-y-1/2" style={p}>
              <span
                className="flex items-center justify-center rounded-full text-[12px] font-black font-headline"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: "#FFFFFF",
                  color: CYAN,
                  boxShadow: `0 0 0 2px ${CYAN_BRIGHT}, 0 2px 8px rgba(15,34,41,0.10)`,
                }}
              >
                +{overflow}
              </span>
            </div>
          );
        })()}

      {ghostSlots.map((gi) => {
        const p = pos(gi);
        return (
          <span
            key={`ghost-${gi}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
            style={{
              ...p,
              width: 40,
              height: 40,
              border: "1.5px dashed rgba(8,145,178,0.35)",
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
            aria-hidden="true"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

function Face({
  src,
  name,
  size,
  ring,
  lift,
}: {
  src: string | null;
  name: string;
  size: number;
  ring: string;
  lift?: boolean;
}) {
  const shadow = lift
    ? `0 0 0 2.5px ${ring}, 0 6px 18px rgba(15,34,41,0.18)`
    : `0 0 0 2px ${ring}, 0 2px 8px rgba(15,34,41,0.10)`;
  if (src) {
    // next/image, NOT a raw <img>: members upload phone photos, and this
    // constellation mounts up to 13 of them above the fold. Unoptimised,
    // that was ~8 MB of originals (largest single avatar 2.37 MB) decoding
    // to hundreds of MB of bitmap to paint 44px circles — enough for iOS
    // Safari to abandon the paint half-rendered and stay that way.
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        loading="lazy"
        className="rounded-full object-cover block"
        style={{ width: size, height: size, boxShadow: shadow, backgroundColor: "#FFFFFF" }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        boxShadow: shadow,
        backgroundColor: "#FFFFFF",
      }}
    >
      <span className="font-black font-headline" style={{ color: ring, fontSize: size * 0.36 }}>
        {(name?.[0] ?? "?").toUpperCase()}
      </span>
    </span>
  );
}

/** The line under the circle: what the group IS right now. */
export function TribeCountLine({
  memberTotal,
  forming,
}: {
  memberTotal: number;
  forming?: boolean;
}) {
  if (memberTotal === 0) {
    return (
      <p className="text-[13px] font-bold font-headline text-center" style={{ color: "#94a3b8" }}>
        Your tribe is forming
      </p>
    );
  }
  return (
    <p className="text-[13px] font-bold font-headline text-center" style={{ color: "#475569" }}>
      <span className="font-black" style={{ color: INK }}>{memberTotal}</span>{" "}
      {memberTotal === 1 ? "person has" : "people have"} joined
      {forming ? " so far" : ""}
    </p>
  );
}
