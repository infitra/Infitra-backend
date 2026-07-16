import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, ApplyCTA } from "./ui";

/**
 * M3 · THE FIFTH MOVE — money, automatic. Faithful mock of the co-host-aware
 * earnings page: per-sale gross → platform → co-host → your cut, plus the
 * killer detail — Mira's view of the SAME sale, booked automatically.
 * The 10% pilot fee appears only as honest numbers (9.90 on 99.00), never
 * as a marketing headline.
 */

export function Money() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
        {/* Copy */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
            The fifth move · automatic
          </p>
          <h2
            className="text-3xl md:text-4xl font-headline tracking-tight mb-5"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Every franc, accounted.
          </h2>
          <p className="text-base md:text-lg leading-relaxed max-w-md" style={{ color: MUTED }}>
            The split from your contract books itself on every sale. You and your partner see
            the same numbers — per sale, in real time. No invoices between you. No trust math.
          </p>
        </div>

        {/* Earnings mock — Alex's view + Mira's overlapping view */}
        <div className="relative pb-14 sm:pb-12" aria-hidden>
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ORANGE}59` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <span className="text-[12px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>
                  Earnings · {ALEX.name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>Net</p>
                <p className="text-lg font-black font-headline leading-none" style={{ color: INK }}>CHF {EX.totals.net}</p>
              </div>
            </div>

            <div className="px-5 py-4 overflow-x-auto">
              <div className="min-w-[430px]">
                {/* column labels */}
                <div className="grid grid-cols-[1.6fr_repeat(4,1fr)] gap-2 pb-2 text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
                  <span>Sale</span>
                  <span className="text-right">Gross</span>
                  <span className="text-right">Platform</span>
                  <span className="text-right">Co-host</span>
                  <span className="text-right">Your cut</span>
                </div>
                {/* rows */}
                {[
                  { d: "12 Jan", hl: true },
                  { d: "11 Jan", hl: false },
                ].map(({ d, hl }) => (
                  <div
                    key={d}
                    className="grid grid-cols-[1.6fr_repeat(4,1fr)] gap-2 items-center rounded-xl px-2 py-2.5 -mx-2"
                    style={hl ? { backgroundColor: "rgba(255,97,48,0.05)", boxShadow: "inset 0 0 0 1px rgba(255,97,48,0.16)" } : undefined}
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold font-headline truncate" style={{ color: INK }}>{EX.title}</span>
                      <span className="block text-[9px]" style={{ color: FAINT }}>{d} · 1 seat</span>
                    </span>
                    <span className="text-right text-[11px] font-semibold tabular-nums" style={{ color: MUTED }}>{EX.sale.gross}</span>
                    <span className="text-right text-[11px] font-semibold tabular-nums" style={{ color: FAINT }}>−{EX.sale.platform}</span>
                    <span className="text-right text-[11px] font-semibold tabular-nums" style={{ color: CYAN }}>−{EX.sale.cohost}</span>
                    <span className="text-right text-[12px] font-black font-headline tabular-nums" style={{ color: INK }}>{EX.sale.mine}</span>
                  </div>
                ))}
                {/* totals */}
                <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3" style={{ backgroundColor: "#F8F6F0" }}>
                  <span className="text-[10px] font-bold font-headline" style={{ color: MUTED }}>
                    {EX.totals.sales} sales · CHF {EX.totals.gross} gross
                  </span>
                  <span className="text-[11px] font-black font-headline tabular-nums" style={{ color: INK }}>
                    → CHF {EX.totals.net} net to you
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mira's view — same sale, other side */}
          <div
            className="absolute -bottom-0 right-3 sm:right-6 rounded-2xl px-4 py-3 rotate-[0.6deg]"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(8,145,178,0.30), 0 16px 40px rgba(15,34,41,0.16)" }}
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${CYAN}59` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div>
                <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 800 }}>
                  {MIRA.first}&apos;s view · same sale
                </p>
                <p className="text-[13px] font-black font-headline leading-tight" style={{ color: INK }}>
                  + CHF {EX.sale.cohost} <span className="text-[9px] font-bold" style={{ color: FAINT }}>booked automatically ✓</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet mid-page CTA — the creator-side story just closed */}
      <div className="mt-20">
        <ApplyCTA small micro="5 founding pairs · starting now" />
      </div>
    </section>
  );
}
