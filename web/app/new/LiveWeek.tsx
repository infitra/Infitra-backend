"use client";

import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";
import { type BeatDef, useBeatChapter, computeBounds, Pop, CUT_MS, CASCADE_MS, EASE, FIT } from "./chapterEngine";

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
  { f: 4, p: 1, w: 1.2 }, // — the retention loop opens
  { f: 5, p: 0, w: 1.5 }, // outro
];
const BOUNDS = computeBounds(BEATS);
const STEP_SPAN: [number, number] = [BOUNDS[1][0], BOUNDS[12][1]];
const PEAK_BEAT = 9;

const RAIL = [
  { n: "01", label: "The space", frame: 1, firstBeat: 1 },
  { n: "02", label: "In your hands", frame: 2, firstBeat: 3 },
  { n: "03", label: "The loop", frame: 3, firstBeat: 7 },
  { n: "04", label: "It compounds", frame: 4, firstBeat: 11 },
];

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

/** Light-world (or dark-peak) step head. */
function MechHead({ kicker, accent, title, copy, light = false }: { kicker: string; accent: string; title: string; copy?: string; light?: boolean }) {
  return (
    <div className="mb-9 text-center">
      <p className="text-[11px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: accent, fontWeight: 800 }}>
        {kicker}
      </p>
      <h3 className="text-3xl md:text-[2.7rem] md:leading-[1.12] font-headline tracking-tight mb-4 max-w-3xl mx-auto" style={{ color: light ? LIGHT : INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      {copy && (
        <p className="text-[16px] md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: light ? LIGHT_MUTED : MUTED }}>
          {copy}
        </p>
      )}
    </div>
  );
}

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

/* ══ Frame 1 · The space, decomposed ════════════════════════ */
function SpaceFrame({ phase }: { phase: number }) {
  const out = phase >= 1;
  return (
    <div className={`w-full max-w-4xl mx-auto ${FIT}`}>
      <MechHead
        kicker="01 · The space"
        accent={CYAN}
        title="The room your tribe lives in."
        copy="Not a video library — a space with structure, presence and a feed of its own."
      />
      {/* the header lands center, then docks up as the components fan out */}
      <div style={{ transform: out ? "none" : "translateY(130px)", transition: `transform ${CUT_MS + 120}ms ${EASE}` }} aria-hidden>
        <SpaceHeader />
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-5 items-stretch" aria-hidden>
        <Pop show={out} d={140}>
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
        </Pop>
        <Pop show={out} d={140 + CASCADE_MS}>
          <div className="h-full rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 16px 40px rgba(15,34,41,0.08)" }}>
            <p className="text-[12px] uppercase tracking-[0.18em] font-headline text-left px-1 pt-0.5" style={{ color: ORANGE, fontWeight: 800 }}>The live moments</p>
            <MomentRow img={ROOM.done.img} title={ROOM.done.title} host={ROOM.done.host} state="done" />
            <MomentRow img={ROOM.next.img} title={ROOM.next.title} host={ROOM.next.host} state="next" />
            <MomentRow img={ROOM.upcoming.img} title={ROOM.upcoming.title} host={ROOM.upcoming.host} state="upcoming" />
          </div>
        </Pop>
        <Pop show={out} d={140 + CASCADE_MS * 2}>
          <div className="h-full rounded-2xl p-4 space-y-2" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 16px 40px rgba(15,34,41,0.08)" }}>
            <p className="text-[12px] uppercase tracking-[0.18em] font-headline text-left px-1 pt-0.5" style={{ color: ORANGE, fontWeight: 800 }}>The tribe feed</p>
            <TribePost initial="A" color={CYAN} name="Anna" when="2h" text="Week 1 done — first plan I've actually kept up with 🔥" />
            <TribePost initial="S" color={ORANGE} name="Sam" when="just now" text="Moment 5 ✓ — see everyone Tuesday!" />
          </div>
        </Pop>
      </div>
    </div>
  );
}

/* ══ Frame 2 · In everyone's hands ══════════════════════════ */
function HandsFrame({ phase }: { phase: number }) {
  return (
    <div className={`w-full max-w-3xl mx-auto ${FIT}`}>
      {/* four-state head */}
      <div className="relative mb-9" style={{ minHeight: 150 }}>
        {[
          {
            on: phase === 0,
            kicker: "02 · In everyone's hands — when someone joins",
            accent: CYAN,
            title: "No cold start.",
            copy: "The moment someone joins, the space asks them to introduce themselves.",
          },
          {
            on: phase === 1,
            kicker: "02 · In everyone's hands",
            accent: CYAN,
            title: "Anyone can engage at any time.",
            copy: "Four tools, for members and creators — no permission needed, no cold silence.",
          },
          {
            on: phase === 2,
            kicker: "02 · In everyone's hands — creator view",
            accent: ORANGE,
            title: "A question finds you.",
            copy: "A notification the moment it lands — and your console collects it until it's answered.",
          },
          {
            on: phase >= 3,
            kicker: "02 · In everyone's hands",
            accent: CYAN,
            title: "Answered once. Everyone learns.",
            copy: "Answers are pinned inside posts — visible to the whole tribe. Everybody can react with likes or comments.",
          },
        ].map((h, i) => (
          <div key={i} className="absolute inset-x-0 top-0" style={{ opacity: h.on ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} ${h.on ? 80 : 0}ms` }}>
            <MechHead kicker={h.kicker} accent={h.accent} title={h.title} copy={h.copy} />
          </div>
        ))}
      </div>

      <div className="relative" style={{ minHeight: 460 }}>
        {/* p0 — the introduction post: the cold start, solved */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase === 0 ? 1 : 0, transform: phase === 0 ? "none" : "translateY(-14px)", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: "none" }}
        >
          <div className="mx-auto w-full max-w-2xl">
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
          </div>
        </div>

        {/* p1 — the four tools, four distinct pieces */}
        <div
          className="absolute inset-0 flex flex-col justify-start"
          style={{ opacity: phase === 1 ? 1 : 0, transform: phase === 1 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
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
                  <span className="px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.08)", fontWeight: 800 }}>Creators</span>
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
        </div>

        {/* p2 — TWO pieces: the notification, and the console that collects it */}
        <div
          className="absolute inset-0 flex flex-col justify-start"
          style={{ opacity: phase === 2 ? 1 : 0, transform: phase === 2 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase === 2 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase === 2 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
          <div className="grid sm:grid-cols-2 gap-6 items-start" aria-hidden>
            {/* piece 1 — the notification */}
            <div className="text-left">
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
            </div>
            {/* piece 2 — the console */}
            <div className="text-left">
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
            </div>
          </div>
        </div>

        {/* p3 — the answered post */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase >= 3 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase >= 3 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
          <div className="rounded-3xl p-6 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
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
            <Pop show={phase >= 3} d={250}>
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
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 3 · The engagement loop ══════════════════════════ */
function LoopFrame({ phase, onJoin }: { phase: number; onJoin: () => void }) {
  const isPeak = phase === 2;
  return (
    <div className={`w-full max-w-3xl mx-auto ${FIT}`}>
      {/* four-state head */}
      <div className="relative mb-9" style={{ minHeight: 150 }}>
        {[
          {
            on: phase === 0,
            kicker: "03 · The loop — before every live moment",
            accent: ORANGE,
            title: "Momentum is building.",
            copy: "The tribe shares its readiness — and everyone feels it.",
            light: false,
          },
          {
            on: phase === 1,
            kicker: "03 · The loop",
            accent: ORANGE,
            title: "The moment arrives.",
            copy: "The reset's first live moment is open — your tribe is walking in.",
            light: false,
          },
          {
            on: phase === 2,
            kicker: "And then",
            accent: "#ef4444",
            title: "You're live.",
            copy: "No new login, no external link — training together, right here, right now.",
            light: true,
          },
          {
            on: phase >= 3,
            kicker: "After the live moment",
            accent: CYAN,
            title: "The reflection closes the loop.",
            copy: "Every prompt becomes a post — the feed keeps its own rhythm.",
            light: false,
          },
        ].map((h, i) => (
          <div key={i} className="absolute inset-x-0 top-0" style={{ opacity: h.on ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} ${h.on ? 80 : 0}ms` }}>
            <MechHead kicker={h.kicker} accent={h.accent} title={h.title} copy={h.copy} light={h.light} />
          </div>
        ))}
      </div>

      <div className="relative" style={{ minHeight: 440 }}>
        {/* p0 — the pulse: momentum building */}
        <div
          className="absolute inset-0 flex flex-col justify-start gap-4"
          style={{ opacity: phase === 0 ? 1 : 0, transform: phase === 0 ? "none" : "translateY(-14px)", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: "none" }}
        >
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
          <Pop show={phase === 0} d={300} className="mx-auto w-full max-w-2xl">
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
          </Pop>
        </div>

        {/* p1 — THE MOMENT ARRIVES: the real live session card + Join CTA */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ opacity: phase === 1 ? 1 : 0, transform: phase === 1 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase === 1 ? 80 : 0}ms`, pointerEvents: phase === 1 ? "auto" : "none" }}
        >
          {/* the session card, exactly as it reads live in the space */}
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(239,68,68,0.22), 0 26px 64px rgba(15,34,41,0.18)" }} aria-hidden>
            <div className="relative aspect-[16/8]" style={{ backgroundColor: INK }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MEET.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.82) 8%, rgba(15,34,41,0.15) 55%, rgba(15,34,41,0) 100%)" }} />
              {/* the live sign — red, pulsing (the only red on the frame) */}
              <span className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline text-white" style={{ backgroundColor: "rgba(239,68,68,0.95)", fontWeight: 800, boxShadow: "0 4px 14px rgba(239,68,68,0.45)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live now
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-left">
                <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: "#9CF0FF", fontWeight: 800 }}>Week {ROOM.week} · The live moment</p>
                <p className="text-[21px] sm:text-[23px] font-headline tracking-tight leading-tight mt-1" style={{ color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.015em" }}>{MEET.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex -space-x-1.5">
                    {[ALEX.avatar, MIRA.avatar].map((a) => (
                      <span key={a} className="w-5 h-5 rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(255,255,255,0.9)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a} alt="" className="w-full h-full object-cover" />
                      </span>
                    ))}
                  </span>
                  <span className="text-[11.5px] font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{MEET.host}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[12px] font-bold" style={{ color: MUTED }}>{MEET.dur} · the reset&apos;s first live moment</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black font-headline" style={{ color: ORANGE }}>
                <span className="flex -space-x-1">
                  {["A", "S", "L"].map((m) => (
                    <span key={m} className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-headline" style={{ backgroundColor: "rgba(8,145,178,0.16)", color: CYAN, fontWeight: 800, border: "1px solid #FFF" }}>{m}</span>
                  ))}
                </span>
                8 in the room
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onJoin}
            className="mt-8 px-16 py-6 rounded-full text-white text-xl font-black font-headline transition-transform hover:scale-[1.05]"
            style={{ backgroundColor: ORANGE, boxShadow: "0 18px 54px rgba(255,97,48,0.5), 0 5px 18px rgba(255,97,48,0.32)" }}
          >
            Join now →
          </button>
          <p className="text-[13px] mt-5" style={{ color: MUTED }}>Your move — or keep scrolling.</p>
        </div>

        {/* p2 — THE PEAK: the room, as energy */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ opacity: isPeak ? 1 : 0, transition: `opacity ${CUT_MS + 100}ms ${EASE} ${isPeak ? 120 : 0}ms`, pointerEvents: "none" }}
          aria-hidden
        >
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
          <svg width="380" height="48" viewBox="0 0 380 48" fill="none" className="mt-5" aria-hidden>
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
        </div>

        {/* p3 — the reflection post closes the loop */}
        <div
          className="absolute inset-0 flex flex-col justify-center"
          style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? "none" : "translateY(14px)", transition: `opacity ${CUT_MS}ms ${EASE} ${phase >= 3 ? 80 : 0}ms, transform ${CUT_MS}ms ${EASE} ${phase >= 3 ? 80 : 0}ms`, pointerEvents: "none" }}
        >
          <div className="mx-auto w-full max-w-2xl">
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
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 4 · It compounds ═════════════════════════════════ */
function CompoundFrame({ phase, active }: { phase: number; active: boolean }) {
  const wrapped = phase >= 1;
  const fill = !active ? "8%" : wrapped ? "100%" : "85%";
  const litWeeks = !active ? 1 : wrapped ? 6 : 5;
  return (
    <div className={`w-full max-w-3xl mx-auto ${FIT}`}>
      {/* two-state head — extra reserve; the wrapped title runs two lines */}
      <div className="relative mb-9" style={{ minHeight: 210 }}>
        <div className="absolute inset-x-0 top-0" style={{ opacity: wrapped ? 0 : 1, transition: `opacity ${CUT_MS}ms ${EASE}` }}>
          <MechHead
            kicker="04 · It compounds"
            accent={ORANGE}
            title="Every live moment builds the run."
            copy="Attendance and progression — tracked in the space, for you and every member."
          />
        </div>
        <div className="absolute inset-x-0 top-0" style={{ opacity: wrapped ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 80ms` }}>
          <MechHead
            kicker="04 · It compounds"
            accent={ORANGE}
            title="The run wraps — the retention loop opens."
            copy="Same space, next run: you shape it, your tribe re-enrolls in one tap, new members join them."
          />
        </div>
      </div>

      {/* the progress — one persistent composition, the bar carries through */}
      <div className="rounded-3xl p-6 sm:p-7" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>
            {EX.title}
          </p>
          <span className="text-[12px] font-black font-headline inline-flex items-center gap-1.5" style={{ color: wrapped ? "#16a34a" : ORANGE, transition: `color ${CUT_MS}ms ${EASE}` }}>
            {wrapped ? <>Run complete {CHECK("#16a34a", 12)}</> : "Live moment by live moment"}
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

        {/* THE RETENTION LOOP — pops when the run wraps */}
        <Pop show={wrapped} d={450} from="translateY(16px)">
          <div className="mt-8 text-left">
            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-2xl p-5 opacity-70" style={{ backgroundColor: "rgba(250,248,243,1)", boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Run 1</p>
                <p className="text-[16px] font-black font-headline mt-1.5" style={{ color: MUTED }}>✓ Completed</p>
              </div>
              <svg width="32" height="16" viewBox="0 0 26 14" fill="none" className="shrink-0" aria-hidden>
                <line x1="1" y1="7" x2="20" y2="7" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" />
                <path d="M16 2 L23 7 L16 12" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex-1 rounded-2xl p-5" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30), 0 12px 32px rgba(15,34,41,0.10)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline flex items-center gap-1.5" style={{ color: "#ef4444", fontWeight: 800 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> Run 2 · Enrolling
                </p>
                <p className="text-[16px] font-black font-headline mt-1.5" style={{ color: INK }}>Same space, next chapter</p>
              </div>
            </div>

            {/* you shape the next run */}
            <p className="text-[11px] uppercase tracking-[0.2em] font-headline mt-6 mb-3" style={{ color: ORANGE, fontWeight: 800 }}>You shape the next run</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { t: "Repeat it", d: "Same design, next cohort" },
                { t: "Reshape it", d: "New terms — the agreement re-locks" },
                { t: "New collaborator", d: "Invite another expert in" },
              ].map(({ t, d }) => (
                <div key={t} className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}>
                  <p className="text-[13.5px] font-black font-headline" style={{ color: INK }}>{t}</p>
                  <p className="text-[11px] font-bold mt-1 leading-snug" style={{ color: MUTED }}>{d}</p>
                </div>
              ))}
            </div>

            {/* the tribe carries over + new members */}
            <div
              className="mt-4 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
              style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.14), rgba(255,97,48,0.05))", boxShadow: "0 0 0 1px rgba(255,97,48,0.26)" }}
            >
              <div className="min-w-0">
                <p className="text-[10.5px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                  Retention, built in
                </p>
                <p className="text-[15px] font-black font-headline mt-1 leading-snug" style={{ color: INK }}>
                  Your tribe re-enrolls in one tap — new members join the same run.
                </p>
              </div>
              <span className="shrink-0 px-5 py-2.5 rounded-full text-white text-[12.5px] font-black font-headline" style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}>
                Enroll in Run 2 →
              </span>
            </div>
          </div>
        </Pop>
      </div>
    </div>
  );
}

/* ══ Frame 5 · Outro ════════════════════════════════════════ */
function HandoffFrame() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <p className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.1]" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        Designed to <span style={{ color: ORANGE }}>feel alive.</span>
      </p>
      <p className="text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
        Real people bring the life — the space gives them every reason.
      </p>
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
        Alive <span style={{ color: ORANGE }}>by design.</span>
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
  const { beat, pinned, wrapperRef, jumpToBeat, runwayVh } = useBeatChapter({ beats: BEATS });

  const frame = BEATS[beat].f;
  const phase = BEATS[beat].p;
  const peak = frame === 3 && phase === 2;

  const railMid = BOUNDS[beat][0] + BEATS[beat].w / 2;
  const railSp = Math.min(1, Math.max(0, (railMid - STEP_SPAN[0]) / (STEP_SPAN[1] - STEP_SPAN[0])));

  if (!pinned) {
    return (
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="py-8"><IntroFrame /></div>
          <div className="py-12"><SpaceFrame phase={1} /></div>
          <div className="py-12"><HandsFrame phase={1} /></div>
          <div className="py-12"><HandsFrame phase={3} /></div>
          <div className="py-12"><LoopFrame phase={3} onJoin={() => {}} /></div>
          <div className="py-12"><CompoundFrame phase={1} active /></div>
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
        <div
          className="sticky top-0 w-full overflow-hidden h-screen"
          style={{ height: "100dvh", backgroundColor: peak ? TEAL : "rgba(12,38,46,0)", transition: `background-color 500ms ${EASE}` }}
        >
          {/* Mechanics rail — desktop (stands down during the dark peak) */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-4" style={{ opacity: frame >= 1 && frame <= 4 && !peak ? 1 : 0, transition: "opacity 400ms ease" }}>
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
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: frame >= 1 && frame <= 4 && !peak ? 1 : 0, transition: "opacity 400ms ease" }}>
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
                  {f === 1 && <SpaceFrame phase={active ? phase : 0} />}
                  {f === 2 && <HandsFrame phase={active ? phase : 0} />}
                  {f === 3 && <LoopFrame phase={active ? phase : 0} onJoin={() => jumpToBeat(PEAK_BEAT)} />}
                  {f === 4 && <CompoundFrame phase={active ? phase : 0} active={active} />}
                  {f === 5 && <HandoffFrame />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
