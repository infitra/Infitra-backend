import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, FAINT, PRODUCT_SHADOW, SectionHead, SplitBar, ApplyCTA } from "./ui";

/**
 * M3 · THE FIFTH MOVE — money, automatic (polish round 1: conceptual).
 * The SAME 60/40 bar from the contract reappears, now flowing money: one
 * sale → booked to both sides. No francs, no accounting rows — the split
 * you signed is the split that pays out. Economics stay quiet (pilot terms
 * carry the fee bullet).
 */

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function MoneyMock() {
  return (
    <div className="max-w-xl mx-auto rounded-3xl p-6 md:p-7 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* the trigger */}
      <div className="flex justify-center mb-6">
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline text-white"
          style={{ backgroundColor: INK, fontWeight: 800 }}
        >
          <span style={{ color: "#4ade80" }}>{CHECK("#4ade80", 11)}</span> New sale
        </span>
      </div>

      {/* the same bar from the handshake */}
      <SplitBar
        left={{ avatar: ALEX.avatar, name: ALEX.name, role: "Owner", pct: EX.split.owner, color: ORANGE }}
        right={{ avatar: MIRA.avatar, name: MIRA.name, role: "Co-host", pct: EX.split.cohost, color: CYAN }}
      />

      {/* booked to both sides */}
      <div className="mt-6 space-y-2.5">
        {[
          { p: ALEX, role: "Owner", pct: EX.split.owner, color: ORANGE },
          { p: MIRA, role: "Co-host", pct: EX.split.cohost, color: CYAN },
        ].map(({ p, role, pct, color }) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: `${color}0d`, boxShadow: `inset 0 0 0 1px ${color}26` }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 w-8 h-8 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <span className="text-[13px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>
                Booked to {p.first} <span style={{ color, fontWeight: 800 }}>· {role}</span>
              </span>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 text-[14px] font-black font-headline" style={{ color }}>
              {pct}% {CHECK("#16a34a", 12)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-[11.5px] font-bold font-headline mt-5" style={{ color: FAINT }}>
        Same numbers on both dashboards. No invoices between you.
      </p>
    </div>
  );
}

export function Money() {
  return (
    <section className="px-6 pt-10 pb-24">
      <div className="max-w-4xl mx-auto">
        <SectionHead
          eyebrow="The fifth move · automatic"
          title="Every franc, accounted."
          sub="The split from your handshake books itself on every sale. No invoices between you. No trust math."
        />
        <MoneyMock />

        {/* Quiet mid-page CTA — the creator-side story just closed */}
        <div className="mt-16">
          <ApplyCTA small micro="5 founding pairs · starting now" />
        </div>
      </div>
    </section>
  );
}
