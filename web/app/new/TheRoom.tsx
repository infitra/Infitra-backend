import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

/**
 * Bridge + M4 · HOW IT UNFOLDS — the experience's own story, answering the
 * question the publish raises. The SAME flagship experience continues: the
 * space with its REAL header (cover + title + experts + expandable chips +
 * live/active state), the you-panel, the journey (ghost week type, timeline,
 * session rows with thumbs), the tribe — then the built-in engagement loop
 * (intro · pulse · reflection · directed Q&A answered once, visible to all),
 * the live-room moment, and the continuation beat. No phone (founder call).
 */

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

/* ── The space's REAL header — connects the story to what was published ── */
function SpaceHeader() {
  return (
    <div style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
      <div className="flex items-stretch gap-4 px-4 sm:px-5 pt-4 pb-3">
        {/* cover thumb */}
        <span className="relative shrink-0 w-24 sm:w-28 rounded-xl overflow-hidden hidden sm:block" style={{ backgroundColor: INK }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </span>
        {/* title + experts + chips */}
        <div className="min-w-0 flex-1">
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
        {/* live + active-now state */}
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

/* ── Session row — the journey's agenda card with its image thumb ── */
function SessionRow({
  img,
  title,
  host,
  state,
}: {
  img: string;
  title: string;
  host: string;
  state: "done" | "next" | "upcoming";
}) {
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
        {isNext && (
          <span className="block text-[8px] uppercase tracking-widest font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
            Next moment
          </span>
        )}
        <span className="block text-[12.5px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>
          {title}
        </span>
        <span className="block text-[9.5px] font-bold" style={{ color: FAINT }}>{host}</span>
      </span>
      <span className="shrink-0">
        {state === "done" && (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-headline" style={{ color: MUTED, fontWeight: 800 }}>
            {CHECK(CYAN, 11)} Done
          </span>
        )}
        {state === "next" && (
          <span className="text-[11px] font-black font-headline" style={{ color: ORANGE }}>
            {ROOM.next.inLabel}
          </span>
        )}
        {state === "upcoming" && (
          <span className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
            Upcoming
          </span>
        )}
      </span>
    </div>
  );
}

/* ── The space — real header + hub + journey + tribe ────────── */
function MockSpace() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <SpaceHeader />

      <div className="p-4 sm:p-5 grid sm:grid-cols-[185px_1fr] gap-4" style={{ backgroundColor: "#FAF8F3" }}>
        {/* YOU panel */}
        <div className="rounded-2xl p-3.5 self-start" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(8,145,178,0.14)", border: "1.5px solid rgba(8,145,178,0.35)" }}>
              <span className="text-[11px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>A</span>
            </span>
            <div>
              <p className="text-[12px] font-headline leading-none" style={{ color: INK, fontWeight: 800 }}>Anna</p>
              <p className="text-[8px] uppercase tracking-widest font-headline mt-0.5" style={{ color: CYAN, fontWeight: 800 }}>Member</p>
            </div>
          </div>

          <p className="text-[8px] uppercase tracking-[0.18em] font-headline mt-3.5 mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>Momentum</p>
          <p className="text-[10.5px] font-black font-headline" style={{ color: INK }}>Week {ROOM.week} of {EX.weeks}</p>
          <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: "33%", backgroundColor: ORANGE }} />
          </div>

          <p className="text-[8px] uppercase tracking-[0.18em] font-headline mt-3.5 mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>Next moment</p>
          <p className="text-[10.5px] font-black font-headline leading-snug" style={{ color: INK }}>
            {ROOM.next.title}
            <span className="block text-[9px] font-bold mt-0.5" style={{ color: ORANGE }}>{ROOM.next.inLabel}</span>
          </p>

          <p className="text-[8px] uppercase tracking-[0.18em] font-headline mt-3.5 mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>Engagement</p>
          <div className="rounded-lg px-2 py-1.5 text-center text-[9.5px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
            Share with your Tribe
          </div>
          <div className="mt-1.5 rounded-lg px-2 py-1.5 text-center text-[9.5px] font-headline" style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.07)", fontWeight: 800 }}>
            Ask your Experts
          </div>

          <p className="text-[8px] uppercase tracking-[0.18em] font-headline mt-3.5 mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>Your progress</p>
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0" style={{ width: 42, height: 42 }}>
              <svg width="42" height="42" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ECE7DD" strokeWidth="3.4" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={CYAN} strokeWidth="3.4" strokeLinecap="round" strokeDasharray="25 100" transform="rotate(-90 18 18)" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-headline" style={{ color: INK }}>25%</span>
            </div>
            <div>
              <p className="text-[10px] font-black font-headline leading-tight" style={{ color: INK }}>5 of 20 attended</p>
              <p className="text-[9px] leading-tight" style={{ color: FAINT }}>15 ahead</p>
            </div>
          </div>
        </div>

        {/* journey + tribe */}
        <div className="min-w-0">
          <p className="text-[8px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>The journey</p>
          <p className="font-headline leading-none mt-1" style={{ fontWeight: 800, letterSpacing: "-0.02em" }} aria-hidden>
            <span className="text-[27px]" style={{ color: INK }}>WEEK {ROOM.week} </span>
            <span className="text-[27px]" style={{ color: "rgba(15,34,41,0.18)" }}>OF {EX.weeks}</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] font-headline mt-1" style={{ color: ORANGE, fontWeight: 800 }}>
            {ROOM.theme}
          </p>

          {/* timeline dots */}
          <div className="flex items-center gap-1 mt-3 mb-3" aria-hidden>
            {EX.arc.map((_, i) => (
              <span key={i} className="flex items-center flex-1 last:flex-none">
                <span
                  className="shrink-0 rounded-full"
                  style={
                    i === ROOM.week - 1
                      ? { width: 12, height: 12, backgroundColor: ORANGE, boxShadow: "0 0 0 3px rgba(255,97,48,0.20)" }
                      : { width: 7, height: 7, backgroundColor: i < ROOM.week - 1 ? "rgba(255,97,48,0.5)" : "rgba(15,34,41,0.14)" }
                  }
                />
                {i < EX.arc.length - 1 && <span className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.10)" }} />}
              </span>
            ))}
          </div>

          <div className="space-y-1.5">
            <SessionRow img={ROOM.done.img} title={ROOM.done.title} host={ROOM.done.host} state="done" />
            <SessionRow img={ROOM.next.img} title={ROOM.next.title} host={ROOM.next.host} state="next" />
            <SessionRow img={ROOM.upcoming.img} title={ROOM.upcoming.title} host={ROOM.upcoming.host} state="upcoming" />
          </div>

          <p className="text-[8px] uppercase tracking-[0.2em] font-headline mt-4 mb-2" style={{ color: FAINT, fontWeight: 800 }}>The tribe</p>
          <div className="space-y-1.5">
            <div className="rounded-xl px-3 py-2.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
              <div className="flex gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
                  <span className="text-[9px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>A</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-headline" style={{ color: INK, fontWeight: 800 }}>
                    Anna <span style={{ color: FAINT, fontWeight: 600 }}>· 2h</span>
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
                    Week 1 done — first plan I&apos;ve actually kept up with. This group 🔥
                  </p>
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[8px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
                    Energy after · 8/10
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl px-3 py-2.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
              <div className="flex gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.12)" }}>
                  <span className="text-[9px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>S</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-headline" style={{ color: INK, fontWeight: 800 }}>
                    Sam <span style={{ color: FAINT, fontWeight: 600 }}>· just now</span>
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
                    Session 5 ✓ — see everyone tonight!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── The engagement loop — built in ─────────────────────────── */
function EngagementLoop() {
  return (
    <div className="mt-16">
      <div className="text-center max-w-2xl mx-auto mb-9">
        <h3 className="text-2xl md:text-3xl font-headline tracking-tight mb-3" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
          The engagement loop — built in.
        </h3>
        <p className="text-[15px] md:text-base leading-relaxed" style={{ color: MUTED }}>
          Intros when someone joins. A pulse before each session. A reflection after.
          And questions routed to the expert who owns the topic — answered once, visible to all.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.15fr] gap-4 items-start" aria-hidden>
        {/* the three action cards — ports of the real primitives */}
        <div className="space-y-3">
          {/* intro */}
          <div className="rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + CYAN }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
              New in the tribe · Your experts asked
            </p>
            <p className="text-[12.5px] font-bold font-headline leading-snug mt-1.5" style={{ color: INK }}>
              {EX.introPrompt}
            </p>
            <div className="mt-2.5 rounded-full px-3.5 py-2 text-[10.5px]" style={{ backgroundColor: "#F8F6F0", color: FAINT }}>
              Introduce yourself to the tribe…
            </div>
          </div>
          {/* pulse */}
          <div className="rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + ORANGE }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              Before tonight · 19:00
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
          {/* reflection */}
          <div className="rounded-2xl p-4 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), inset 3.5px 0 0 " + CYAN }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
              After the session
            </p>
            <p className="text-[12.5px] font-bold font-headline leading-snug mt-1.5" style={{ color: INK }}>
              How was &ldquo;{ROOM.done.title}&rdquo;?
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
                Energy after · 8/10
              </span>
              <span className="text-[10px] flex-1 truncate" style={{ color: FAINT }}>Share a takeaway with the tribe…</span>
            </div>
          </div>
        </div>

        {/* the featured directed question — ask one, everyone learns */}
        <div className="rounded-2xl p-5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
          <div className="flex gap-2.5">
            <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.12)" }}>
              <span className="text-[11px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>L</span>
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-headline" style={{ color: INK, fontWeight: 800 }}>
                {ROOM.qa.asker} <span style={{ color: FAINT, fontWeight: 600 }}>· 3h</span>
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

          {/* the pinned coach answer */}
          <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: "inset 3.5px 0 0 " + CYAN }}>
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
          <p className="text-[10px] font-bold font-headline mt-3 text-center" style={{ color: FAINT }}>
            Answered once — visible to the whole tribe.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── The live moment — one click into the room ──────────────── */
function LiveMoment() {
  return (
    <div className="mt-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h3 className="text-2xl md:text-3xl font-headline tracking-tight" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
          And when it&apos;s time — <span style={{ color: ORANGE }}>one click into the room.</span>
        </h3>
      </div>
      <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden" style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }} aria-hidden>
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
      <p className="text-center text-[12px] font-bold font-headline mt-4" style={{ color: FAINT }}>
        No links, no logins — the room opens from the space.
      </p>
    </div>
  );
}

/* ── The continuation beat ──────────────────────────────────── */
function ContinuesBeat() {
  return (
    <div className="mt-16 max-w-2xl mx-auto text-center">
      <p className="text-xl md:text-2xl font-headline tracking-tight mb-6" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        And when a run wraps — <span style={{ color: ORANGE }}>the next one opens.</span>
      </p>
      <div aria-hidden>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-2xl p-4 opacity-70" style={{ backgroundColor: "rgba(255,255,255,0.75)", boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }}>
            <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Run 1</p>
            <p className="text-[13px] font-black font-headline mt-1" style={{ color: MUTED }}>✓ Completed</p>
          </div>
          <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className="shrink-0" aria-hidden>
            <line x1="1" y1="7" x2="20" y2="7" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" />
            <path d="M16 2 L23 7 L16 12" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30), 0 12px 32px rgba(15,34,41,0.10)" }}>
            <p className="text-[8px] uppercase tracking-widest font-headline flex items-center justify-center gap-1" style={{ color: "#ef4444", fontWeight: 800 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> Run 2 · Live now
            </p>
            <p className="text-[13px] font-black font-headline mt-1" style={{ color: INK }}>Same tribe, next chapter</p>
          </div>
        </div>
        <div
          className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left"
          style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.14), rgba(255,97,48,0.05))", boxShadow: "0 0 0 1px rgba(255,97,48,0.26)" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              Continues · live now
            </p>
            <p className="text-[13px] font-black font-headline truncate mt-0.5" style={{ color: INK }}>
              The tribe carries over — rejoining is one tap
            </p>
          </div>
          <span className="shrink-0 px-4 py-2 rounded-full text-white text-[11px] font-black font-headline" style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}>
            Join →
          </span>
        </div>
      </div>
      <p className="text-sm md:text-base mt-6 max-w-md mx-auto" style={{ color: MUTED }}>
        Retention becomes a revenue line — not a relaunch campaign.
      </p>
    </div>
  );
}

/* ── The section ───────────────────────────────────────────── */
export function TheRoom() {
  return (
    <section className="px-6 pb-24">
      {/* the heartbeat's tail — the chapter's pulse hands the story over */}
      <div className="flex justify-center pt-2 pb-10" aria-hidden>
        <svg viewBox="0 0 320 40" className="w-64 h-8" fill="none">
          <path
            d="M0,20 H120 L134,20 L143,6 L154,34 L164,20 H320"
            stroke={ORANGE}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
          />
          <circle cx="149" cy="20" r="3.5" fill={ORANGE} opacity={0.5}>
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="Inside the experience"
          title="How it unfolds."
          sub="What you published isn't a video library — it's a room your tribe shows up to. Live sessions anchor each week; between them, the space runs the rhythm."
        />
        <Reveal><MockSpace /></Reveal>
        <Reveal><EngagementLoop /></Reveal>
        <Reveal><LiveMoment /></Reveal>
        <Reveal><ContinuesBeat /></Reveal>
      </div>
    </section>
  );
}
