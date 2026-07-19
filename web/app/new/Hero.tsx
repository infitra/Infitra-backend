import { INK, CYAN, MUTED, ApplyCTA } from "./ui";
import { HeroWaitlist } from "./HeroWaitlist";

/**
 * M1 · HERO — headline only (polish round 2). One centered claim, nothing
 * else competing. The proof ("What you can build") is its own section
 * directly below.
 */
export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        {/* The mission axis — the movement in one line, before the claim */}
        <div className="flex items-center gap-3 mb-6 max-w-2xl w-full">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center shrink-0" style={{ color: CYAN, fontWeight: 700 }}>
            From content you consume to experiences you join
          </p>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
            Closed pilot · Applications open
          </span>
        </div>

        <h1
          className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.05] max-w-3xl mb-6"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Build an experience beyond what you can offer alone.
        </h1>

        <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: MUTED }}>
          Combine your expertise with a complementary expert and deliver it as one seamless
          live experience — the platform runs everything around it. You coach.
        </p>

        <ApplyCTA micro="5 founding pairs · DACH · reviewed individually · starting now" />

        {/* The quiet second door — extends into the form right here */}
        <HeroWaitlist />
      </div>
    </section>
  );
}
