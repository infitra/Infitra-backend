import { EX, ALEX, MIRA, ROOM } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, SectionHead } from "./ui";

/**
 * Bridge + M4 · THE LIVING EXPERIENCE — the participant side. Faithful mocks
 * of the Experience Space (locker room), the mobile feed with a pre-session
 * pulse, and the live room. All content = real flagship sessions (week 2).
 */

/* ── Bridge — one line + the heartbeat ─────────────────────── */
export function Bridge() {
  return (
    <section className="px-6 py-20 text-center">
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

const CHECK = (color: string) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: INK, fontWeight: 800 }}>
      {children}
    </p>
  );
}

/* ── Desktop space mock ────────────────────────────────────── */
function MockSpace() {
  return (
    <div className="rounded-3xl overflow-hidden h-full" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-headline" style={{ color: "#ef4444", fontWeight: 800 }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" />
            Live · Week {ROOM.week} of {EX.weeks}
          </span>
          <p className="text-[13px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
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

      <div className="p-4 sm:p-5 grid sm:grid-cols-[170px_1fr] gap-4" style={{ backgroundColor: "#FAF8F3" }}>
        {/* hub */}
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
          <div className="mt-3 flex items-center gap-2.5">
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              <svg width="44" height="44" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ECE7DD" strokeWidth="3.4" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={CYAN} strokeWidth="3.4" strokeLinecap="round" strokeDasharray="25 100" transform="rotate(-90 18 18)" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-headline" style={{ color: INK }}>25%</span>
            </div>
            <div>
              <p className="text-[10.5px] font-black font-headline leading-tight" style={{ color: INK }}>5 of 20 attended</p>
              <p className="text-[9px] leading-tight" style={{ color: FAINT }}>15 ahead</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg px-2 py-1.5 text-center text-[9.5px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", fontWeight: 800 }}>
            Share with your Tribe
          </div>
          <div className="mt-1.5 rounded-lg px-2 py-1.5 text-center text-[9.5px] font-headline" style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.07)", fontWeight: 800 }}>
            Ask your Experts
          </div>
        </div>

        {/* journey + tribe */}
        <div className="min-w-0">
          <Label>The journey · Week {ROOM.week}</Label>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold font-headline truncate" style={{ color: INK }}>{ROOM.done.title}</p>
                <p className="text-[9px]" style={{ color: FAINT }}>{ROOM.done.host}</p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-headline" style={{ color: MUTED, fontWeight: 800 }}>
                {CHECK(CYAN)} Done
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: "rgba(255,97,48,0.05)", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.28)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: ORANGE, fontWeight: 800 }}>Next moment</p>
                <p className="text-[11px] font-bold font-headline truncate" style={{ color: INK }}>{ROOM.next.title}</p>
              </div>
              <span className="shrink-0 text-[10px] font-black font-headline" style={{ color: ORANGE }}>{ROOM.next.inLabel}</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold font-headline truncate" style={{ color: INK }}>{ROOM.upcoming.title}</p>
                <p className="text-[9px]" style={{ color: FAINT }}>{ROOM.upcoming.host}</p>
              </div>
              <span className="shrink-0 text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Upcoming</span>
            </div>
          </div>

          <div className="mt-4">
            <Label>The tribe</Label>
            <div className="space-y-1.5">
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
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
              <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
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
                      {CHECK("#16a34a")} Answered by {MIRA.first}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Phone mock — the pocket version ───────────────────────── */
function MockPhone() {
  return (
    <div className="mx-auto w-[230px]" aria-hidden>
      <div
        className="rounded-[2.2rem] p-2.5"
        style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }}
      >
        <div className="rounded-[1.7rem] overflow-hidden" style={{ backgroundColor: "#F2EFE8" }}>
          {/* status bar */}
          <div className="flex items-center justify-center pt-2 pb-1.5">
            <span className="w-14 h-1.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.14)" }} />
          </div>
          <div className="px-3 pb-4">
            <p className="text-[8px] uppercase tracking-widest font-headline flex items-center gap-1" style={{ color: "#ef4444", fontWeight: 800 }}>
              <span className="w-1 h-1 rounded-full bg-[#ef4444] animate-pulse" /> Live · Week {ROOM.week}
            </p>
            {/* pre-pulse card */}
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
            {/* mini tribe post */}
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

/* ── Live room strip ───────────────────────────────────────── */
function MockLiveGrid() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.25)" }} aria-hidden>
      <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-headline min-w-0" style={{ color: "#fca5a5", fontWeight: 800 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
          <span className="truncate" style={{ color: "#FFFFFF" }}>Live — {ROOM.next.title}</span>
        </span>
        <span className="text-[10px] font-mono shrink-0" style={{ color: "#9CF0FF" }}>47:12</span>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
        {/* hosts */}
        {[
          { p: ALEX, color: ORANGE },
          { p: MIRA, color: CYAN },
        ].map(({ p, color }) => (
          <div key={p.name} className="relative col-span-2 aspect-[16/10] rounded-xl overflow-hidden" style={{ backgroundColor: "#16323b" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span
              className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[8px] font-headline"
              style={{ backgroundColor: "rgba(15,34,41,0.75)", color: "#FFFFFF", fontWeight: 800 }}
            >
              {p.first} · <span style={{ color }}>HOST</span>
            </span>
          </div>
        ))}
        {/* attendees */}
        {["A", "S", "L", "J"].map((i) => (
          <div key={i} className="aspect-[16/10] rounded-xl flex items-center justify-center" style={{ backgroundColor: "#16323b" }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-headline" style={{ backgroundColor: "rgba(156,240,255,0.12)", color: "#9CF0FF", fontWeight: 800 }}>
              {i}
            </span>
          </div>
        ))}
      </div>
      <p className="px-5 pb-3.5 text-[10px] font-bold font-headline" style={{ color: "rgba(156,240,255,0.65)" }}>
        One click from the room — no links, no logins.
      </p>
    </div>
  );
}

/* ── The section ───────────────────────────────────────────── */
export function TheRoom() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="The living experience"
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
        <div className="mt-8">
          <MockLiveGrid />
        </div>
      </div>
    </section>
  );
}
