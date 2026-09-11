import { INK, ORANGE, CYAN, MUTED, FAINT, ApplyCTA } from "../ui";

/**
 * M1 · HERO for the staging landing (11 Sep 2026): the tension, the
 * definition, the unit, then the ask.
 *
 * The live hero opens on the product and the terms. This one opens on the
 * tension every expert and every studio owner feels (beat one), says in one
 * line what INFITRA is, with the noun "collaboration" in the definition slot
 * where a category word belongs and never in the promise, states the unit by
 * beat three because the brand requires it there, and asks for the small
 * thing. Terms live in the founding-network section. No per-side sentences
 * here: the three winners follow one viewport down.
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
          experts, studios and gyms create one live experience together, online.
        </p>

        {/* The unit, by beat three. */}
        <p className="text-[15px] md:text-lg max-w-2xl mx-auto leading-relaxed mb-9" style={{ color: INK, fontWeight: 600 }}>
          One experience runs over several weeks: the people who join buy once,
          meet you live on video, and stay connected in a group in between.
        </p>

        <ApplyCTA label="Join the founding network" micro="Experts, studios and gyms. A profile takes fifteen minutes, and nothing is binding." />

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
