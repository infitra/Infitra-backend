import { INK, ORANGE, CYAN, MUTED, FAINT, ApplyCTA } from "../ui";

/**
 * M1 · HERO for the staging landing (11 Sep 2026): the tension, the
 * definition, the unit, then the ask.
 *
 * The live hero opens on the product and the terms. This one opens on the
 * tension every expert and every studio owner feels (beat one), says in one
 * line what INFITRA is, with the noun "collaboration" in the definition slot
 * where a category word belongs and never in the promise, states the unit by
 * beat three because the brand requires it there, and then asks.
 *
 * The ask sits directly under the unit, and the how sits BELOW the ask: the
 * infrastructure is the objection killer, never the hook, so it comes after
 * the opportunity, not before it (BRAND.md, beat four). The micro carries the
 * truth that makes this a position rather than a signup: accounts are
 * invite-only, you apply, and the invitation is personal.
 *
 * Terms live in the founding-network section. No per-side sentences here:
 * the three winners follow one viewport down.
 */
export function Hero() {
  // svh on mobile so the centered content fits the VISIBLE viewport (the area
  // above the URL bar), not the taller vh box.
  return (
    <section className="relative min-h-svh lg:min-h-[92vh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
          style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
            The founding network is forming
          </span>
        </div>

        {/* The tension, in the brand's own words: one whole line per colour,
           the same break on every viewport. */}
        <h1
          className="font-headline tracking-tight leading-[1.12] mb-8 max-w-4xl"
          style={{ color: INK, fontWeight: 600, letterSpacing: "-0.025em", fontSize: "clamp(2rem, 4.6vw, 3.5rem)" }}
        >
          <span className="block" style={{ color: ORANGE, fontWeight: 700 }}>Offer more</span>
          <span className="block" style={{ color: CYAN, fontWeight: 700 }}>without becoming everything.</span>
        </h1>

        {/* The definition: the category word in the one place it belongs. */}
        <p data-definition className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-4" style={{ color: MUTED }}>
          INFITRA makes professional collaboration in fitness and health easy:
          experts, studios and gyms create live experiences together that none
          of them could run alone.
        </p>

        {/* The unit, by beat three. */}
        <p className="text-[15px] md:text-lg max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: INK, fontWeight: 600 }}>
          Each one runs online over several weeks. The people who join buy
          once, meet you live on video every week, and stay connected in their
          tribe space in between.
        </p>

        <ApplyCTA xl label="Join the founding network" micro="Invite only. Apply, and if it fits, your personal invitation follows." />

        {/* Beat four, deliberately after the ask. */}
        <p data-how className="text-[13px] md:text-sm max-w-xl mx-auto leading-relaxed mt-8" style={{ color: MUTED }}>
          INFITRA provides the infrastructure and the revenue split, recorded in
          a transparent agreement before anything sells.
        </p>

        <div className="mt-12 flex flex-col items-center gap-1.5" style={{ color: FAINT }} aria-hidden>
          <span className="text-[11px] uppercase tracking-[0.22em] font-headline" style={{ fontWeight: 700 }}>
            See who it is for
          </span>
          <svg className="animate-bounce" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
