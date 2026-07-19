"use client";

import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";
import { type BeatDef, useBeatChapter, computeBounds, Pop, CUT_MS, CASCADE_MS, EASE, FIT } from "./chapterEngine";

/**
 * ACT 2 · ONE LIVE WEEK — the pinned time-thread chapter.
 *
 * The heartbeat promised something alive; this chapter delivers it in the
 * same beat grammar as Act 1, with one inversion: in Act 1 YOU acted —
 * here the experience acts on its own. The rail is a CLOCK (Week 2 of the
 * real flagship, its real session titles and times), and every beat is an
 * event ARRIVING: the pulse lands, the room goes live, the loop breathes,
 * a question finds its expert, the week turns. Light world — the published
 * experience lives in daylight, on the brand waves.
 *
 * Truth guardrails: only real UI compositions (space header, session rows,
 * live room, Q&A), pilot-scale numbers, the one flagship experience.
 */

/* ── The week's beats ──────────────────────────────────────── */
const BEATS: BeatDef[] = [
  { f: 0, p: 0, w: 1 }, // intro — the chapter title
  { f: 1, p: 0, w: 1.1 }, // the space, real
  { f: 2, p: 0, w: 1 }, // Tuesday — the pulse lands
  { f: 2, p: 1, w: 1.1 }, // 13:00 — it goes live
  { f: 3, p: 0, w: 1 }, // after — the loop breathes
  { f: 4, p: 0, w: 1 }, // Thursday — a question
  { f: 4, p: 1, w: 1.1 }, // — finds its expert
  { f: 5, p: 0, w: 1.2 }, // Sunday — the week turns
  { f: 6, p: 0, w: 1.8 }, // outro — the handoff glide
];
const BOUNDS = computeBounds(BEATS);
const STEP_SPAN: [number, number] = [BOUNDS[1][0], BOUNDS[7][1]];

const RAIL = [
  { time: "Week 2", label: "The space", frame: 1, firstBeat: 1 },
  { time: "Tue · 13:00", label: "It goes live", frame: 2, firstBeat: 2 },
  { time: "Tue · later", label: "The loop", frame: 3, firstBeat: 4 },
  { time: "Thu", label: "Ask your expert", frame: 4, firstBeat: 5 },
  { time: "Sun", label: "The week turns", frame: 5, firstBeat: 7 },
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

/** Light-world step head — the time-thread's voice. */
function TimeHead({ kicker, accent, title, copy }: { kicker: string; accent: string; title: string; copy?: string }) {
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

/** Ambient typing dots — life that doesn't wait for a push. */
function Typing() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: FAINT, animationDelay: `${i * 0.16}s` }} />
      ))}
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

/* ── Session row — the journey's agenda card ───────────────── */
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

/* ── The journey block — ghost week type + dots + rows ─────── */
function Journey({ week, theme }: { week: number; theme: string }) {
  return (
    <div className="text-left">
      <p className="text-[8px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>The journey</p>
      <p className="font-headline leading-none mt-1" style={{ fontWeight: 800, letterSpacing: "-0.02em" }} aria-hidden>
        <span className="text-[27px]" style={{ color: INK, transition: `color ${CUT_MS}ms ${EASE}` }}>WEEK {week} </span>
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
                  ? { width: 12, height: 12, backgroundColor: ORANGE, boxShadow: "0 0 0 3px rgba(255,97,48,0.20)", transition: `all ${CUT_MS}ms ${EASE}` }
                  : { width: 7, height: 7, backgroundColor: i < week - 1 ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.14)", transition: `all ${CUT_MS}ms ${EASE}` }
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
      <TimeHead
        kicker={`Week ${ROOM.week} · The space`}
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

/* ══ Frame 2 · Tuesday — the pulse, then LIVE ═══════════════ */
function LiveFrame({ phase }: { phase: number }) {
  const live = phase >= 1;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      {/* two-state head */}
      <div className="relative mb-8" style={{ minHeight: 150 }}>
        <div className="absolute inset-x-0 top-0" style={{ opacity: live ? 0 : 1, transition: `opacity ${CUT_MS}ms ${EASE}` }}>
          <TimeHead
            kicker="Tuesday · before the session"
            accent={ORANGE}
            title="The space warms up."
            copy="A pulse lands before every session — the tribe arrives ready."
          />
        </div>
        <div className="absolute inset-x-0 top-0" style={{ opacity: live ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 80ms` }}>
          <TimeHead
            kicker="Tuesday · 13:00"
            accent="#ef4444"
            title="It goes live."
            copy="No links, no logins — the room opens from the space."
          />
        </div>
      </div>

      <div className="relative" style={{ minHeight: 420 }}>
        {/* state 1 — the pulse card + tonight's session */}
        <div
          className="absolute inset-0 flex flex-col justify-center gap-3"
          style={{ opacity: live ? 0 : 1, transform: live ? "translateY(-14px)" : "none", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: "none" }}
        >
          <SessionRow img={ROOM.next.img} title={ROOM.next.title} host={ROOM.next.host} state="next" right="Today · 13:00" />
          <div className="rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + ORANGE }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              Before today · 12:00
            </p>
            <p className="text-[12.5px] font-bold font-headline leading-snug mt-1.5" style={{ color: INK }}>
              {ROOM.next.title} — how ready are you?
            </p>
            <div className="mt-3 relative h-1.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "80%", backgroundColor: CYAN }} />
              <span className="absolute -top-[4px] w-3.5 h-3.5 rounded-full" style={{ left: "77%", backgroundColor: "#FFFFFF", boxShadow: `0 0 0 2px ${CYAN}` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[8.5px]" style={{ color: FAINT }}>0</span>
              <span className="text-[10px] font-black font-headline" style={{ color: CYAN }}>8 / 10</span>
              <span className="text-[8.5px]" style={{ color: FAINT }}>10</span>
            </div>
          </div>
          <p className="text-center text-[12px] font-bold font-headline" style={{ color: FAINT }}>
            Sam · just now — &ldquo;Session 5 ✓ — see everyone at 13:00!&rdquo;
          </p>
        </div>

        {/* state 2 — the live room */}
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
                Week {ROOM.week} of {EX.weeks}
              </span>
            </div>
            <div className="p-3 grid grid-cols-4 gap-2">
              {[
                { p: ALEX, color: ORANGE },
                { p: MIRA, color: CYAN },
              ].map(({ p, color }) => (
                <div key={p.name} className="relative col-span-2 aspect-[16/10] rounded-xl overflow-hidden" style={{ backgroundColor: "#16323b" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[8px] font-headline" style={{ backgroundColor: "rgba(15,34,41,0.75)", color: "#FFFFFF", fontWeight: 800 }}>
                    {p.first} · <span style={{ color }}>HOST</span>
                  </span>
                </div>
              ))}
              {["A", "S", "L", "J"].map((i) => (
                <div key={i} className="aspect-[16/10] rounded-xl flex items-center justify-center" style={{ backgroundColor: "#16323b" }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: "rgba(156,240,255,0.12)", color: "#9CF0FF", fontWeight: 800 }}>
                    {i}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2.5 pb-3.5">
              {["rgba(255,255,255,0.16)", "rgba(255,255,255,0.16)", "rgba(239,68,68,0.85)"].map((c, i) => (
                <span key={i} className="w-7 h-7 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 3 · After — the loop breathes ════════════════════ */
function LoopFrame({ phase }: { phase: number }) {
  const on = phase >= 0;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      <TimeHead
        kicker="Tuesday · after the session"
        accent={CYAN}
        title="The loop breathes."
        copy="A reflection lands — and the tribe answers each other, not just you."
      />
      <div className="flex flex-col gap-3">
        <Pop show={on} d={150}>
          <div className="rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + CYAN }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
              After the session
            </p>
            <p className="text-[12.5px] font-bold font-headline leading-snug mt-1.5" style={{ color: INK }}>
              How was &ldquo;{ROOM.next.title}&rdquo;?
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
                Energy after · 8/10
              </span>
              <span className="text-[10px] flex-1 truncate" style={{ color: FAINT }}>Share a takeaway with the tribe…</span>
            </div>
          </div>
        </Pop>
        <Pop show={on} d={150 + CASCADE_MS}>
          <TribePost initial="A" color={CYAN} name="Anna" when="just now" text="That last set — didn't think I had it in me. This group 🔥" chip="Energy after · 9/10" />
        </Pop>
        <Pop show={on} d={150 + CASCADE_MS * 2}>
          <TribePost initial="S" color={ORANGE} name="Sam" when="just now" text="Same. Anna, your pacing tip from week 1 carried me today ✓" />
        </Pop>
      </div>
    </div>
  );
}

/* ══ Frame 4 · Thursday — a question finds its expert ═══════ */
function QAFrame({ phase }: { phase: number }) {
  const answered = phase >= 1;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      <TimeHead
        kicker="Thursday"
        accent={CYAN}
        title="A question finds its expert."
        copy="Directed to whoever owns the topic — answered once, visible to all."
      />
      <div className="rounded-2xl p-5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
        <div className="flex gap-2.5">
          <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.12)" }}>
            <span className="text-[11px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>L</span>
          </span>
          <div className="min-w-0">
            <p className="text-[11.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>
              {ROOM.qa.asker} <span style={{ color: FAINT, fontWeight: 600 }}>· just now</span>
            </p>
            <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[8.5px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
              Question for
              <span className="w-3.5 h-3.5 rounded-full overflow-hidden inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              {MIRA.first}
            </span>
            <p className="text-[13px] leading-snug mt-2" style={{ color: INK, fontWeight: 600 }}>
              {ROOM.qa.question}
            </p>
          </div>
        </div>

        {/* typing… then the pinned coach answer */}
        <div className="mt-4" style={{ minHeight: 128 }}>
          {!answered ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${CYAN}59` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <Typing />
              <span className="text-[10px] font-bold" style={{ color: FAINT }}>{MIRA.first} is answering…</span>
            </div>
          ) : (
            <Pop show d={80}>
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: "inset 3.5px 0 0 " + CYAN }}>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${CYAN}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[11.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>{MIRA.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline text-white" style={{ backgroundColor: CYAN, fontWeight: 800 }}>
                    Coach answer
                  </span>
                </div>
                <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: MUTED }}>
                  {ROOM.qa.answer}
                </p>
              </div>
            </Pop>
          )}
        </div>
      </div>
      <Pop show={answered} d={300}>
        <p className="text-[11px] font-bold font-headline mt-4 text-center" style={{ color: FAINT }}>
          Answered once — visible to the whole tribe.
        </p>
      </Pop>
    </div>
  );
}

/* ══ Frame 5 · Sunday — the week turns ══════════════════════ */
function TurnFrame({ phase }: { phase: number }) {
  const on = phase >= 0;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      <TimeHead
        kicker="Sunday"
        accent={ORANGE}
        title="The week turns by itself."
        copy="Structure carries everyone forward — week 3 opens, no ops behind it."
      />
      <div className="rounded-3xl p-5" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
        <Journey week={3} theme={EX.arc[2]} />
        <div className="space-y-1.5 mt-3">
          <SessionRow img={EX.agenda[2][0].img} title={EX.agenda[2][0].title} host={EX.agenda[2][0].host} state="next" right="Mon · 13:00" />
          <SessionRow img={EX.agenda[2][1].img} title={EX.agenda[2][1].title} host={EX.agenda[2][1].host} state="upcoming" />
        </div>
      </div>
      <Pop show={on} d={350}>
        <div
          className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left"
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

/* ══ Frame 6 · Outro — the handoff ══════════════════════════ */
function HandoffFrame() {
  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <p className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.1]" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        A week that <span style={{ color: ORANGE }}>runs itself</span>
        <br />
        around your sessions.
      </p>
      <p className="text-base md:text-lg mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
        Six of them, until the finale — then it can run again.
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
        How it unfolds.
      </h2>
      <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
        What you published isn&apos;t a video library — it&apos;s a room your tribe
        shows up to. One week of it, as it happens.
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
          <div className="py-12"><LiveFrame phase={1} /></div>
          <div className="py-12"><LoopFrame phase={0} /></div>
          <div className="py-12"><QAFrame phase={1} /></div>
          <div className="py-12"><TurnFrame phase={0} /></div>
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
          {/* Time rail — desktop */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-4" style={{ opacity: frame >= 1 && frame <= 5 ? 1 : 0, transition: "opacity 400ms ease" }}>
            <div className="relative w-[3px] rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.12)" }}>
              <div className="absolute top-0 left-0 w-full rounded-full" style={{ height: `${(railSp * 100).toFixed(1)}%`, backgroundColor: ORANGE, boxShadow: "0 0 10px rgba(255,97,48,0.35)", transition: `height 600ms ${EASE}` }} />
            </div>
            <div className="flex flex-col justify-between gap-9 py-1">
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
                      {s.time}
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
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: frame >= 1 && frame <= 5 ? 1 : 0, transition: "opacity 400ms ease" }}>
            {RAIL.map((s) => (
              <span key={s.frame} className="h-1.5 rounded-full transition-all duration-300" style={{ width: frame === s.frame ? 18 : 6, backgroundColor: frame === s.frame ? ORANGE : "rgba(15,34,41,0.20)" }} />
            ))}
          </div>

          {/* Frames — hard cuts, one visible at a time, all centered */}
          {[0, 1, 2, 3, 4, 5, 6].map((f) => {
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
                  {f === 2 && <LiveFrame phase={active ? phase : 0} />}
                  {f === 3 && <LoopFrame phase={active ? phase : 0} />}
                  {f === 4 && <QAFrame phase={active ? phase : 0} />}
                  {f === 5 && <TurnFrame phase={active ? phase : 0} />}
                  {f === 6 && <HandoffFrame />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
