import { DRAFT, EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, SectionHead } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M2 · HOW IT WORKS — "From two experts to one experience." Four moves,
 * each = copy + a faithful mini-mock of the real surface:
 *   01 Pick your complement  (create/invite scene)
 *   02 Design it together    (workspace — real draft data)
 *   03 One handshake, on record (contract — real hash + lock date)
 *   04 Publish. It's real.   (the buyer card, compact)
 * The fifth move (money) is the next section — the header sets that up.
 */

const CHECK = (color: string) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function MoveCopy({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
        Move {n}
      </p>
      <h3
        className="text-2xl md:text-3xl font-headline tracking-tight mb-4"
        style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {title}
      </h3>
      <p className="text-base md:text-lg leading-relaxed max-w-md" style={{ color: MUTED }}>
        {children}
      </p>
    </div>
  );
}

/* ── 01 · Invite scene ─────────────────────────────────────── */
function MockInvite() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4" aria-hidden>
      {/* You */}
      <div
        className="relative rounded-3xl p-5 sm:p-6 text-center w-[150px] sm:w-[170px]"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,97,48,0.25)", boxShadow: CARD_SHADOW }}
      >
        <span
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline"
          style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800 }}
        >
          You · Owner
        </span>
        <span className="inline-block w-14 h-14 rounded-full overflow-hidden mt-2" style={{ border: "2px solid rgba(255,97,48,0.35)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <p className="text-sm font-headline mt-2" style={{ color: INK, fontWeight: 700 }}>{ALEX.name}</p>
        <p className="text-[9px] uppercase tracking-widest font-headline" style={{ color: ORANGE, fontWeight: 700 }}>{ALEX.tag}</p>
      </div>

      {/* One invitation */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-[8px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 800 }}>Invite</span>
      </div>

      {/* The complement */}
      <div
        className="relative rounded-3xl p-5 sm:p-6 text-center w-[150px] sm:w-[170px]"
        style={{ backgroundColor: "rgba(255,255,255,0.85)", border: "1px solid rgba(8,145,178,0.28)", boxShadow: CARD_SHADOW }}
      >
        <span
          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline"
          style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800 }}
        >
          {CHECK(CYAN)} Accepted
        </span>
        <span className="inline-block w-14 h-14 rounded-full overflow-hidden mt-2" style={{ border: "2px solid rgba(8,145,178,0.35)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <p className="text-sm font-headline mt-2" style={{ color: INK, fontWeight: 700 }}>{MIRA.name}</p>
        <p className="text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 700 }}>{MIRA.tag}</p>
      </div>
    </div>
  );
}

/* ── 02 · Workspace (real draft) ───────────────────────────── */
function MockWorkspace() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <p className="text-[13px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{DRAFT.title}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, backgroundColor: "rgba(15,34,41,0.05)", fontWeight: 800 }}>
            Draft
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
            {CHECK("#16a34a")} Saved
          </span>
        </div>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4">
        {/* left: promise + arc */}
        <div className="space-y-4 min-w-0">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
            <div className="rounded-xl px-3 py-2.5 text-[12px] font-semibold leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK }}>
              {DRAFT.promise}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>Weekly arc</p>
            <div className="space-y-1.5">
              {DRAFT.arc.map((theme, i) => (
                <div key={theme} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "rgba(8,145,178,0.05)" }}>
                  <span className="shrink-0 text-[9px] font-black font-headline w-6" style={{ color: CYAN }}>W{i + 1}</span>
                  <span className="text-[11px] font-bold font-headline truncate" style={{ color: INK }}>{theme}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* right: team + chat */}
        <div className="space-y-4 min-w-0">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The team · who handles what</p>
            <div className="space-y-2">
              {[
                { p: ALEX, role: "Owner", color: ORANGE, topics: DRAFT.alexTopics, count: 10 },
                { p: MIRA, role: "Co-host", color: CYAN, topics: DRAFT.miraTopics, count: 4 },
              ].map(({ p, role, color, topics, count }) => (
                <div key={p.name} className="rounded-xl p-2.5" style={{ backgroundColor: "#FAFAF7", border: `1px solid ${color}1f` }}>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                    </span>
                    <span className="text-[11px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                    <span className="text-[8px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 800 }}>{role}</span>
                    <span className="ml-auto text-[9px] font-bold font-headline shrink-0" style={{ color: FAINT }}>{count} sessions</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {topics.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}14` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>Team chat</p>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3 py-2 text-[11px] font-medium" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                I&apos;ll take the Thursday nutrition sessions — added my topics ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 03 · Contract (real hash + date) ──────────────────────── */
function MockContract() {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }} aria-hidden>
      <div className="px-6 pt-5 pb-4 text-center" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <p className="text-[9px] uppercase tracking-[0.28em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>INFITRA</p>
        <p className="text-[15px] font-headline tracking-tight mt-0.5" style={{ color: INK, fontWeight: 800 }}>
          Collaboration Agreement
        </p>
        <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
          {CHECK("#16a34a")} v1 · Locked
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {/* parties + split bar */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ORANGE}59` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <span className="text-[11px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>
              {ALEX.name} <span style={{ color: ORANGE }}>· Owner · {EX.split.owner}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-headline truncate text-right" style={{ color: INK, fontWeight: 800 }}>
              <span style={{ color: CYAN }}>{EX.split.cohost}% · Co-host ·</span> {MIRA.name}
            </span>
            <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${CYAN}59` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
            </span>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex mb-5" style={{ backgroundColor: "rgba(15,34,41,0.05)" }}>
          <div style={{ width: `${EX.split.owner}%`, backgroundColor: ORANGE }} />
          <div style={{ width: `${EX.split.cohost}%`, backgroundColor: CYAN }} />
        </div>

        {/* terms */}
        <div className="space-y-1.5 mb-5">
          {[
            "Revenue split applies to every sale — booked automatically",
            `${EX.sessions} live sessions · ${EX.dates} 2027 · CHF ${EX.priceChf}`,
            "Any term change resets acceptance — both sign again",
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: MUTED }}>
              <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN)}</span>
              {t}
            </div>
          ))}
        </div>

        {/* signatures */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { p: ALEX, action: "Locked", color: ORANGE },
            { p: MIRA, action: "Accepted", color: CYAN },
          ].map(({ p, action, color }) => (
            <div key={p.name} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
              <p className="text-[15px] leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>
                {p.name}
              </p>
              <p className="text-[9px] uppercase tracking-widest font-headline mt-1.5 flex items-center gap-1" style={{ color, fontWeight: 800 }}>
                {CHECK(color)} {action} · {EX.lockedDate}
              </p>
            </div>
          ))}
        </div>

        {/* hash */}
        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
          <span className="text-[9.5px] font-mono truncate" style={{ color: MUTED }}>
            SHA-256 · {EX.sha}…
          </span>
          <span className="text-[8px] uppercase tracking-widest font-headline shrink-0" style={{ color: FAINT, fontWeight: 800 }}>
            Tamper-evident
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── The section ───────────────────────────────────────────── */
export function FourMoves() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title="From two experts to one experience."
          sub="Four moves. The fifth happens by itself."
        />

        <div className="space-y-20 md:space-y-24">
          {/* 01 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <MoveCopy n="01" title="Pick your complement.">
              Trainer × nutritionist. Physio × strength. Yoga × mindset. One invitation starts
              a shared draft with the expert who completes what you teach.
            </MoveCopy>
            <MockInvite />
          </div>

          {/* 02 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="md:order-2">
              <MoveCopy n="02" title="Design it together.">
                One workspace for the promise, the weekly arc, every session, and who handles
                what — co-edited live, with your team chat right beside it.
              </MoveCopy>
            </div>
            <div className="md:order-1">
              <MockWorkspace />
            </div>
          </div>

          {/* 03 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <MoveCopy n="03" title="One handshake, on record.">
              The workspace locks into a contract: split, terms, schedule — signed by both,
              sealed with a hash. Change a term later and acceptance resets. Nobody&apos;s split
              moves without a new handshake.
            </MoveCopy>
            <MockContract />
          </div>

          {/* 04 */}
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="md:order-2">
              <MoveCopy n="04" title="Publish. It's real.">
                One publish creates your experience page with checkout, receipts and calendar —
                no website, no funnel tools. Payments by Stripe, in CHF.
              </MoveCopy>
              <div className="flex flex-wrap gap-2 mt-5" aria-hidden>
                {["Payments by Stripe", "CHF", "Receipts + calendar included"].map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full text-[10px] font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.20)", fontWeight: 800 }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:order-1 relative max-w-sm mx-auto w-full">
              <MockBuyerCard compact />
              <span
                className="absolute -top-3 -right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-headline"
                style={{ backgroundColor: "rgba(15,34,41,0.92)", color: "#4ade80", fontWeight: 800, boxShadow: "0 8px 24px rgba(15,34,41,0.20)" }}
                aria-hidden
              >
                {CHECK("#4ade80")} Published
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
