"use client";

import { useEffect, useState } from "react";
import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";
import { type BeatDef, useBeatChapter, computeBounds, Phase, Pop, Enter, MobileRail, TitleZone, CUT_MS, CASCADE_MS, EASE, FIT, AutoFit } from "./chapterEngine";

/**
 * ACT 2 · ALIVE BY DESIGN — the engagement story.
 *
 * The space decomposed → no cold start (the introduction solves it) → the
 * tools in everyone's hands → the loop builds momentum → THE PEAK: live
 * now with a real Join CTA (the visitor's move, like Publish), then the
 * dark room — you're live, training together → the reflection closes the
 * loop → it compounds into the RETENTION LOOP: shape the next run, the
 * tribe re-enrolls in one tap, new members jump in the same run.
 *
 * Vocabulary in this act: live MOMENTS, never "sessions".
 */

/* dark peak palette — Act 1's room, back for one breath */
const TEAL = "#0C262E";
const LIGHT = "#F6F3EC";
const LIGHT_MUTED = "rgba(244,241,232,0.72)";

/* the first live moment of the reset — the peak uses it */
const MEET = EX.agenda[0][0];

/* ── The beats ─────────────────────────────────────────────── */
const BEATS: BeatDef[] = [
  { f: 0, p: 0, w: 1 }, // intro
  { f: 1, p: 0, w: 1 }, // the space — the header lands
  { f: 1, p: 1, w: 1.1 }, // — the components fan out
  { f: 2, p: 0, w: 1 }, // in everyone's hands — no cold start
  { f: 2, p: 1, w: 1.1 }, // — the four tools
  { f: 2, p: 2, w: 1 }, // — a question finds you
  { f: 2, p: 3, w: 1 }, // — answered once
  { f: 3, p: 0, w: 1 }, // the loop — momentum is building
  { f: 3, p: 1, w: 1.2 }, // — LIVE NOW: the join moment
  { f: 3, p: 2, w: 1.3 }, // — THE PEAK: you're live
  { f: 3, p: 3, w: 1 }, // — the reflection closes it
  { f: 4, p: 0, w: 1.1 }, // it compounds — the run builds
  { f: 4, p: 1, w: 1.2 }, // — the retention loop opens; releases into the finale
];

/* Mobile beat map — one swipe, one hero. Where a desktop beat fans out
 * several cards at once (the space's components), the phone gives each card
 * its own beat instead of shrinking them. Every beat is ≥ 1 unit wide so a
 * swipe here travels the same distance as in the dark chapter — the two
 * chapters must FEEL identical. */
const BEATS_M: BeatDef[] = [
  { f: 0, p: 0, w: 1 }, // intro
  { f: 1, p: 0, w: 1 }, // the space — the header lands
  { f: 1, p: 1, w: 1 }, // — the journey
  { f: 1, p: 2, w: 1 }, // — the live moments
  { f: 1, p: 3, w: 1 }, // — the tribe feed
  { f: 2, p: 0, w: 1 }, // the tribe engagement — no cold start
  { f: 2, p: 1, w: 1.1 }, // — the four tools
  { f: 2, p: 2, w: 1 }, // — a question finds you
  { f: 2, p: 3, w: 1 }, // — answered once
  { f: 3, p: 0, w: 1 }, // the live loop — momentum is building
  { f: 3, p: 1, w: 1.2 }, // — LIVE NOW: the join moment
  { f: 3, p: 2, w: 1.3 }, // — THE PEAK: you're live
  { f: 3, p: 3, w: 1 }, // — the reflection closes it
  { f: 4, p: 0, w: 1.1 }, // the growth — the run wraps, you shape the next
  { f: 4, p: 1, w: 1.2 }, // — the growth engine; releases into the finale
];

const RAIL = [
  { n: "01", label: "The space", frame: 1, firstBeat: 1 },
  { n: "02", label: "The Tribe Engagement", frame: 2, firstBeat: 3 },
  { n: "03", label: "The live loop", frame: 3, firstBeat: 7 },
  { n: "04", label: "The growth", frame: 4, firstBeat: 11 },
];

/* The anchored heads — the rail carries the step identity; these carry only
 * title + copy, crossfading in the shared fixed-height TitleZone. */
const LW_HEADS: Record<number, { title: React.ReactNode; copy?: string; light?: boolean }[]> = {
  1: [{ title: "The room your tribe lives in.", copy: "Not a video library — a space with structure, presence and a feed of its own." }],
  2: [
    { title: "No cold start.", copy: "The moment someone joins, the space asks them to introduce themselves." },
    { title: "Anyone can engage at any time.", copy: "Four tools, for members and experts — no permission needed, no cold silence." },
    { title: "A question finds you.", copy: "A notification the moment it lands — your console collects it until it's answered." },
    { title: "Answered once. Everyone learns.", copy: "Answers are pinned inside posts — visible to the whole tribe." },
  ],
  3: [
    { title: "Momentum is building.", copy: "The tribe shares its readiness — and everyone feels it." },
    { title: "The moment arrives.", copy: "The reset's first live moment is open — your tribe is walking in." },
    { title: "You're live.", copy: "No new login, no external link — training together, right now.", light: true },
    { title: "The reflection closes the loop.", copy: "Every prompt becomes a post — the feed keeps its own rhythm." },
  ],
  4: [
    { title: "The run wraps — the momentum never stops.", copy: "The space you built stays persistent, the tribe grows." },
    { title: "The growth engine.", copy: "Retention by design, progression at your hands." },
  ],
};

/* ── Icons ─────────────────────────────────────────────────── */
const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CHEVRON_DOWN = (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ICON_BELL = (color: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

const ICON_CAL = (color: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const ICON_SHARE = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M12 7.5v5M9.5 10h5" />
  </svg>
);
const ICON_ASK = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M9.7 8.6a2.4 2.4 0 0 1 4.7.8c0 1.5-2.3 1.8-2.3 3" />
    <path d="M12 14.8h.01" />
  </svg>
);
const ICON_CONTEXT = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57a4 4 0 1 1 5.66 5.66l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const ICON_HEART = (color: string) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ICON_COMMENT = (color: string) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3.1-.4-4.4-1.2L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

/** A full feed post — header, the prompt it answers, the member's own words,
 *  reactions. The same grammar as the answered-question post. */
function FeedPost({
  initial,
  color,
  name,
  when,
  promptLabel,
  promptColor,
  prompt,
  body,
  chip,
  comments = 0,
}: {
  initial: string;
  color: string;
  name: string;
  when: string;
  promptLabel: string;
  promptColor: string;
  prompt: string;
  body: string;
  chip?: string;
  comments?: number;
}) {
  return (
    <div className="rounded-3xl p-6 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}24` }}>
          <span className="text-[13px] font-headline" style={{ color, fontWeight: 800 }}>{initial}</span>
        </span>
        <span className="text-[15px] font-headline" style={{ color: INK, fontWeight: 800 }}>{name}</span>
        <span className="ml-auto text-[11px] font-bold" style={{ color: FAINT }}>{when}</span>
      </div>
      {/* the prompt this post answers */}
      <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: `${promptColor}12`, boxShadow: `inset 3.5px 0 0 ${promptColor}` }}>
        <p className="text-[10.5px] uppercase tracking-[0.16em] font-headline" style={{ color: promptColor, fontWeight: 800 }}>{promptLabel}</p>
        <p className="text-[14px] font-bold font-headline leading-snug mt-1.5" style={{ color: INK }}>{prompt}</p>
      </div>
      {/* the member's own words */}
      <p className="text-[15.5px] leading-relaxed mt-4" style={{ color: INK, fontWeight: 500 }}>{body}</p>
      {chip && (
        <span className="inline-flex mt-3.5 px-3 py-1 rounded-full text-[10.5px] font-headline" style={{ color: promptColor, backgroundColor: `${promptColor}14`, fontWeight: 800 }}>{chip}</span>
      )}
      <div className="flex items-center gap-5 mt-4 pt-3.5" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: MUTED }}>{ICON_HEART(MUTED)} Like</span>
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: MUTED }}>{ICON_COMMENT(MUTED)} {comments}</span>
        <span className="ml-auto text-[11px]" style={{ color: FAINT }}>In the tribe feed</span>
      </div>
    </div>
  );
}

/* ── The space's REAL header ───────────────────────────────── */
function SpaceHeader() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
      {/* Mobile: the cover leads, card-style — the same presence the real
         experience space has on a phone. sm+ keeps the compact row with the
         cover as a side thumb. */}
      {/* aspect-video instead of a fixed short height — the cover shows whole
         (heads were cropped at h-40) */}
      <div className="relative aspect-[16/9] sm:hidden" style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.35), rgba(15,34,41,0))" }} />
      </div>
      <div className="flex items-stretch gap-4 px-5 sm:px-6 py-5">
        <span className="relative shrink-0 w-24 sm:w-32 rounded-xl overflow-hidden hidden sm:block" style={{ backgroundColor: INK }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[18px] sm:text-[21px] font-headline tracking-tight leading-snug" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.015em" }}>
            {EX.title}
          </p>
          <span className="flex items-center gap-1.5 mt-1.5">
            <span className="flex -space-x-1.5">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="w-6 h-6 rounded-full overflow-hidden" style={{ border: "1.5px solid #FFFFFF" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                </span>
              ))}
            </span>
            <span className="text-[12px] font-bold" style={{ color: MUTED }}>
              with <span style={{ color: INK }}>{ALEX.name} &amp; {MIRA.name}</span>
            </span>
          </span>
          <span className="flex flex-wrap gap-1.5 mt-3">
            {["Meet your Experts", "Structure"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-headline" style={{ color: INK, backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.10)", fontWeight: 800 }}>
                {c} <span style={{ color: FAINT }}>{CHEVRON_DOWN}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="shrink-0 text-right flex flex-col items-end justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-headline" style={{ color: "#ef4444", fontWeight: 800 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            Live · Week {ROOM.week} of {EX.weeks}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
              <span className="text-[8px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>A</span>
              <span className="absolute -bottom-0 -right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e", border: "1px solid #FFF" }} />
            </span>
            <span className="text-[9px] uppercase tracking-widest font-headline" style={{ color: MUTED, fontWeight: 800 }}>
              Active now <span style={{ color: INK }}>{ROOM.activeNow}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Live-moment row ───────────────────────────────────────── */
function MomentRow({ img, title, host, state, right }: { img: string; title: string; host: string; state: "done" | "next" | "upcoming"; right?: string }) {
  const isNext = state === "next";
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={
        isNext
          ? { backgroundColor: "rgba(255,97,48,0.05)", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30)" }
          : { backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }
      }
    >
      <span className="relative shrink-0 w-16 h-11 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" style={state === "done" ? { opacity: 0.55 } : undefined} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[13px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>{title}</span>
        <span className="block text-[10px] font-bold" style={{ color: FAINT }}>{host}</span>
      </span>
      <span className="shrink-0">
        {state === "done" && (
          <span className="inline-flex items-center gap-1 text-[10px] font-headline" style={{ color: MUTED, fontWeight: 800 }}>
            {CHECK(CYAN, 11)} Done
          </span>
        )}
        {state === "next" && <span className="text-[11px] font-black font-headline" style={{ color: ORANGE }}>{right ?? "Next"}</span>}
        {state === "upcoming" && (
          <span className="text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
            Upcoming
          </span>
        )}
      </span>
    </div>
  );
}

/* ── Tribe post ────────────────────────────────────────────── */
function TribePost({ initial, color, name, when, text, chip }: { initial: string; color: string; name: string; when: string; text: string; chip?: string }) {
  return (
    <div className="rounded-2xl px-4 py-3 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
      <div className="flex gap-2.5">
        <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
          <span className="text-[10px] font-headline" style={{ color, fontWeight: 800 }}>{initial}</span>
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-headline" style={{ color: INK, fontWeight: 800 }}>
            {name} <span style={{ color: FAINT, fontWeight: 600 }}>· {when}</span>
          </p>
          <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: MUTED }}>{text}</p>
          {chip && (
            <span className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
              {chip}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 1 · The space, decomposed ════════════════════════
 * The three components are atoms — the desktop fan-out and the mobile
 * one-hero-per-beat staging render the same cards. */

function SpaceJourneyCard() {
  return (
    <div className="h-full rounded-2xl p-5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.10)" }}>
      <p className="text-[12px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>The journey</p>
      <p className="font-headline leading-none mt-2.5" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
        <span className="text-[26px]" style={{ color: INK }}>WEEK {ROOM.week} </span>
        <span className="text-[26px]" style={{ color: "rgba(15,34,41,0.18)" }}>OF {EX.weeks}</span>
      </p>
      <p className="text-[10px] uppercase tracking-[0.14em] font-headline mt-1.5" style={{ color: ORANGE, fontWeight: 800 }}>{ROOM.theme}</p>
      <div className="flex items-center gap-1 mt-3.5">
        {EX.arc.map((_, i) => (
          <span key={i} className="flex items-center flex-1 last:flex-none">
            <span
              className="shrink-0 rounded-full"
              style={
                i === ROOM.week - 1
                  ? { width: 11, height: 11, backgroundColor: ORANGE, boxShadow: "0 0 0 3px rgba(255,97,48,0.20)" }
                  : { width: 6, height: 6, backgroundColor: i < ROOM.week - 1 ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.14)" }
              }
            />
            {i < EX.arc.length - 1 && <span className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.10)" }} />}
          </span>
        ))}
      </div>
      {/* the progress tracker — the whole experience, attendance */}
      <div className="mt-7 pt-5" style={{ borderTop: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>Progress of the whole experience</p>
          <p className="text-[11px] font-black font-headline" style={{ color: CYAN }}>25%</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: "25%", backgroundColor: CYAN }} />
        </div>
        <p className="text-[10.5px] font-bold mt-2" style={{ color: MUTED }}>5 of {EX.sessions} live moments attended</p>
      </div>
    </div>
  );
}

function SpaceMomentsCard() {
  return (
    <div className="h-full rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 16px 40px rgba(15,34,41,0.08)" }}>
      <p className="text-[12px] uppercase tracking-[0.18em] font-headline text-left px-1 pt-0.5" style={{ color: ORANGE, fontWeight: 800 }}>The live moments</p>
      <MomentRow img={ROOM.done.img} title={ROOM.done.title} host={ROOM.done.host} state="done" />
      <MomentRow img={ROOM.next.img} title={ROOM.next.title} host={ROOM.next.host} state="next" />
      <MomentRow img={ROOM.upcoming.img} title={ROOM.upcoming.title} host={ROOM.upcoming.host} state="upcoming" />
    </div>
  );
}

function SpaceFrame({ phase }: { phase: number }) {
  const out = phase >= 1;
  return (
    <div className={`w-full max-w-4xl mx-auto ${FIT}`}>
      {/* the header lands center, then docks up as the components fan out */}
      <div style={{ transform: out ? "none" : "translateY(130px)", transition: `transform ${CUT_MS + 120}ms ${EASE}` }} aria-hidden>
        <SpaceHeader />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-5 items-stretch" aria-hidden>
        <Pop show={out} d={140}>
          <SpaceJourneyCard />
        </Pop>
        <Pop show={out} d={140 + CASCADE_MS}>
          <SpaceMomentsCard />
        </Pop>
        <Pop show={out} d={140 + CASCADE_MS * 2}>
          <SpaceTribeCard />
        </Pop>
      </div>
    </div>
  );
}

function SpaceTribeCard() {
  return (
    <div className="h-full rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 16px 40px rgba(15,34,41,0.08)" }}>
      <p className="text-[12px] uppercase tracking-[0.18em] font-headline text-left px-1 pt-0.5" style={{ color: ORANGE, fontWeight: 800 }}>The tribe feed</p>
      <TribePost initial="A" color={CYAN} name="Anna" when="2h" text="Week 1 done — first plan I've actually kept up with 🔥" />
      <TribePost initial="S" color={ORANGE} name="Sam" when="just now" text="Moment 5 ✓ — see everyone Tuesday!" />
    </div>
  );
}

/* Mobile staging — the header lands, then each component gets its own
 * swipe at natural size: journey, live moments, tribe feed. */
function SpaceFrameMobile({ phase }: { phase: number }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div aria-hidden>
        <Enter key={Math.min(phase, 3)}>
          {phase === 0 && <SpaceHeader />}
          {phase === 1 && <SpaceJourneyCard />}
          {phase === 2 && <SpaceMomentsCard />}
          {phase >= 3 && <SpaceTribeCard />}
        </Enter>
      </div>
    </div>
  );
}

/* ══ Frame 2 · In everyone's hands ══════════════════════════
 * The pieces are atoms shared by the desktop grids and the mobile staging. */

function HandsIntroPost() {
  return (
    <FeedPost
      initial="N"
      color={ORANGE}
      name="Nina"
      when="just now"
      promptLabel="New in the tribe · Your experts asked"
      promptColor={CYAN}
      prompt={EX.introPrompt}
      body="Desk job, two kids, and every plan I've started before fizzled by week two. I'm here to finally build energy that lasts — and to stick with it because this time there's a group. Can't wait to meet you all! 💪"
      chip="Introduction"
      comments={3}
    />
  );
}

function HandsNotifCard() {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
      <div className="flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <span className="relative">
          {ICON_BELL(INK, 20)}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: ORANGE, border: "1.5px solid #FFFFFF" }} />
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: INK, fontWeight: 800 }}>Notifications</span>
        <span className="ml-auto text-[9.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Mark all read</span>
      </div>
      <div className="rounded-xl px-3.5 py-3 flex items-center gap-3" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: `inset 3.5px 0 0 ${ORANGE}` }}>
        <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
          <span className="text-[11px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>T</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{ROOM.qa.asker} asked you a question</span>
          <span className="block text-[11.5px] mt-1" style={{ color: MUTED }}>Open your Tribe to answer</span>
        </span>
        <span className="shrink-0 text-[10px] font-bold" style={{ color: FAINT }}>just now</span>
      </div>
    </div>
  );
}

function HandsConsoleCard() {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
      <div className="flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <span className="w-7 h-7 rounded-full overflow-hidden shrink-0" style={{ border: `1.5px solid ${ORANGE}59` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: INK, fontWeight: 800 }}>Needs you</span>
      </div>
      <div className="rounded-xl px-4 py-3.5 flex items-center justify-between" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30)" }}>
        <span>
          <span className="block text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Waiting on you</span>
          <span className="block text-[15px] font-black font-headline mt-1" style={{ color: INK }}>1 question</span>
        </span>
        <span className="text-[12.5px] font-black font-headline" style={{ color: ORANGE }}>Answer →</span>
      </div>
      <p className="text-[11.5px] font-bold mt-3" style={{ color: MUTED }}>It stays on your console until it&apos;s done — nothing slips through.</p>
    </div>
  );
}

function HandsAnsweredPost({ answerOn }: { answerOn: boolean }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl p-6 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <div className="flex items-center gap-3">
        <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
          <span className="text-[12px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>T</span>
        </span>
        <span className="text-[14px] font-headline" style={{ color: INK, fontWeight: 800 }}>{ROOM.qa.asker}</span>
        <span className="ml-auto text-[10.5px] font-bold" style={{ color: FAINT }}>just now</span>
      </div>
      <div className="mt-3.5 rounded-xl px-4 py-2.5 inline-flex items-center gap-2" style={{ backgroundColor: "rgba(8,145,178,0.07)", boxShadow: `inset 3.5px 0 0 ${CYAN}` }}>
        <span className="text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Question for</span>
        <span className="text-[13px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>{ALEX.name}</span>
      </div>
      <p className="text-[15px] leading-snug mt-3" style={{ color: INK, fontWeight: 600 }}>
        {ROOM.qa.question}
      </p>
      <Pop show={answerOn} d={250}>
        <div className="mt-4 rounded-2xl p-5" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: `inset 4px 0 0 ${ORANGE}` }}>
          <div className="flex items-center gap-2.5">
            <span className="shrink-0 w-8 h-8 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ORANGE}59` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              Answered by {ALEX.name}
            </span>
          </div>
          <p className="text-[13.5px] leading-relaxed mt-2.5" style={{ color: MUTED }}>
            {ROOM.qa.answer}
          </p>
        </div>
      </Pop>
      <div className="flex items-center gap-5 mt-4 pt-3.5" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: MUTED }}>{ICON_HEART(MUTED)} Like</span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: MUTED }}>{ICON_COMMENT(MUTED)} 1</span>
        <span className="ml-auto text-[11px]" style={{ color: FAINT }}>Pinned — visible to the whole tribe.</span>
      </div>
    </div>
  );
}

function HandsFrame({ phase, staticLayout = false }: { phase: number; staticLayout?: boolean }) {
  return (
    <div className={`w-full max-w-3xl mx-auto ${staticLayout ? "" : FIT}`}>
      {/* Each phase is a self-contained, centered [head + content] block — the
         same treatment as the dark chapter's frames, so short phases stay
         centered instead of leaving a gap under a top-pinned title. */}
      <div className={staticLayout ? undefined : "relative"} style={staticLayout ? undefined : { minHeight: 580 }}>
        {/* p0 — the introduction post: the cold start, solved */}
        <Phase on={phase === 0} isStatic={staticLayout} className="flex flex-col justify-center" enterFrom="translateY(-14px)">
          <div className="mx-auto w-full max-w-2xl">
            <HandsIntroPost />
          </div>
        </Phase>

        {/* p1 — the four tools, four distinct pieces */}
        <Phase on={phase === 1} isStatic={staticLayout} className="flex flex-col justify-center">
          <div className="grid sm:grid-cols-2 gap-6 text-left" aria-hidden>
            {/* share — members */}
            <Pop show={phase === 1} d={120}>
              <div className="h-full rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.08), inset 4px 0 0 " + CYAN }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Share</p>
                  <span className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>Members</span>
                </div>
                <div className="rounded-full px-4 py-2.5 text-[12px]" style={{ backgroundColor: "#F8F6F0", color: FAINT }}>
                  Share with your Tribe…
                </div>
                <p className="text-[11.5px] font-bold mt-2.5" style={{ color: MUTED }}>Anyone, anytime — wins, struggles, photos.</p>
              </div>
            </Pop>
            {/* question post — members */}
            <Pop show={phase === 1} d={120 + CASCADE_MS}>
              <div className="h-full rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.08), inset 4px 0 0 ${CYAN}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Ask inside a post</p>
                  <span className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>Members</span>
                </div>
                <p className="text-[13px] leading-snug" style={{ color: INK, fontWeight: 600 }}>{ROOM.qa.question}</p>
                <div className="mt-3 rounded-lg px-3 py-2 inline-flex items-center gap-2" style={{ backgroundColor: "rgba(8,145,178,0.07)", boxShadow: `inset 3px 0 0 ${CYAN}` }}>
                  <span className="text-[9px] uppercase tracking-[0.14em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Question for</span>
                  <span className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[11.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>{ALEX.name}</span>
                  <span className="text-[9px] font-bold" style={{ color: FAINT }}>routed ✓</span>
                </div>
              </div>
            </Pop>
            {/* context post — creators */}
            <Pop show={phase === 1} d={120 + CASCADE_MS * 2}>
              <div className="h-full rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.08), inset 4px 0 0 " + ORANGE }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Post with context</p>
                  <span className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.08)", fontWeight: 800 }}>Experts</span>
                </div>
                <p className="text-[13px] leading-snug" style={{ color: INK, fontWeight: 600 }}>
                  Tuesday we build on Monday&apos;s flow — bring water and a mat!
                </p>
                <div className="mt-3 flex items-center gap-2.5 rounded-lg p-2" style={{ backgroundColor: "#F8F6F0", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}>
                  <span className="relative shrink-0 w-11 h-8 rounded-md overflow-hidden" style={{ backgroundColor: INK }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ROOM.next.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0 text-[11px] font-bold truncate" style={{ color: INK }}>{ROOM.next.title}</span>
                  <span className="ml-auto text-[8.5px] uppercase tracking-widest font-headline shrink-0" style={{ color: FAINT, fontWeight: 800 }}>Moment</span>
                </div>
              </div>
            </Pop>
            {/* calendar export — equal citizen */}
            <Pop show={phase === 1} d={120 + CASCADE_MS * 3}>
              <div className="h-full rounded-2xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.08), inset 4px 0 0 " + CYAN }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Calendar export</p>
                  <span className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>Members</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
                    {ICON_CAL(CYAN, 19)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>Export your calendar</span>
                    <span className="block text-[11px] font-bold mt-1" style={{ color: MUTED }}>Every live moment · one click</span>
                  </span>
                </div>
                <p className="text-[11.5px] font-bold mt-2.5" style={{ color: MUTED }}>The structure follows you out of the app.</p>
              </div>
            </Pop>
          </div>
        </Phase>

        {/* p2 — TWO pieces: the notification, and the console that collects it */}
        <Phase on={phase === 2} isStatic={staticLayout} className="flex flex-col justify-center">
          <div className="grid sm:grid-cols-2 gap-6 items-start" aria-hidden>
            {/* piece 1 — the notification */}
            <div className="text-left"><HandsNotifCard /></div>
            {/* piece 2 — the console */}
            <div className="text-left"><HandsConsoleCard /></div>
          </div>
        </Phase>

        {/* p3 — the answered post */}
        <Phase on={phase >= 3} isStatic={staticLayout} className="flex flex-col justify-center">
          <HandsAnsweredPost answerOn={phase >= 3} />
        </Phase>
      </div>
    </div>
  );
}

/* Mobile staging — the phases at natural size; the four tools become
 * compact rows a phone can read instead of four shrunken cards. */
const TOOL_ROWS = [
  { t: "Share", aud: "Members", d: "Anyone, anytime — wins, struggles, photos.", c: CYAN, icon: ICON_SHARE },
  { t: "Ask inside a post", aud: "Members", d: "Questions routed to the right expert.", c: CYAN, icon: ICON_ASK },
  { t: "Post with context", aud: "Experts", d: "Attach the live moment it's about.", c: ORANGE, icon: ICON_CONTEXT },
  { t: "Calendar export", aud: "Members", d: "The structure follows you out of the app.", c: CYAN, icon: ICON_CAL },
];

function HandsFrameMobile({ phase }: { phase: number }) {
  const p = Math.min(phase, 3);
  return (
    <div className="w-full max-w-md mx-auto">
      <Enter key={p}>
        {p === 0 && <HandsIntroPost />}
        {p === 1 && (
          <div className="space-y-2.5 text-left" aria-hidden>
            {TOOL_ROWS.map(({ t, aud, d, c, icon }, i) => (
              <Enter key={t} d={i * CASCADE_MS}>
                <div className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5" style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px rgba(15,34,41,0.06), 0 12px 30px rgba(15,34,41,0.07), inset 4px 0 0 ${c}` }}>
                  <span className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c}12` }}>
                    {icon(c, 19)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>{t}</span>
                      <span className="shrink-0 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: c, backgroundColor: `${c}14`, fontWeight: 800 }}>{aud}</span>
                    </span>
                    <span className="block text-[12px] font-bold mt-1" style={{ color: MUTED }}>{d}</span>
                  </span>
                </div>
              </Enter>
            ))}
          </div>
        )}
        {p === 2 && (
          <div className="space-y-4 text-left" aria-hidden>
            <HandsNotifCard />
            <HandsConsoleCard />
          </div>
        )}
        {p === 3 && <HandsAnsweredPost answerOn />}
      </Enter>
    </div>
  );
}

/* ══ Frame 3 · The engagement loop ══════════════════════════
 * Pulse, peak and reflection are atoms shared with the mobile staging. */

function LoopPulseCard() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl p-6 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 4px 0 0 " + ORANGE }} aria-hidden>
      <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
        Pulse · before the live moment
      </p>
      <p className="text-[16.5px] font-bold font-headline leading-snug mt-2" style={{ color: INK }}>
        {MEET.title} — how ready are you?
      </p>
      <div className="mt-4 relative h-2.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "80%", backgroundColor: CYAN }} />
        <span className="absolute -top-[5px] w-4 h-4 rounded-full" style={{ left: "77%", backgroundColor: "#FFFFFF", boxShadow: `0 0 0 2px ${CYAN}` }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px]" style={{ color: FAINT }}>0</span>
        <span className="text-[12.5px] font-black font-headline" style={{ color: CYAN }}>8 / 10</span>
        <span className="text-[10px]" style={{ color: FAINT }}>10</span>
      </div>
    </div>
  );
}

function LoopLeaPost() {
  return (
    <div className="rounded-2xl px-5 py-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 12px 30px rgba(15,34,41,0.06)" }} aria-hidden>
      <div className="flex gap-3.5">
        <span className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.14)" }}>
          <span className="text-[13px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>L</span>
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-headline" style={{ color: INK, fontWeight: 800 }}>
            Lea <span style={{ color: FAINT, fontWeight: 600 }}>· just now</span>
          </p>
          <p className="text-[14.5px] leading-relaxed mt-1" style={{ color: INK, fontWeight: 500 }}>
            Ready! First live moment of the reset — nervous and excited. Can&apos;t wait to meet everyone 😅
          </p>
          <span className="inline-flex mt-2 px-3 py-1 rounded-full text-[10.5px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800 }}>
            Pulse · 8/10
          </span>
        </div>
      </div>
    </div>
  );
}

function LoopFrame({ phase, onJoin, staticLayout = false }: { phase: number; onJoin: () => void; staticLayout?: boolean }) {
  const isPeak = phase === 2;
  return (
    <div className={`w-full max-w-4xl mx-auto ${staticLayout ? "" : FIT}`}>
      {/* Each phase carries its own head and centers as one block (dark-frame
         treatment) — no gap under a pinned title on the lighter phases. */}
      <div className={staticLayout ? undefined : "relative"} style={staticLayout ? undefined : { minHeight: 680 }}>
        {/* p0 — the pulse: momentum building */}
        <Phase on={phase === 0} isStatic={staticLayout} className="flex flex-col justify-center" enterFrom="translateY(-14px)">
          <LoopPulseCard />
          <Pop show={phase === 0} d={300} className="mx-auto w-full max-w-2xl mt-4">
            <LoopLeaPost />
          </Pop>
        </Phase>

        {/* p1 — THE MOMENT ARRIVES: the real live session card + Join CTA */}
        <Phase on={phase === 1} isStatic={staticLayout} className="flex flex-col items-center justify-center" interactive>
          {/* The real live/join card — a faithful copy of the Experience
             Space's HeroSessionCard in its "live" state (WeekJourney.tsx):
             image left, red pulsing "Live now", meta line, cohort-energy chip,
             and the red "Join the room →" that carries you into the room. */}
          <div
            onClick={onJoin}
            role="button"
            tabIndex={0}
            className="w-full rounded-3xl overflow-hidden flex flex-col sm:flex-row items-stretch cursor-pointer transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 2px #ef4444, 0 28px 72px rgba(239,68,68,0.20)" }}
          >
            <div className="relative shrink-0 w-full h-56 sm:h-auto sm:w-80 lg:w-96 sm:min-h-[520px]" style={{ backgroundColor: "#ECE7DD" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MEET.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 p-9 sm:p-12 flex flex-col text-left">
              <p className="text-[14px] uppercase tracking-[0.2em] font-headline flex items-center gap-2.5" style={{ color: "#ef4444", fontWeight: 800 }}>
                <span className="inline-block w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />
                Live now
              </p>
              <h3 className="font-black font-headline tracking-tight mt-4 leading-[1.06]" style={{ color: INK, fontSize: "clamp(1.9rem, 4.4vw, 2.8rem)", letterSpacing: "-0.02em" }}>
                {MEET.title}
              </h3>
              <p className="text-base sm:text-[17px] mt-4" style={{ color: "#64748b" }}>
                {MEET.day} · {MEET.time} · {MEET.dur} · {MEET.host}
              </p>
              <span className="inline-flex items-center gap-2 mt-5 self-start px-4 py-2 rounded-full text-[14px] font-bold font-headline" style={{ backgroundColor: "rgba(8,145,178,0.10)", color: CYAN }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                Cohort energy 8/10
              </span>
              <div className="flex items-center justify-between gap-4 mt-auto pt-10">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onJoin(); }}
                  className="px-12 py-5 rounded-full text-white text-lg font-black font-headline transition-transform hover:scale-[1.03]"
                  style={{ backgroundColor: "#ef4444", boxShadow: "0 10px 30px rgba(239,68,68,0.42)" }}
                >
                  Join the room →
                </button>
                <span className="text-[15px] font-bold" style={{ color: "#94a3b8" }}>8 in the room</span>
              </div>
            </div>
          </div>
          <p className="text-[15px] mt-8" style={{ color: MUTED }}>Your move — or keep scrolling.</p>
        </Phase>

        {/* p2 — THE PEAK: the room, as energy */}
        <Phase on={isPeak} isStatic={staticLayout} className="flex flex-col items-center justify-center" enterFrom="none">
          <PeakScene />
        </Phase>

        {/* p3 — the reflection post closes the loop */}
        <Phase on={phase >= 3} isStatic={staticLayout} className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-2xl">
            <LoopReflectionPost />
          </div>
        </Phase>
      </div>
    </div>
  );
}

function PeakScene() {
  return (
    <>
      <div className="relative flex items-center justify-center" style={{ width: 330, height: 330 }}>
        {/* pulsing rings — training, together, right now */}
        {[215, 275, 330].map((s, i) => (
          <span
            key={s}
            className="absolute rounded-full animate-ping"
            style={{
              width: s,
              height: s,
              border: `1.5px solid ${i === 1 ? "rgba(255,97,48,0.5)" : "rgba(156,240,255,0.4)"}`,
              animationDuration: "2.6s",
              animationDelay: `${i * 0.45}s`,
            }}
          />
        ))}
        <span className="absolute rounded-full" style={{ width: 190, height: 190, backgroundColor: "rgba(156,240,255,0.06)", border: "1px solid rgba(156,240,255,0.25)" }} />
        {/* the hosts, present */}
        <div className="relative flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.22em] font-headline" style={{ color: "#ef4444", fontWeight: 800 }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
            Live
          </span>
          <span className="flex -space-x-3">
            {[ALEX.avatar, MIRA.avatar].map((a) => (
              <span key={a} className="w-14 h-14 rounded-full overflow-hidden" style={{ border: "2px solid rgba(246,243,236,0.9)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a} alt="" className="w-full h-full object-cover" />
              </span>
            ))}
          </span>
          <span className="flex -space-x-1">
            {["A", "S", "L", "J", "N", "E"].map((m) => (
              <span key={m} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-headline" style={{ backgroundColor: "rgba(156,240,255,0.14)", color: "#9CF0FF", fontWeight: 800, border: "1px solid rgba(12,38,46,0.8)" }}>
                {m}
              </span>
            ))}
          </span>
        </div>
      </div>
      <p className="text-[15px] font-bold font-headline mt-3" style={{ color: LIGHT_MUTED }}>
        8 in the room — training together.
      </p>
      {/* the heartbeat, centered under the pulse above */}
      <svg width="380" height="48" viewBox="0 0 380 48" fill="none" className="mt-5 max-w-full" aria-hidden>
        <defs>
          <linearGradient id="lw-peak-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9CF0FF" />
            <stop offset="42%" stopColor="#9CF0FF" />
            <stop offset="62%" stopColor="#FF6130" />
            <stop offset="100%" stopColor="#FF6130" />
          </linearGradient>
        </defs>
        <path d="M0,24 H164 L177,24 L189,6 L203,42 L216,24 H380" stroke="url(#lw-peak-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
}

function LoopReflectionPost() {
  return (
    <FeedPost
      initial="A"
      color={CYAN}
      name="Anna"
      when="just now"
      promptLabel="Reflection · after the live moment"
      promptColor={CYAN}
      prompt={`How was “${MEET.title}”?`}
      body="Didn't expect to laugh that much on day one — Alex and Mira had us moving in minutes and it felt like a team, not a class. Already counting down to Tuesday. This group 🔥"
      chip="Energy after · 9/10"
      comments={5}
    />
  );
}

/* Mobile staging — the live moment as an app-style vertical card; pulse,
 * peak and reflection at natural size. The anchored TitleZone carries the
 * words; only the hero moves on a swipe. */
function LoopFrameMobile({ phase, onJoin }: { phase: number; onJoin: () => void }) {
  const p = Math.min(phase, 3);
  return (
    <div className="w-full max-w-md mx-auto">
      <Enter key={p}>
        {p === 0 && (
          <>
            <LoopPulseCard />
            <Enter d={260} className="mt-4"><LoopLeaPost /></Enter>
          </>
        )}
        {p === 1 && (
          <>
            <div
              onClick={onJoin}
              role="button"
              tabIndex={0}
              className="w-full rounded-3xl overflow-hidden text-left cursor-pointer"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 2px #ef4444, 0 28px 72px rgba(239,68,68,0.20)" }}
            >
              <div className="relative w-full h-40" style={{ backgroundColor: "#ECE7DD" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MEET.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <p className="text-[12px] uppercase tracking-[0.2em] font-headline flex items-center gap-2" style={{ color: "#ef4444", fontWeight: 800 }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />
                  Live now
                </p>
                <h3 className="text-[26px] font-black font-headline tracking-tight mt-2.5 leading-[1.1]" style={{ color: INK, letterSpacing: "-0.02em" }}>
                  {MEET.title}
                </h3>
                <p className="text-[13.5px] mt-2.5" style={{ color: "#64748b" }}>
                  {MEET.day} · {MEET.time} · {MEET.dur} · {MEET.host}
                </p>
                <span className="inline-flex items-center gap-2 mt-3.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold font-headline" style={{ backgroundColor: "rgba(8,145,178,0.10)", color: CYAN }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                  Cohort energy 8/10
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onJoin(); }}
                  className="w-full mt-5 px-8 py-4 rounded-full text-white text-[17px] font-black font-headline"
                  style={{ backgroundColor: "#ef4444", boxShadow: "0 10px 30px rgba(239,68,68,0.42)" }}
                >
                  Join the room →
                </button>
                <p className="text-center text-[12.5px] font-bold mt-3" style={{ color: "#94a3b8" }}>8 in the room</p>
              </div>
            </div>
            <p className="text-[13.5px] mt-5 text-center" style={{ color: MUTED }}>Your move — or keep scrolling.</p>
          </>
        )}
        {p === 2 && (
          <div className="flex flex-col items-center">
            <PeakScene />
          </div>
        )}
        {p === 3 && <LoopReflectionPost />}
      </Enter>
    </div>
  );
}

/* ══ Frame 4 · The growth ═══════════════════════════════════
 * p0 — the run wraps: the completed W1→W6 progression + you already shape
 *      the next run.
 * p1 — the growth engine: retention, new people, progression. */
function CompoundFrame({ phase, active, staticLayout = false }: { phase: number; active: boolean; staticLayout?: boolean }) {
  const grown = phase >= 1;
  return (
    <div className={`w-full max-w-4xl mx-auto ${staticLayout ? "" : FIT}`}>
      <div className={staticLayout ? undefined : "relative"} style={staticLayout ? undefined : { minHeight: 440 }}>
        {/* p0 — the run wraps: complete, and the next one takes shape */}
        <Phase on={!grown} isStatic={staticLayout} className="flex flex-col justify-center" enterFrom="translateY(-14px)">
          <div className="rounded-3xl p-6 sm:p-7 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
            <CmpProgress fill={active || staticLayout ? "100%" : "8%"} litWeeks={active || staticLayout ? 6 : 1} />
          </div>
          <div className="mt-6 text-left" aria-hidden>
            <CmpShape />
          </div>
        </Phase>

        {/* p1 — the growth engine */}
        <Phase on={grown} isStatic={staticLayout} className="flex flex-col justify-center">
          <GrowthCards />
        </Phase>
      </div>
    </div>
  );
}

/* ── Growth atoms — shared by desktop and the mobile staging ── */

function CmpProgress({ fill, litWeeks, dots = true }: { fill: string; litWeeks: number; dots?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3.5">
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>
          {EX.title}
        </p>
        <span className="text-[12px] font-black font-headline inline-flex items-center gap-1.5" style={{ color: "#16a34a" }}>
          Completed {CHECK("#16a34a", 12)}
        </span>
      </div>
      <div className="h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: fill,
            background: `linear-gradient(90deg, ${CYAN}, ${ORANGE})`,
            transition: `width 1500ms ${EASE}`,
          }}
        />
      </div>
      {dots && (
        <div className="flex items-center justify-between mt-3.5">
          {EX.arc.map((theme, i) => (
            <span key={theme} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / 6}%` }}>
              <span
                className="rounded-full"
                style={{
                  width: i < litWeeks ? 11 : 7,
                  height: i < litWeeks ? 11 : 7,
                  backgroundColor: i < litWeeks ? ORANGE : "rgba(15,34,41,0.14)",
                  boxShadow: i < litWeeks ? "0 0 0 3px rgba(255,97,48,0.15)" : undefined,
                  transition: `all 400ms ${EASE} ${i * 130}ms`,
                }}
              />
              <span className="text-[9px] uppercase tracking-widest font-headline" style={{ color: i < litWeeks ? ORANGE : FAINT, fontWeight: 800, transition: `color 400ms ${EASE} ${i * 130}ms` }}>
                W{i + 1}
              </span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

const ICON_REPEAT = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);
const ICON_RESHAPE = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M2 14h4M10 8h4M18 16h4" />
  </svg>
);
const ICON_ADD_EXPERT = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);
const ICON_GROW = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 7l-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

const CMP_OPTIONS = [
  { t: "Repeat it", d: "Same design, next run", icon: ICON_REPEAT, c: CYAN },
  { t: "Reshape it", d: "New terms — the agreement re-locks", icon: ICON_RESHAPE, c: ORANGE },
  { t: "New collaborator", d: "Invite another expert in", icon: ICON_ADD_EXPERT, c: CYAN },
];

function CmpShape({ stacked = false }: { stacked?: boolean }) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-[0.2em] font-headline mb-3" style={{ color: ORANGE, fontWeight: 800 }}>You shape the next run</p>
      <div className={stacked ? "space-y-2.5" : "grid grid-cols-3 gap-3"}>
        {CMP_OPTIONS.map(({ t, d, icon, c }) => (
          <div
            key={t}
            className={stacked ? "rounded-2xl px-4 py-3.5 flex items-center gap-3.5" : "rounded-2xl px-4 py-4"}
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 10px 26px rgba(15,34,41,0.07)" }}
          >
            <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${stacked ? "" : "mb-2.5"}`} style={{ backgroundColor: `${c}12` }}>
              {icon(c, 18)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-black font-headline leading-snug" style={{ color: INK }}>{t}</span>
              <span className="block text-[11px] font-bold leading-snug mt-0.5" style={{ color: MUTED }}>{d}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* The growth engine — three real opportunities, each with its own living
 * micro-visual (not a text list): the tribe re-enrolling, new people
 * arriving, the next experience opening. */
function GrowthCards({ stacked = false }: { stacked?: boolean }) {
  const shell = "h-full rounded-3xl p-6 flex flex-col text-left";
  const initials = ["A", "S", "L", "J"];
  return (
    <div className={stacked ? "space-y-4" : "grid sm:grid-cols-3 gap-5 items-stretch"} aria-hidden>
      {/* 1 — Retention, built in */}
      <div className={shell} style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1.5px rgba(255,97,48,0.30), 0 20px 50px rgba(15,34,41,0.12)` }}>
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.10)" }}>
          {ICON_REPEAT(ORANGE, 21)}
        </span>
        <p className="text-[16.5px] font-headline leading-snug mt-4" style={{ color: INK, fontWeight: 800 }}>Retention, built in</p>
        <p className="text-[13px] font-semibold mt-1.5 leading-snug" style={{ color: MUTED }}>
          Your tribe re-enrolls in one tap — the space and the momentum carry over.
        </p>
        <div className="flex items-center gap-2.5 mt-5">
          <span className="flex -space-x-1.5">
            {initials.map((m, i) => (
              <span key={m} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: i % 2 ? "rgba(8,145,178,0.14)" : "rgba(255,97,48,0.14)", color: i % 2 ? CYAN : ORANGE, fontWeight: 800, border: "2px solid #FFFFFF" }}>
                {m}
              </span>
            ))}
          </span>
          <span className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", fontWeight: 800 }}>
            {CHECK("#16a34a", 11)} Re-enrolled
          </span>
        </div>
        <span className="self-start mt-4 px-4 py-2 rounded-full text-white text-[12px] font-black font-headline" style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}>
          Enroll in Run 2 →
        </span>
      </div>

      {/* 2 — New people join */}
      <div className={shell} style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px rgba(15,34,41,0.06), 0 20px 50px rgba(15,34,41,0.10), inset 4px 0 0 ${CYAN}` }}>
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
          {ICON_ADD_EXPERT(CYAN, 21)}
        </span>
        <p className="text-[16.5px] font-headline leading-snug mt-4" style={{ color: INK, fontWeight: 800 }}>New people join</p>
        <p className="text-[13px] font-semibold mt-1.5 leading-snug" style={{ color: MUTED }}>
          Promote the next run — new faces land in the same space. Ongoing momentum.
        </p>
        <div className="flex items-center gap-2.5 mt-5">
          <span className="flex -space-x-1.5">
            {["N", "E"].map((m) => (
              <span key={m} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: "rgba(8,145,178,0.14)", color: CYAN, fontWeight: 800, border: "2px solid #FFFFFF" }}>
                {m}
              </span>
            ))}
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: "#FFFFFF", color: CYAN, fontWeight: 800, border: `1.5px dashed ${CYAN}66` }}>
              +5
            </span>
          </span>
          <span className="text-[10.5px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 800 }}>
            Joining Run 2
          </span>
        </div>
      </div>

      {/* 3 — Open a progression experience */}
      <div className={shell} style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px rgba(15,34,41,0.06), 0 20px 50px rgba(15,34,41,0.10), inset 4px 0 0 ${ORANGE}` }}>
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.10)" }}>
          {ICON_GROW(ORANGE, 21)}
        </span>
        <p className="text-[16.5px] font-headline leading-snug mt-4" style={{ color: INK, fontWeight: 800 }}>Open a progression experience</p>
        <p className="text-[13px] font-semibold mt-1.5 leading-snug" style={{ color: MUTED }}>
          The natural next step — keep this run going, grow your portfolio, take your tribe further.
        </p>
        <div className="flex items-center gap-2 mt-5">
          <span className="px-3 py-1.5 rounded-full text-[10.5px] font-headline" style={{ backgroundColor: "rgba(15,34,41,0.05)", color: MUTED, fontWeight: 800 }}>
            Reset ✓
          </span>
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" className="shrink-0" aria-hidden>
            <path d="M1 5h13M11 1l4 4-4 4" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="px-3 py-1.5 rounded-full text-[10.5px] font-headline" style={{ backgroundColor: "rgba(255,97,48,0.10)", color: ORANGE, fontWeight: 800 }}>
            Next: Performance
          </span>
        </div>
      </div>
    </div>
  );
}

/* Mobile staging — p0 the run wraps (completed W1→W6 + shape the next),
 * p1 the growth engine. */
function CompoundFrameMobile({ phase }: { phase: number }) {
  const p = Math.min(phase, 1);
  // the bar's sweep to full must be SEEN — arm it after mount
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    if (p !== 0) {
      setGrow(false);
      return;
    }
    const t = window.setTimeout(() => setGrow(true), 450);
    return () => window.clearTimeout(t);
  }, [p]);

  return (
    <div className="w-full max-w-md mx-auto">
      <Enter key={p}>
        {p === 0 && (
          <div className="space-y-4 text-left" aria-hidden>
            <div className="rounded-3xl p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
              <CmpProgress fill={grow ? "100%" : "8%"} litWeeks={grow ? 6 : 1} />
            </div>
            <div><CmpShape stacked /></div>
          </div>
        )}
        {p === 1 && <GrowthCards stacked />}
      </Enter>
    </div>
  );
}

/* The outro beat is gone by design: Act 2 ends on the retention loop and
   releases straight into the Finale, which opens with the question
   ("Ready to join the movement?") and answers it in the same viewport. */

/* ══ Frame 0 · Intro ════════════════════════════════════════ */
function IntroFrame() {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: CYAN, fontWeight: 700 }}>
        Inside the experience
      </p>
      {/* second half of the couplet — the participant's transformation,
         cliffhung before the living-experience story that proves it */}
      <h2 className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.08] mb-6" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        From content to <span style={{ color: CYAN }}>experience.</span>
      </h2>
      <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
        What you published isn&apos;t a static product or a video library —
        it&apos;s a room where you build your tribe and show up together.
        The rhythm is built in — your tribe brings it to life.
      </p>
    </div>
  );
}

/* ══ The chapter ════════════════════════════════════════════ */
export function LiveWeek() {
  // Mobile staging flag — same breakpoint the engine's scrub mode uses.
  // false on the server and first client render; the swap to the mobile
  // beat map + stagings happens post-hydration, below the fold, invisible.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setIsMobile(true);
  }, []);

  const beats = isMobile ? BEATS_M : BEATS;
  const bounds = computeBounds(beats);
  const stepSpan: [number, number] = [bounds[1][0], bounds[bounds.length - 1][1]];
  const peakBeat = beats.findIndex((b) => b.f === 3 && b.p === 2);
  const firstBeatOf = (f: number) => beats.findIndex((b) => b.f === f);

  const { beat, pinned, wrapperRef, jumpToBeat, runwayVh } = useBeatChapter({ beats });

  // the beat index can momentarily exceed the map during the swap
  const cur = beats[Math.min(beat, beats.length - 1)];
  const frame = cur.f;
  const phase = cur.p;
  const peak = frame === 3 && phase === 2;

  const railMid = bounds[Math.min(beat, beats.length - 1)][0] + cur.w / 2;
  const railSp = Math.min(1, Math.max(0, (railMid - stepSpan[0]) / (stepSpan[1] - stepSpan[0])));

  // mobile rail: fill of the CURRENT step's segment = beat position within
  // the frame's own beats (count-based — calm, one notch per swipe)
  const frameFirst = firstBeatOf(frame);
  const frameCount = beats.filter((b) => b.f === frame).length;
  const frameProgress = frameCount > 0 ? (beat - frameFirst + 1) / frameCount : 0;

  if (!pinned) {
    const staticHead = (f: number, p: number) => {
      const h = LW_HEADS[f]?.[Math.min(p, (LW_HEADS[f]?.length ?? 1) - 1)];
      if (!h) return null;
      return (
        <div className="mb-8 text-center">
          <h3 className="text-[1.85rem] leading-[1.15] md:text-[2.6rem] md:leading-[1.12] font-headline tracking-tight mb-3.5 max-w-3xl mx-auto" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {h.title}
          </h3>
          {h.copy && <p className="text-[15px] md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>{h.copy}</p>}
        </div>
      );
    };
    return (
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="py-8"><IntroFrame /></div>
          <div className="py-12">{staticHead(1, 0)}<SpaceFrame phase={1} /></div>
          <div className="py-12">{staticHead(2, 0)}<HandsFrame phase={0} staticLayout /></div>
          <div className="py-12">{staticHead(2, 1)}<HandsFrame phase={1} staticLayout /></div>
          <div className="py-12">{staticHead(2, 3)}<HandsFrame phase={3} staticLayout /></div>
          {/* The join moment — on the static story the room really is open:
             the CTA carries straight to the finale. */}
          <div className="py-12">
            {staticHead(3, 1)}
            <LoopFrame
              phase={1}
              staticLayout
              onJoin={() => {
                const el = document.getElementById("join");
                if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top, behavior: "instant" });
              }}
            />
          </div>
          <div className="py-12">{staticHead(3, 3)}<LoopFrame phase={3} onJoin={() => {}} staticLayout /></div>
          <div className="py-12">{staticHead(4, 1)}<CompoundFrame phase={1} active staticLayout /></div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* breathing gap between the two chapters — the waves, alone */}
      <div className="h-[26vh]" aria-hidden />
      <div ref={wrapperRef} className="relative" style={{ height: `${runwayVh}vh` }}>
        <div
          className="sticky top-0 w-full overflow-hidden h-screen"
          style={{ height: "100dvh", backgroundColor: peak ? TEAL : "rgba(12,38,46,0)", transition: `background-color 500ms ${EASE}` }}
        >
          {/* Mechanics rail — desktop (stays through the peak; colors adapt to
             the dark background so the swipe progress keeps reading) */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-4" style={{ opacity: frame >= 1 && frame <= 4 ? 1 : 0, transition: "opacity 400ms ease" }}>
            <div className="relative w-[3px] rounded-full" style={{ backgroundColor: peak ? "rgba(246,243,236,0.20)" : "rgba(15,34,41,0.12)", transition: `background-color 400ms ${EASE}` }}>
              <div className="absolute top-0 left-0 w-full rounded-full" style={{ height: `${(railSp * 100).toFixed(1)}%`, backgroundColor: ORANGE, boxShadow: "0 0 10px rgba(255,97,48,0.35)", transition: `height 600ms ${EASE}` }} />
            </div>
            <div className="flex flex-col justify-between gap-10 py-1">
              {RAIL.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => jumpToBeat(firstBeatOf(s.frame))}
                  className="flex items-center gap-4 text-left transition-opacity duration-300"
                  style={{ opacity: frame === s.frame ? 1 : 0.42 }}
                >
                  <span
                    className="shrink-0 w-3 h-3 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: frame === s.frame ? ORANGE : peak ? "rgba(246,243,236,0.38)" : "rgba(15,34,41,0.22)",
                      boxShadow: frame === s.frame ? "0 0 14px rgba(255,97,48,0.45)" : undefined,
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: frame === s.frame ? ORANGE : peak ? "rgba(246,243,236,0.55)" : FAINT, fontWeight: 800, transition: `color 400ms ${EASE}` }}>
                      {s.n}
                    </span>
                    <span className="block text-[17px] font-headline leading-tight whitespace-nowrap" style={{ color: peak ? LIGHT : INK, fontWeight: 700, transition: `color 400ms ${EASE}` }}>
                      {s.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Story rail — mobile (persistent scaffolding below the fixed nav) */}
          <MobileRail
            steps={RAIL.map((s) => ({ n: s.n, label: s.label, frame: s.frame }))}
            frame={frame}
            progress={frameProgress}
            light={peak}
            onStep={(f) => jumpToBeat(firstBeatOf(f))}
          />

          {/* Frames — hard cuts, one visible at a time. Railed frames anchor
             their title in the shared TitleZone (fixed height, right under
             the rail) and center only the CONTENT in the remaining space —
             the words change, the layout never jumps. The peak stays in the
             same position, dramatized only by the background shift. */}
          {[0, 1, 2, 3, 4].map((f) => {
            const active = frame === f;
            // The rail gutter applies only to railed frames — the intro
            // centers on the full page, like the rail isn't there (it isn't).
            const railed = f >= 1 && f <= 4;
            const headIdx = Math.min(active ? phase : 0, (LW_HEADS[f]?.length ?? 1) - 1);
            const head = LW_HEADS[f]?.[headIdx];
            return (
              <div
                key={f}
                aria-hidden={!active}
                // Below lg the content box is 100svh — STABLE while the URL
                // bar collapses (dvh dances, svh doesn't), so AutoFit's box
                // never changes mid-scroll and nothing rescales. The dvh
                // stage behind still fills the screen. pt clears the rail.
                className={`absolute inset-x-0 top-0 h-svh lg:inset-0 lg:h-auto z-10 flex flex-col items-center text-center ${railed ? "pt-[9.75rem] pb-6 lg:pt-24 lg:pb-14 px-5 sm:px-8 lg:pl-64 lg:pr-16" : "justify-center pt-28 pb-10 lg:pt-24 lg:pb-14 px-5 sm:px-8"}`}
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "none" : "translateY(12px)",
                  // hidden, not just opacity 0 — opacity keeps the subtree's
                  // buttons tabbable (an invisible CTA could take focus);
                  // visibility drops the whole subtree from hit-testing and
                  // tab order. The 160ms delay lets the fade-out finish.
                  visibility: active ? "visible" : "hidden",
                  transition: active
                    ? `opacity ${CUT_MS}ms ${EASE} 70ms, transform ${CUT_MS}ms ${EASE} 70ms, visibility 0s`
                    : `opacity 160ms ${EASE}, transform 160ms ${EASE}, visibility 0s 160ms`,
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                {railed && head && (
                  <TitleZone k={`${f}-${headIdx}`} title={head.title} copy={head.copy} light={!!head.light && active} />
                )}
                <div className="w-full max-w-5xl mx-auto flex-1 min-h-0 flex flex-col">
                  <AutoFit>
                    {f === 0 && <IntroFrame />}
                    {f === 1 && (isMobile ? <SpaceFrameMobile phase={active ? phase : 0} /> : <SpaceFrame phase={active ? phase : 0} />)}
                    {f === 2 && (isMobile ? <HandsFrameMobile phase={active ? phase : 0} /> : <HandsFrame phase={active ? phase : 0} />)}
                    {f === 3 && (isMobile ? <LoopFrameMobile phase={active ? phase : 0} onJoin={() => jumpToBeat(peakBeat)} /> : <LoopFrame phase={active ? phase : 0} onJoin={() => jumpToBeat(peakBeat)} />)}
                    {f === 4 && (isMobile ? <CompoundFrameMobile phase={active ? phase : 0} /> : <CompoundFrame phase={active ? phase : 0} active={active} />)}
                  </AutoFit>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
