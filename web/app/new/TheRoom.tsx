import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW, SectionHead } from "./ui";

/**
 * Bridge + M5 · INSIDE THE EXPERIENCE — the participant side, PORTED to the
 * real Experience Space grammar: the WeekJourney's display type ("WEEK 2
 * <ghost>OF 6</ghost>" + orange theme), the timeline dots, session rows with
 * image thumbs, the YouPanel (momentum · engagement · progress ring), the
 * tribe feed, and the phone with a pre-session pulse. Closes with the
 * continuation beat: runs end, the experience doesn't.
 */

export function Bridge() {
  return (
    <section className="px-6 py-16 text-center">
      <div className="max-w-3xl mx-auto">
        <p
          className="text-2xl md:text-4xl font-headline tracking-tight leading-[1.15]"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          That&apos;s your side.
          <br />
          <span style={{ color: ORANGE }}>Here&apos;s the room your tribe lives in.</span>
        </p>
        <div className="mt-10 flex items-center justify-center" aria-hidden>
          <svg viewBox="0 0 600 80" className="w-full max-w-xl h-10 md:h-14" fill="none">
            <path d="M 0 40 L 600 40" stroke="rgba(15,34,41,0.10)" strokeWidth={1} strokeDasharray="2 4" />
            <path
              d="M 0 40 L 140 40 L 160 40 L 175 10 L 195 70 L 210 40 L 390 40 L 405 10 L 425 70 L 440 40 L 600 40"
              stroke={CYAN}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="185" cy="40" r="5" fill={CYAN}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="415" cy="40" r="5" fill={CYAN}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    </section>
  );
}

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── Session row — the journey's agenda card, with its image thumb ── */
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

/* ── The space — header + hub + journey + tribe ─────────────── */
function MockSpace() {
  return (
    <div className="rounded-3xl overflow-hidden h-full" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-headline" style={{ color: "#ef4444", fontWeight: 800 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            Live · Week {ROOM.week} of {EX.weeks}
          </span>
          <p className="text-[13.5px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
        </div>
        <div className="flex -space-x-2 shrink-0">
          {[ALEX.avatar, MIRA.avatar].map((a) => (
            <span key={a} className="w-7 h-7 rounded-full overflow-hidden" style={{ border: "2px solid #FFFFFF" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a} alt="" className="w-full h-full object-cover" />
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5 grid sm:grid-cols-[180px_1fr] gap-4" style={{ backgroundColor: "#FAF8F3" }}>
        {/* YOU panel port */}
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
          {/* THE JOURNEY — the real display grammar */}
          <p className="text-[8px] uppercase tracking-[0.2em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>The journey</p>
          <p className="font-headline leading-none mt-1" style={{ fontWeight: 800, letterSpacing: "-0.02em" }} aria-hidden>
            <span className="text-[26px]" style={{ color: INK }}>WEEK {ROOM.week} </span>
            <span className="text-[26px]" style={{ color: "rgba(15,34,41,0.18)" }}>OF {EX.weeks}</span>
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

          {/* THE TRIBE */}
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
                  <span className="text-[9px] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>L</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-headline" style={{ color: INK, fontWeight: 800 }}>
                    Lea <span style={{ color: FAINT, fontWeight: 600 }}>· question for {MIRA.first}</span>
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: MUTED }}>
                    High-protein options when I&apos;m traveling all week?
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[8px] font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
                    {CHECK("#16a34a", 9)} Answered by {MIRA.first}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Phone — the pocket version with the pre-session pulse ── */
function MockPhone() {
  return (
    <div className="mx-auto w-[225px]" aria-hidden>
      <div className="rounded-[2.2rem] p-2.5" style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }}>
        <div className="rounded-[1.7rem] overflow-hidden" style={{ backgroundColor: "#F2EFE8" }}>
          <div className="flex items-center justify-center pt-2 pb-1.5">
            <span className="w-14 h-1.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.14)" }} />
          </div>
          <div className="px-3 pb-4">
            <p className="text-[8px] uppercase tracking-widest font-headline flex items-center gap-1" style={{ color: "#ef4444", fontWeight: 800 }}>
              <span className="w-1 h-1 rounded-full bg-[#ef4444] animate-pulse" /> Live · Week {ROOM.week}
            </p>
            <div className="mt-2 rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}>
              <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                Tonight · 19:00
              </p>
              <p className="text-[11px] font-black font-headline leading-snug mt-0.5" style={{ color: INK }}>
                {ROOM.next.title}
              </p>
              <p className="text-[10px] mt-2 font-semibold" style={{ color: MUTED }}>How ready are you?</p>
              <div className="mt-1.5 relative h-1.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.08)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: "80%", backgroundColor: CYAN }} />
                <span className="absolute -top-[3px] w-3 h-3 rounded-full" style={{ left: "76%", backgroundColor: "#FFFFFF", boxShadow: `0 0 0 2px ${CYAN}` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[8px]" style={{ color: FAINT }}>0</span>
                <span className="text-[9px] font-black font-headline" style={{ color: CYAN }}>8/10</span>
                <span className="text-[8px]" style={{ color: FAINT }}>10</span>
              </div>
              <div className="mt-2 rounded-full py-1.5 text-center text-[9px] font-black font-headline text-white" style={{ backgroundColor: ORANGE }}>
                Send to your Experts
              </div>
            </div>
            <div className="mt-2 rounded-2xl p-3" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}>
              <p className="text-[9px] font-headline" style={{ color: INK, fontWeight: 800 }}>
                Sam <span style={{ color: FAINT, fontWeight: 600 }}>· just now</span>
              </p>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: MUTED }}>
                Session 5 ✓ — see everyone tonight!
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] font-bold font-headline mt-3" style={{ color: FAINT }}>
        …and in their pocket.
      </p>
    </div>
  );
}

/* ── The continuation beat — runs end, the experience doesn't ── */
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
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="Inside the experience"
          title={
            <>
              Not a video library.
              <br className="hidden sm:block" /> A room they show up to.
            </>
          }
          sub="Live sessions anchor every week. Between them, the tribe shares progress, reflections and questions — routed to the expert who owns that topic. This is what your members open, day after day."
        />
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          <MockSpace />
          <MockPhone />
        </div>
        <ContinuesBeat />
      </div>
    </section>
  );
}
