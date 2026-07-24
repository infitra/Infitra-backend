import { INK, ORANGE, CYAN, MUTED, FAINT, ApplyCTA } from "./ui";
import { HeroWaitlist } from "./HeroWaitlist";

/**
 * M1 · HERO — the whole proposition, graspable without scrolling.
 *
 * Outreach feedback: the demo is great but demands a scroll, and some people
 * bounce before the payoff. So the hero now stands on its own — headline,
 * a SHORT deck (the five-item feature list moved out; the demo below proves
 * it, in full), the deal led by what experts KEEP (90%, not the 10% cut),
 * the CTA, and a scroll cue that names the reward. A no-scroll visitor still
 * gets: who it's for, the offer, and a way to say yes.
 */
export function Hero() {
  // svh on mobile so the centered content fits the VISIBLE viewport (the area
  // above the URL bar), not the taller vh box — otherwise the hero's lower
  // content, incl. the opened waitlist form, hides under the bar.
  return (
    <section className="relative min-h-svh lg:min-h-[92vh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* The pilot context — small eyebrow above the definition */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
          style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
            Founding pilot · only 5 pairs
          </span>
        </div>

        {/* The definition — uncapped ("complementary experts", not "two"),
           concrete (live, fitness, one experience). Both brand colours carry
           the title as two WHOLE lines: the orange expert line, then the
           full cyan experience line ("one" included — a lone ink word inside
           the cyan phrase read as a glitch). Same break on every viewport. */}
        <h1
          className="font-headline tracking-tight leading-[1.12] mb-8 max-w-4xl"
          style={{ color: INK, fontWeight: 600, letterSpacing: "-0.025em", fontSize: "clamp(2rem, 4.6vw, 3.5rem)" }}
        >
          <span className="block" style={{ color: ORANGE, fontWeight: 700 }}>Complementary experts,</span>
          <span className="block" style={{ color: CYAN, fontWeight: 700 }}>one live fitness experience.</span>
        </h1>

        {/* Short deck — one breath. The five-item feature list moved to the
           demo, which proves it in full. */}
        <p className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-8" style={{ color: MUTED }}>
          Team up with a complementary expert to run one live experience for your audience.
          INFITRA handles everything around it,
          <span style={{ color: INK, fontWeight: 600 }}> so you just show up.</span>
        </p>

        {/* The deal, led by what experts KEEP — 90% reads far better than a
           10% cut. The fee is still disclosed, just second. */}
        <div className="mb-9">
          <p className="text-xl md:text-2xl font-headline" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}>
            You and your partner keep <span style={{ color: ORANGE }}>90%</span> of revenue.
          </p>
          <p className="text-[13px] sm:text-sm mt-2" style={{ color: MUTED }}>
            No upfront cost, no subscription. Founding 10% platform fee.
          </p>
        </div>

        <ApplyCTA />

        {/* The quiet second door — extends into the form right here */}
        <HeroWaitlist />

        {/* Scroll cue — names the reward so the demo reads as an invited
           deep-dive, not a mandatory slog. */}
        <div className="mt-12 flex flex-col items-center gap-1.5" style={{ color: FAINT }} aria-hidden>
          <span className="text-[11px] uppercase tracking-[0.22em] font-headline" style={{ fontWeight: 700 }}>
            See how it works
          </span>
          <svg className="animate-bounce" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
