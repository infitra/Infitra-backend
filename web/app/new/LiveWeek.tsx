"use client";

import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";
import { type BeatDef, useBeatChapter, computeBounds, Pop, CUT_MS, CASCADE_MS, EASE, FIT } from "./chapterEngine";

/**
 * ACT 2 · DESIGNED TO FEEL ALIVE — the mechanics chapter.
 *
 * Not a scripted week (that would quietly claim the outcome) — a
 * demonstration of the MACHINE that invites engagement. Real people bring
 * the life; the space gives them every reason and every rail. Each beat is
 * one mechanic doing its job, cause → visible effect: sessions land in the
 * calendar (and open into the live room), built-in prompts fill the tribe
 * feed, and a question asked inside a post makes the full round-trip —
 * member composer → creator's bell + console → answered once, pinned for
 * all. Every surface is a port of the real product UI (bell dropdown,
 * WAITING ON YOU console card, the QUESTION FOR / ANSWERED BY post — with
 * Alex's real answer copy).
 */

/* ── The beats — one mechanic per frame ────────────────────── */
const BEATS: BeatDef[] = [
  { f: 0, p: 0, w: 1 }, // intro
  { f: 1, p: 0, w: 1.1 }, // the space, real
  { f: 2, p: 0, w: 1 }, // your calendar
  { f: 2, p: 1, w: 1.1 }, // — one click into the room
  { f: 3, p: 0, w: 1 }, // the feed's drivers
  { f: 3, p: 1, w: 1.1 }, // — the feed fills
  { f: 4, p: 0, w: 1 }, // ask: member composer
  { f: 4, p: 1, w: 1.1 }, // ask: it finds the creator
  { f: 4, p: 2, w: 1.1 }, // ask: answered once
  { f: 5, p: 0, w: 1.8 }, // outro — alive by design
];
const BOUNDS = computeBounds(BEATS);
const STEP_SPAN: [number, number] = [BOUNDS[1][0], BOUNDS[8][1]];

const RAIL = [
  { n: "01", label: "The space", frame: 1, firstBeat: 1 },
  { n: "02", label: "Your calendar", frame: 2, firstBeat: 2 },
  { n: "03", label: "The tribe feed", frame: 3, firstBeat: 4 },
  { n: "04", label: "Ask your expert", frame: 4, firstBeat: 6 },
];

/* ── Small shared bits ─────────────────────────────────────── */
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

const ICON_MIC = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v4" />
  </svg>
);

const ICON_CAM = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" />
  </svg>
);

const ICON_LEAVE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.7 5.8A15 15 0 0 1 12 5.7c5.5 0 10 2.7 10 6 0 .9-.3 1.7-.9 2.4l-3.4-1.4v-2.2a13 13 0 0 0-11.4 0v2.2L2.9 14.1A3.6 3.6 0 0 1 2 11.7c0-3.3 4.5-6 10-6z" />
  </svg>
);

const ICON_HEART = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ICON_COMMENT = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3.1-.4-4.4-1.2L3 20l1.2-5.1A8.5 8.5 0 1 1 21 11.5z" />
  </svg>
);

/** Light-world step head. */
function MechHead({ kicker, accent, title, copy }: { kicker: string; accent: string; title: string; copy?: string }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: accent, fontWeight: 800 }}>
        {kicker}
      </p>
      <h3 className="text-3xl md:text-[2.6rem] md:leading-[1.12] font-headline tracking-tight mb-4 max-w-3xl mx-auto" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      {copy && (
        <p className="text-[15.5px] md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
          {copy}
        </p>
      )}
    </div>
  );
}

/** Member / creator perspective chip. */
function ViewChip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color, backgroundColor: `${color}14`, fontWeight: 800 }}>
      {label}
    </span>
  );
}

/* ── The space's REAL header — the anchor of truth ─────────── */
function SpaceHeader() {
  return (
    <div style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
      <div className="flex items-stretch gap-4 px-4 sm:px-5 pt-4 pb-3">
        <span className="relative shrink-0 w-24 sm:w-28 rounded-xl overflow-hidden hidden sm:block" style={{ backgroundColor: INK }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </span>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[16px] sm:text-[18px] font-headline tracking-tight leading-snug" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.015em" }}>
            {EX.title}
          </p>
          <span className="flex items-center gap-1.5 mt-1">
            <span className="flex -space-x-1.5">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="w-5 h-5 rounded-full overflow-hidden" style={{ border: "1.5px solid #FFFFFF" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                </span>
              ))}
            </span>
            <span className="text-[11px] font-bold" style={{ color: MUTED }}>
              with <span style={{ color: INK }}>{ALEX.name} &amp; {MIRA.name}</span>
            </span>
          </span>
          <span className="flex flex-wrap gap-1.5 mt-2.5">
            {["Meet your Experts", "Structure"].map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-headline" style={{ color: INK, backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.10)", fontWeight: 800 }}>
                {c} <span style={{ color: FAINT }}>{CHEVRON_DOWN}</span>
              </span>
            ))}
          </span>
        </div>
        <div className="shrink-0 text-right flex flex-col items-end justify-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-headline" style={{ color: "#ef4444", fontWeight: 800 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            Live · Week {ROOM.week} of {EX.weeks}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
              <span className="text-[8px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>A</span>
              <span className="absolute -bottom-0 -right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e", border: "1px solid #FFF" }} />
            </span>
            <span className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: MUTED, fontWeight: 800 }}>
              Active now <span style={{ color: INK }}>{ROOM.activeNow}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Session row ───────────────────────────────────────────── */
function SessionRow({ img, title, host, state, right }: { img: string; title: string; host: string; state: "done" | "next" | "upcoming"; right?: string }) {
  const isNext = state === "next";
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-2.5"
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
        <span className="block text-[12.5px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>{title}</span>
        <span className="block text-[9.5px] font-bold" style={{ color: FAINT }}>{host}</span>
      </span>
      <span className="shrink-0">
        {state === "done" && (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-headline" style={{ color: MUTED, fontWeight: 800 }}>
            {CHECK(CYAN, 11)} Done
          </span>
        )}
        {state === "next" && <span className="text-[11px] font-black font-headline" style={{ color: ORANGE }}>{right ?? ROOM.next.inLabel}</span>}
        {state === "upcoming" && (
          <span className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
            Upcoming
          </span>
        )}
      </span>
    </div>
  );
}

/* ── The journey block ─────────────────────────────────────── */
function Journey({ week, theme }: { week: number; theme: string }) {
  return (
    <div className="text-left">
      <p className="text-[8px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>The journey</p>
      <p className="font-headline leading-none mt-1" style={{ fontWeight: 800, letterSpacing: "-0.02em" }} aria-hidden>
        <span className="text-[27px]" style={{ color: INK }}>WEEK {week} </span>
        <span className="text-[27px]" style={{ color: "rgba(15,34,41,0.18)" }}>OF {EX.weeks}</span>
      </p>
      <p className="text-[10px] uppercase tracking-[0.16em] font-headline mt-1" style={{ color: ORANGE, fontWeight: 800 }}>{theme}</p>
      <div className="flex items-center gap-1 mt-3" aria-hidden>
        {EX.arc.map((_, i) => (
          <span key={i} className="flex items-center flex-1 last:flex-none">
            <span
              className="shrink-0 rounded-full"
              style={
                i === week - 1
                  ? { width: 12, height: 12, backgroundColor: ORANGE, boxShadow: "0 0 0 3px rgba(255,97,48,0.20)" }
                  : { width: 7, height: 7, backgroundColor: i < week - 1 ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.14)" }
              }
            />
            {i < EX.arc.length - 1 && <span className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.10)" }} />}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Tribe post ────────────────────────────────────────────── */
function TribePost({ initial, color, name, when, text, chip }: { initial: string; color: string; name: string; when: string; text: string; chip?: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
      <div className="flex gap-2">
        <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
          <span className="text-[9px] font-headline" style={{ color, fontWeight: 800 }}>{initial}</span>
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-headline" style={{ color: INK, fontWeight: 800 }}>
            {name} <span style={{ color: FAINT, fontWeight: 600 }}>· {when}</span>
          </p>
          <p className="text-[11px] leading-snug" style={{ color: MUTED }}>{text}</p>
          {chip && (
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[8px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
              {chip}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 1 · The space, real ══════════════════════════════ */
function SpaceFrame() {
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      <MechHead
        kicker="01 · The space"
        accent={CYAN}
        title="The room your tribe lives in."
        copy="Not a video library — the space you published, live in its second week."
      />
      <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
        <SpaceHeader />
        <div className="p-4 sm:p-5" style={{ backgroundColor: "#FAF8F3" }}>
          <Journey week={ROOM.week} theme={ROOM.theme} />
          <div className="space-y-1.5 mt-3">
            <SessionRow img={ROOM.done.img} title={ROOM.done.title} host={ROOM.done.host} state="done" />
            <SessionRow img={ROOM.next.img} title={ROOM.next.title} host={ROOM.next.host} state="next" right="Tue · 13:00" />
            <SessionRow img={ROOM.upcoming.img} title={ROOM.upcoming.title} host={ROOM.upcoming.host} state="upcoming" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 2 · Your calendar → the live room ════════════════ */

const CAL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const CAL_ENTRIES: Record<string, { title: string; color: string; hot?: boolean }> = {
  Mon: { title: ROOM.done.title, color: CYAN },
  Tue: { title: ROOM.next.title, color: ORANGE, hot: true },
  Thu: { title: ROOM.upcoming.title, color: CYAN },
};

function CalendarFrame({ phase }: { phase: number }) {
  const live = phase >= 1;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      {/* two-state head */}
      <div className="relative mb-8" style={{ minHeight: 150 }}>
        <div className="absolute inset-x-0 top-0" style={{ opacity: live ? 0 : 1, transition: `opacity ${CUT_MS}ms ${EASE}` }}>
          <MechHead
            kicker="02 · Your calendar"
            accent={ORANGE}
            title="Every session lands in your calendar."
            copy="Synced the moment someone joins — 20 live moments, never missed."
          />
        </div>
        <div className="absolute inset-x-0 top-0" style={{ opacity: live ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 80ms` }}>
          <MechHead
            kicker="And when it's time"
            accent="#ef4444"
            title="One click into the room."
            copy="No links, no logins — the room opens from the space."
          />
        </div>
      </div>

      <div className="relative" style={{ minHeight: 420 }}>
        {/* state 1 — the calendar week */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: live ? 0 : 1, transform: live ? "translateY(-14px)" : "none", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: "none" }}
        >
          <div className="rounded-3xl p-5" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>
                Your calendar · Week {ROOM.week}
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
                {CHECK("#16a34a", 10)} Synced · all {EX.sessions} sessions
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {CAL_DAYS.map((d) => {
                const e = CAL_ENTRIES[d];
                return (
                  <div key={d} className="min-h-[104px] rounded-xl p-1.5 flex flex-col" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.04)" }}>
                    <span className="text-[8.5px] uppercase tracking-widest font-headline text-center" style={{ color: FAINT, fontWeight: 800 }}>{d}</span>
                    {e && (
                      <div
                        className="mt-1.5 rounded-lg px-1.5 py-1.5 text-left"
                        style={{
                          backgroundColor: `${e.color}${e.hot ? "14" : "0D"}`,
                          boxShadow: e.hot ? `0 0 0 1.5px ${e.color}4D` : `inset 2px 0 0 ${e.color}`,
                        }}
                      >
                        <span className="block text-[8px] font-black font-headline" style={{ color: e.color }}>13:00</span>
                        <span className="block text-[8.5px] font-bold leading-tight mt-0.5" style={{ color: INK }}>{e.title}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[10.5px] font-bold font-headline mt-4 text-center" style={{ color: FAINT }}>
              With reminders — the structure follows your tribe out of the app.
            </p>
          </div>
        </div>

        {/* state 2 — the live room, everyone an equal tile */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: live ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 100ms`, pointerEvents: "none" }}
        >
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }} aria-hidden>
            <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-headline min-w-0" style={{ fontWeight: 800 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                <span className="truncate" style={{ color: "#FFFFFF" }}>Live — {ROOM.next.title}</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-headline shrink-0" style={{ color: "#9CF0FF", fontWeight: 800 }}>
                8 in the room · Week {ROOM.week} of {EX.weeks}
              </span>
            </div>
            <div className="p-3 grid grid-cols-4 gap-2">
              {[
                { kind: "host" as const, p: ALEX, color: ORANGE },
                { kind: "member" as const, i: "A" },
                { kind: "member" as const, i: "S" },
                { kind: "host" as const, p: MIRA, color: CYAN },
                { kind: "member" as const, i: "L" },
                { kind: "member" as const, i: "J" },
                { kind: "member" as const, i: "M" },
                { kind: "member" as const, i: "E" },
              ].map((t, idx) =>
                t.kind === "host" ? (
                  <div key={idx} className="relative aspect-[16/11] rounded-xl overflow-hidden" style={{ backgroundColor: "#16323b" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full text-[7px] font-headline" style={{ backgroundColor: "rgba(15,34,41,0.75)", color: "#FFFFFF", fontWeight: 800 }}>
                      {t.p.first} · <span style={{ color: t.color }}>HOST</span>
                    </span>
                  </div>
                ) : (
                  <div key={idx} className="aspect-[16/11] rounded-xl flex items-center justify-center" style={{ backgroundColor: "#16323b" }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: "rgba(156,240,255,0.12)", color: "#9CF0FF", fontWeight: 800 }}>
                      {t.i}
                    </span>
                  </div>
                ),
              )}
            </div>
            <div className="flex items-center justify-center gap-2.5 pb-3.5 pt-0.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>{ICON_MIC}</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>{ICON_CAM}</span>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.85)" }}>{ICON_LEAVE}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 3 · What fills the feed ══════════════════════════ */
function FeedFrame({ phase }: { phase: number }) {
  const filled = phase >= 1;
  return (
    <div className={`w-full max-w-4xl mx-auto ${FIT}`}>
      <MechHead
        kicker="03 · The tribe feed"
        accent={CYAN}
        title="The feed doesn't wait for luck."
        copy="Built-in prompts do the asking — a pulse before each session, a reflection after, sharing anytime. Watch them fill it."
      />
      <div className="grid md:grid-cols-[1fr_1.1fr] gap-4 items-start text-left" aria-hidden>
        {/* the drivers */}
        <div className="space-y-3">
          {[
            {
              k: "Pulse · before each session",
              color: ORANGE,
              body: (
                <>
                  <p className="text-[12.5px] font-bold font-headline leading-snug" style={{ color: INK }}>
                    {ROOM.next.title} — how ready are you?
                  </p>
                  <div className="mt-2.5 relative h-1.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "80%", backgroundColor: CYAN }} />
                    <span className="absolute -top-[4px] w-3.5 h-3.5 rounded-full" style={{ left: "77%", backgroundColor: "#FFFFFF", boxShadow: `0 0 0 2px ${CYAN}` }} />
                  </div>
                </>
              ),
              delay: 250,
            },
            {
              k: "Reflection · after each session",
              color: CYAN,
              body: (
                <p className="text-[12.5px] font-bold font-headline leading-snug" style={{ color: INK }}>
                  How was &ldquo;{ROOM.next.title}&rdquo;?
                </p>
              ),
              delay: 250 + CASCADE_MS,
            },
            {
              k: "Share · anytime",
              color: CYAN,
              body: (
                <div className="rounded-full px-3.5 py-2 text-[10.5px]" style={{ backgroundColor: "#F8F6F0", color: FAINT }}>
                  Share with your Tribe…
                </div>
              ),
              delay: 250 + CASCADE_MS * 2,
            },
          ].map(({ k, color, body, delay }) => (
            <div
              key={k}
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "#FFFFFF",
                boxShadow: filled
                  ? `0 0 0 2px ${color}59, 0 12px 30px rgba(15,34,41,0.08), inset 3.5px 0 0 ${color}`
                  : "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + color,
                transition: `box-shadow ${CUT_MS}ms ${EASE} ${delay}ms`,
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.16em] font-headline mb-1.5" style={{ color, fontWeight: 800 }}>{k}</p>
              {body}
            </div>
          ))}
        </div>

        {/* the effect — the feed */}
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>The tribe feed</p>
          <Pop show={filled} d={250}>
            <TribePost initial="L" color={ORANGE} name="Lea" when="12:04" text="Ready! Legs still remembering Monday though 😅" chip="Pulse · 8/10" />
          </Pop>
          <Pop show={filled} d={250 + CASCADE_MS}>
            <TribePost initial="A" color={CYAN} name="Anna" when="14:12" text="That last set — didn't think I had it in me. This group 🔥" chip="Energy after · 9/10" />
          </Pop>
          <Pop show={filled} d={250 + CASCADE_MS * 2}>
            <TribePost initial="S" color={ORANGE} name="Sam" when="16:40" text="Meal-prepped Mira's plate formula for the week. Photo in the thread ✓" />
          </Pop>
          <Pop show={filled} d={250 + CASCADE_MS * 3}>
            <p className="text-[10.5px] font-bold font-headline text-center pt-1" style={{ color: FAINT }}>
              Every prompt becomes a post — the feed keeps its own rhythm.
            </p>
          </Pop>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 4 · Ask your expert — the full round-trip ════════ */
function AskFrame({ phase }: { phase: number }) {
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      {/* three-state head */}
      <div className="relative mb-8" style={{ minHeight: 150 }}>
        {[
          {
            on: phase === 0,
            kicker: "04 · Ask your expert — member view",
            accent: CYAN,
            title: "Any post can carry a question.",
            copy: "Attached inside the post — routed to the expert who owns the topic.",
          },
          {
            on: phase === 1,
            kicker: "04 · Ask your expert — creator view",
            accent: ORANGE,
            title: "It finds you.",
            copy: "In your bell and on your console — nothing slips through.",
          },
          {
            on: phase >= 2,
            kicker: "04 · Ask your expert",
            accent: CYAN,
            title: "Answered once. Everyone learns.",
            copy: "Pinned inside the post — visible to the whole tribe.",
          },
        ].map((h, i) => (
          <div key={i} className="absolute inset-x-0 top-0" style={{ opacity: h.on ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} ${h.on ? 80 : 0}ms` }}>
            <MechHead kicker={h.kicker} accent={h.accent} title={h.title} copy={h.copy} />
          </div>
        ))}
      </div>

      <div className="relative" style={{ minHeight: 430 }}>
        {/* state 1 — the composer, the mechanic in hand */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase === 0 ? 1 : 0, transform: phase === 0 ? "none" : "translateY(-14px)", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: "none" }}
        >
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-3 text-left"><ViewChip label="Member view · Tim" color={CYAN} /></div>
            <div className="rounded-2xl p-5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
                  <span className="text-[11px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>T</span>
                </span>
                <span className="text-[12px] font-headline" style={{ color: INK, fontWeight: 800 }}>New post</span>
              </div>
              <div className="rounded-2xl px-4 py-3.5" style={{ backgroundColor: "#F8F6F0" }}>
                <p className="text-[13px] leading-snug" style={{ color: INK, fontWeight: 600 }}>
                  {ROOM.qa.question}
                </p>
              </div>
              {/* THE mechanic — the attached, routed question */}
              <div className="mt-3 rounded-xl px-3.5 py-2.5 flex items-center gap-2" style={{ backgroundColor: "rgba(8,145,178,0.07)", boxShadow: `inset 3px 0 0 ${CYAN}, 0 0 0 1.5px ${CYAN}40` }}>
                <span className="text-[9px] uppercase tracking-[0.16em] font-headline shrink-0" style={{ color: CYAN, fontWeight: 800 }}>
                  Question for
                </span>
                <span className="w-[18px] h-[18px] rounded-full overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <span className="text-[12px] font-headline" style={{ color: INK, fontWeight: 800 }}>{ALEX.name}</span>
                <span className="ml-auto text-[9px] font-bold shrink-0" style={{ color: FAINT }}>routed ✓</span>
              </div>
              <div className="flex items-center justify-between mt-3.5">
                <span className="text-[10px] font-bold" style={{ color: FAINT }}>Ask an expert · attach to any post</span>
                <span className="px-5 py-2 rounded-full text-white text-[11px] font-black font-headline" style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}>
                  Post
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* state 2 — the creator's bell + console */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase === 1 ? 1 : 0, transform: phase === 1 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-3 text-left"><ViewChip label={`Creator view · ${ALEX.first}`} color={ORANGE} /></div>
            <div className="rounded-2xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
              {/* console top bar with the bell */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: "#FAF8F3", borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="px-3.5 py-1.5 rounded-full text-white text-[9.5px] uppercase tracking-widest font-headline" style={{ backgroundColor: ORANGE, fontWeight: 800 }}>
                  + Create
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="relative">
                    {ICON_BELL(INK, 16)}
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ORANGE, border: "1.5px solid #FAF8F3" }} />
                  </span>
                  <span className="text-[11px] font-headline" style={{ color: INK, fontWeight: 800 }}>{ALEX.name}</span>
                </span>
              </div>
              {/* the notifications dropdown — real port */}
              <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.16em] font-headline" style={{ color: INK, fontWeight: 800 }}>Notifications</span>
                <span className="text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Mark all read</span>
              </div>
              <div className="px-2 pb-2">
                <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: `inset 3px 0 0 ${ORANGE}` }}>
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
                    <span className="text-[10px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>T</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{ROOM.qa.asker} asked you a question</span>
                    <span className="block text-[10.5px] mt-0.5" style={{ color: MUTED }}>Open your Tribe to answer</span>
                  </span>
                  <span className="shrink-0 text-[9px] font-bold" style={{ color: FAINT }}>just now</span>
                </div>
                <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 mt-1 opacity-60" style={{ boxShadow: `inset 3px 0 0 ${CYAN}` }}>
                  <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{MIRA.name} accepted the terms</span>
                    <span className="block text-[10.5px] mt-0.5 truncate" style={{ color: MUTED }}>When everyone has accepted, you can publish</span>
                  </span>
                  <span className="shrink-0 text-[9px] font-bold" style={{ color: FAINT }}>19h</span>
                </div>
              </div>
            </div>
            {/* the console card — WAITING ON YOU */}
            <div className="mt-3 rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
              <p className="text-[9px] uppercase tracking-[0.2em] font-headline mb-2" style={{ color: FAINT, fontWeight: 800 }}>Needs you</p>
              <div className="rounded-xl px-3.5 py-2.5 flex items-center justify-between" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30)" }}>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Waiting on you</span>
                  <span className="block text-[13px] font-black font-headline mt-0.5" style={{ color: INK }}>1 question</span>
                </span>
                <span className="text-[11px] font-black font-headline" style={{ color: ORANGE }}>Answer →</span>
              </div>
            </div>
          </div>
        </div>

        {/* state 3 — the answered post, real port */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase >= 2 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase >= 2 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
          <div className="rounded-2xl p-5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
                <span className="text-[11px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>T</span>
              </span>
              <span className="text-[12.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>{ROOM.qa.asker}</span>
              <span className="ml-auto text-[9.5px] font-bold" style={{ color: FAINT }}>just now</span>
            </div>
            <div className="mt-3 rounded-xl px-3.5 py-2 inline-flex items-center gap-2" style={{ backgroundColor: "rgba(8,145,178,0.07)", boxShadow: `inset 3px 0 0 ${CYAN}` }}>
              <span className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Question for</span>
              <span className="text-[12px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>{ALEX.name}</span>
            </div>
            <p className="text-[13.5px] leading-snug mt-2.5" style={{ color: INK, fontWeight: 600 }}>
              {ROOM.qa.question}
            </p>
            <Pop show={phase >= 2} d={250}>
              <div className="mt-3.5 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,97,48,0.06)", boxShadow: `inset 3.5px 0 0 ${ORANGE}` }}>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ORANGE}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                    Answered by {ALEX.name}
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: MUTED }}>
                  {ROOM.qa.answer}
                </p>
              </div>
            </Pop>
            <div className="flex items-center gap-4 mt-3.5 pt-3" style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: MUTED }}>{ICON_HEART(MUTED)} Like</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: MUTED }}>{ICON_COMMENT(MUTED)} 1</span>
              <span className="ml-auto text-[10px]" style={{ color: FAINT }}>Answered once — visible to the whole tribe.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 5 · Outro — alive by design ══════════════════════ */
function HandoffFrame({ active = true }: { active?: boolean }) {
  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <p className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.1]" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        Alive <span style={{ color: ORANGE }}>by design.</span>
      </p>
      <p className="text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
        The rhythm is built in — your tribe brings it to life.
      </p>
      <Pop show={active} d={400}>
        <div
          className="mt-9 mx-auto max-w-md rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left"
          style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.14), rgba(255,97,48,0.05))", boxShadow: "0 0 0 1px rgba(255,97,48,0.26)" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              And when the run wraps
            </p>
            <p className="text-[13px] font-black font-headline truncate mt-0.5" style={{ color: INK }}>
              The next one opens — the tribe carries over
            </p>
          </div>
          <span className="shrink-0 px-4 py-2 rounded-full text-white text-[11px] font-black font-headline" style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}>
            Join →
          </span>
        </div>
      </Pop>
    </div>
  );
}

/* ══ Frame 0 · Intro ════════════════════════════════════════ */
function IntroFrame() {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: CYAN, fontWeight: 700 }}>
        Inside the experience
      </p>
      <h2 className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.08] mb-6" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        Designed to feel alive.
      </h2>
      <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
        Real people bring the life — the space gives them every reason.
        These are the mechanics.
      </p>
    </div>
  );
}

/* ══ The chapter ════════════════════════════════════════════ */
export function LiveWeek() {
  const { beat, pinned, wrapperRef, jumpToBeat, runwayVh } = useBeatChapter({ beats: BEATS });

  const frame = BEATS[beat].f;
  const phase = BEATS[beat].p;

  const railMid = BOUNDS[beat][0] + BEATS[beat].w / 2;
  const railSp = Math.min(1, Math.max(0, (railMid - STEP_SPAN[0]) / (STEP_SPAN[1] - STEP_SPAN[0])));

  if (!pinned) {
    return (
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="py-8"><IntroFrame /></div>
          <div className="py-12"><SpaceFrame /></div>
          <div className="py-12"><CalendarFrame phase={1} /></div>
          <div className="py-12"><FeedFrame phase={1} /></div>
          <div className="py-12"><AskFrame phase={2} /></div>
          <div className="py-12"><HandoffFrame /></div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* breathing gap between the two chapters — the waves, alone */}
      <div className="h-[26vh]" aria-hidden />
      <div ref={wrapperRef} className="relative" style={{ height: `${runwayVh}vh` }}>
        <div className="sticky top-0 w-full overflow-hidden h-screen" style={{ height: "100dvh" }}>
          {/* Mechanics rail — desktop */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-4" style={{ opacity: frame >= 1 && frame <= 4 ? 1 : 0, transition: "opacity 400ms ease" }}>
            <div className="relative w-[3px] rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.12)" }}>
              <div className="absolute top-0 left-0 w-full rounded-full" style={{ height: `${(railSp * 100).toFixed(1)}%`, backgroundColor: ORANGE, boxShadow: "0 0 10px rgba(255,97,48,0.35)", transition: `height 600ms ${EASE}` }} />
            </div>
            <div className="flex flex-col justify-between gap-10 py-1">
              {RAIL.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => jumpToBeat(s.firstBeat)}
                  className="flex items-center gap-4 text-left transition-opacity duration-300"
                  style={{ opacity: frame === s.frame ? 1 : 0.42 }}
                >
                  <span
                    className="shrink-0 w-3 h-3 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: frame === s.frame ? ORANGE : "rgba(15,34,41,0.22)",
                      boxShadow: frame === s.frame ? "0 0 14px rgba(255,97,48,0.45)" : undefined,
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: frame === s.frame ? ORANGE : FAINT, fontWeight: 800 }}>
                      {s.n}
                    </span>
                    <span className="block text-[17px] font-headline leading-tight whitespace-nowrap" style={{ color: INK, fontWeight: 700 }}>
                      {s.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress dots — mobile */}
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: frame >= 1 && frame <= 4 ? 1 : 0, transition: "opacity 400ms ease" }}>
            {RAIL.map((s) => (
              <span key={s.frame} className="h-1.5 rounded-full transition-all duration-300" style={{ width: frame === s.frame ? 18 : 6, backgroundColor: frame === s.frame ? ORANGE : "rgba(15,34,41,0.20)" }} />
            ))}
          </div>

          {/* Frames — hard cuts, one visible at a time, all centered */}
          {[0, 1, 2, 3, 4, 5].map((f) => {
            const active = frame === f;
            return (
              <div
                key={f}
                aria-hidden={!active}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-64 lg:pr-16 pt-24 pb-14"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "none" : "translateY(12px)",
                  transition: active
                    ? `opacity ${CUT_MS}ms ${EASE} 70ms, transform ${CUT_MS}ms ${EASE} 70ms`
                    : `opacity 160ms ${EASE}, transform 160ms ${EASE}`,
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                <div className="w-full max-w-5xl mx-auto">
                  {f === 0 && <IntroFrame />}
                  {f === 1 && <SpaceFrame />}
                  {f === 2 && <CalendarFrame phase={active ? phase : 0} />}
                  {f === 3 && <FeedFrame phase={active ? phase : 0} />}
                  {f === 4 && <AskFrame phase={active ? phase : 0} />}
                  {f === 5 && <HandoffFrame active={active} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
