import { INK, ORANGE, CYAN, MUTED, ApplyCTA } from "./ui";
import { HeroWaitlist } from "./HeroWaitlist";

/**
 * M1 · HERO — clarity first, then your door.
 *
 * The H1 is now the plain, uncapped definition of what INFITRA is —
 * complementary experts combining into one live experience (2+, never a hard
 * "two"). The deck itemizes what INFITRA truthfully runs (rooms, tribe space,
 * marketing page + checkout, automatic split — NOT sales/traffic). The couplet
 * ("From isolation to collaboration. From content to experience.") moved out
 * to the two chapter intros as cliffhangers, reunited at the finale. The
 * pilot's pair-specifics live in the CTA microcopy, not the masthead.
 */
export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* The pilot context — small eyebrow above the definition */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-7"
          style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
            Closed pilot · Applications open
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

        <p className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-9" style={{ color: MUTED }}>
          Team up with experts who complement you and deliver one seamless live experience for
          your audience. INFITRA provides everything around that: the live rooms, the tribe
          space, the marketing page with checkout, the collaboration contract and the revenue
          splitting, <span style={{ color: INK, fontWeight: 600 }}>so you can focus on the experience.</span>
        </p>

        <ApplyCTA micro="5 founding pairs · reviewed individually · starting now" />

        {/* The quiet second door — extends into the form right here */}
        <HeroWaitlist />
      </div>
    </section>
  );
}
