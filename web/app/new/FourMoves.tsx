import { DRAFT, EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, PRODUCT_SHADOW, SectionHead, SplitBar } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M2 · HOW IT WORKS — one vertical rail (polish round 1). Every move is a
 * centered chapter: kicker + one line + ONE large conceptual mock at
 * app-scale type. Between moves, the rail carries the state that unlocks
 * the next move — the same team and the same experience flowing through:
 *
 *   01 pair —(Mira accepted)→ 02 design —(Design stands)→ 03 handshake
 *   —(Both signed)→ 04 publish —(Live now)→ the fifth move (money).
 *
 * DESIGN LAW: one concept per mock, nothing truncated, no number that
 * isn't the concept (60/40 only).
 */

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── The rail — a state chip between two line segments ─────── */
function RailLink({ label, live = false }: { label: string; live?: boolean }) {
  return (
    <div className="flex flex-col items-center py-3" aria-hidden>
      <span className="w-px h-12" style={{ backgroundColor: "rgba(8,145,178,0.35)" }} />
      <span
        className="my-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline"
        style={{
          backgroundColor: "#FFFFFF",
          color: live ? "#ef4444" : INK,
          fontWeight: 800,
          boxShadow: "0 0 0 1px rgba(8,145,178,0.22), 0 6px 18px rgba(15,34,41,0.08)",
        }}
      >
        {live ? <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> : CHECK("#16a34a", 11)}
        {label}
      </span>
      <span className="w-px h-12" style={{ backgroundColor: "rgba(8,145,178,0.35)" }} />
    </div>
  );
}

/* ── A move chapter — centered kicker + one line + the mock ── */
function Move({
  n,
  title,
  copy,
  children,
  after,
}: {
  n: string;
  title: string;
  copy: React.ReactNode;
  children: React.ReactNode;
  after?: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col items-center text-center">
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-2.5" style={{ color: CYAN, fontWeight: 700 }}>
        Move {n}
      </p>
      <h3
        className="text-2xl md:text-3xl font-headline tracking-tight mb-3"
        style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {title}
      </h3>
      <p className="text-base md:text-lg leading-relaxed max-w-xl" style={{ color: MUTED }}>
        {copy}
      </p>
      {after}
      <div className="w-full mt-9">{children}</div>
    </div>
  );
}

/* ── 01 · The pairing ──────────────────────────────────────── */
function PairMock() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 max-w-lg mx-auto" aria-hidden>
      <div
        className="relative flex-1 rounded-3xl px-4 py-7 text-center"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(255,97,48,0.22)", boxShadow: CARD_SHADOW }}
      >
        <span
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800 }}
        >
          You
        </span>
        <span className="inline-block w-20 h-20 rounded-full overflow-hidden" style={{ border: "2.5px solid rgba(255,97,48,0.40)", boxShadow: "0 6px 20px rgba(255,97,48,0.18)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <p className="text-[15px] font-headline mt-3" style={{ color: INK, fontWeight: 800 }}>{ALEX.name}</p>
        <p className="text-[10px] uppercase tracking-widest font-headline mt-0.5" style={{ color: ORANGE, fontWeight: 800 }}>{ALEX.tag}</p>
      </div>

      <span
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>

      <div
        className="relative flex-1 rounded-3xl px-4 py-7 text-center"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(8,145,178,0.25)", boxShadow: CARD_SHADOW }}
      >
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800 }}
        >
          {CHECK(CYAN, 10)} Accepted
        </span>
        <span className="inline-block w-20 h-20 rounded-full overflow-hidden" style={{ border: "2.5px solid rgba(8,145,178,0.40)", boxShadow: "0 6px 20px rgba(8,145,178,0.18)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <p className="text-[15px] font-headline mt-3" style={{ color: INK, fontWeight: 800 }}>{MIRA.name}</p>
        <p className="text-[10px] uppercase tracking-widest font-headline mt-0.5" style={{ color: CYAN, fontWeight: 800 }}>{MIRA.tag}</p>
      </div>
    </div>
  );
}

/* ── 02 · The workspace — promise with a live co-editing cursor ── */
function WorkspaceMock() {
  return (
    <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* header — draft name + presence */}
      <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <p className="text-[15px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{DRAFT.title}</p>
          <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, backgroundColor: "rgba(15,34,41,0.05)", fontWeight: 800 }}>
            Draft
          </span>
        </div>
        <div className="flex -space-x-1.5 shrink-0">
          {[ALEX.avatar, MIRA.avatar].map((a) => (
            <span key={a} className="relative w-7 h-7 rounded-full overflow-hidden" style={{ border: "2px solid #FFFFFF" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a} alt="" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e", border: "1.5px solid #FFFFFF" }} />
            </span>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* the promise — big, with Mira's live cursor */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>
            The promise
          </p>
          <div className="rounded-2xl px-5 py-4" style={{ backgroundColor: "#F8F6F0" }}>
            <p className="text-[16px] md:text-[17px] font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>
              {DRAFT.promise}
              <span className="inline-block align-middle w-[2px] h-[1.15em] ml-0.5 animate-pulse" style={{ backgroundColor: CYAN }} />
              <span
                className="inline-block align-middle ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest text-white font-headline"
                style={{ backgroundColor: CYAN, fontWeight: 800 }}
              >
                {MIRA.first}
              </span>
            </p>
          </div>
        </div>

        {/* who owns what */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>
            Who owns what
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { p: ALEX, role: "Owner", color: ORANGE, topics: DRAFT.alexTopics },
              { p: MIRA, role: "Co-host", color: CYAN, topics: DRAFT.miraTopics },
            ].map(({ p, role, color, topics }) => (
              <div key={p.name} className="rounded-2xl p-4" style={{ backgroundColor: "#FAFAF7", border: `1px solid ${color}22` }}>
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 w-9 h-9 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span>
                    <span className="block text-[13px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                    <span className="block text-[9px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 800 }}>{role}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {topics.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-[10.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* one chat beat */}
        <div className="flex items-start gap-2.5">
          <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
          </span>
          <div className="rounded-2xl rounded-tl-md px-4 py-2.5 text-[13px] font-medium" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
            I&apos;ll take the Thursday nutrition sessions ✓
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 03 · The handshake — the split + two signatures ───────── */
function ContractMock() {
  return (
    <div className="max-w-xl mx-auto rounded-3xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <div className="px-6 pt-6 pb-5 text-center" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <p className="text-[9px] uppercase tracking-[0.28em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>INFITRA</p>
        <p className="text-[19px] font-headline tracking-tight mt-1" style={{ color: INK, fontWeight: 800 }}>
          Collaboration Agreement
        </p>
        <span
          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}
        >
          {CHECK("#16a34a", 11)} Locked
        </span>
      </div>

      <div className="p-6 md:p-7 space-y-6">
        <SplitBar
          left={{ avatar: ALEX.avatar, name: ALEX.name, role: "Owner", pct: EX.split.owner, color: ORANGE }}
          right={{ avatar: MIRA.avatar, name: MIRA.name, role: "Co-host", pct: EX.split.cohost, color: CYAN }}
        />

        <div className="grid grid-cols-2 gap-4">
          {[
            { p: ALEX, color: ORANGE },
            { p: MIRA, color: CYAN },
          ].map(({ p, color }) => (
            <div key={p.name} className="rounded-2xl px-4 py-4" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
              <p className="text-[17px] leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>
                {p.name}
              </p>
              <p className="text-[9.5px] uppercase tracking-widest font-headline mt-2 flex items-center gap-1" style={{ color, fontWeight: 800 }}>
                {CHECK(color, 11)} Signed
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 04 · Published — your page, live on the web ───────────── */
function PublishMock() {
  return (
    <div className="max-w-xl mx-auto rounded-2xl overflow-hidden" style={{ boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* browser chrome */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#E9E5DC" }}>
        <span className="flex gap-1.5 shrink-0">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.16)" }} />
          ))}
        </span>
        <span className="flex-1 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 min-w-0" style={{ backgroundColor: "#FFFFFF" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
            <rect x="3.5" y="11" width="17" height="10" rx="2" />
            <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
          </svg>
          <span className="text-[11.5px] font-medium truncate" style={{ color: MUTED }}>
            infitra.fit/experiences/your-experience
          </span>
        </span>
        <span
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ backgroundColor: "rgba(22,163,74,0.10)", color: "#16a34a", fontWeight: 800 }}
        >
          {CHECK("#16a34a", 10)} Published
        </span>
      </div>
      <MockBuyerCard compact frameless />
    </div>
  );
}

/* ── The section ───────────────────────────────────────────── */
export function FourMoves() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title="From two experts to one experience."
          sub="Four moves. The fifth happens by itself."
        />

        <div className="flex flex-col items-center">
          <Move n="01" title="Pick your complement." copy="Trainer × nutritionist. Physio × strength. One invitation starts your shared draft.">
            <PairMock />
          </Move>

          <RailLink label="Mira accepted" />

          <Move n="02" title="Design it together." copy="One workspace: the promise, the sessions, who owns what — co-edited live.">
            <WorkspaceMock />
          </Move>

          <RailLink label="Design stands" />

          <Move
            n="03"
            title="One handshake, on record."
            copy="The split, signed by both. Change a term later and acceptance resets — nobody's share moves without a new handshake."
          >
            <ContractMock />
          </Move>

          <RailLink label="Both signed" />

          <Move
            n="04"
            title="Publish. It's real."
            copy="One publish: your experience page, checkout included. No website, no funnel tools."
            after={
              <div className="flex flex-wrap justify-center gap-2 mt-4" aria-hidden>
                {["Payments by Stripe", "CHF", "Receipts + calendar included"].map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-full text-[10px] font-headline"
                    style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.08)", border: "1px solid rgba(8,145,178,0.20)", fontWeight: 800 }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            }
          >
            <PublishMock />
          </Move>

          <RailLink label="Live now" live />
        </div>
      </div>
    </section>
  );
}
