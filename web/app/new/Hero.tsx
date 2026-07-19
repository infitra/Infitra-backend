import { INK, ORANGE, CYAN, MUTED, ApplyCTA } from "./ui";
import { HeroWaitlist } from "./HeroWaitlist";

/**
 * M1 · HERO — the movement, then your role in it.
 *
 * H1 is the umbrella couplet: two "from → to" axes, one per audience —
 * isolation → collaboration (creators, orange), content you consume →
 * experiences you join (participants, cyan). The creator claim demotes to a
 * second-level block that owns the Apply CTA; the waitlist whisper extends
 * inline for participants. One-second read: movement first, your door second.
 */
export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        <div className="flex items-center gap-3 mb-7 max-w-2xl w-full">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center shrink-0" style={{ color: CYAN, fontWeight: 700 }}>
            The platform for live, co-created fitness experiences
          </p>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
        </div>

        {/* The movement — everyone's headline. The "from" halves stay light
           so only the destinations carry weight: the line reads as motion. */}
        <h1
          className="text-3xl md:text-[3.25rem] md:leading-[1.18] font-headline tracking-tight leading-snug mb-12"
          style={{ letterSpacing: "-0.025em" }}
        >
          <span style={{ color: "rgba(15,34,41,0.48)", fontWeight: 600 }}>From isolation to</span>{" "}
          <span style={{ color: ORANGE, fontWeight: 700 }}>collaboration.</span>
          <br />
          <span style={{ color: "rgba(15,34,41,0.48)", fontWeight: 600 }}>From consuming content to</span>{" "}
          <span style={{ color: CYAN, fontWeight: 700 }}>participating in experiences.</span>
        </h1>

        {/* The creator act — the claim that owns the CTA */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "1px solid rgba(8,145,178,0.25)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
          <span className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline" style={{ fontWeight: 700 }}>
            Closed pilot · Applications open
          </span>
        </div>

        <h2
          className="text-xl md:text-3xl font-headline tracking-tight leading-tight max-w-2xl mb-5"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Build an experience beyond what you can offer alone.
        </h2>

        <p className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-9" style={{ color: MUTED }}>
          Combine your expertise with a complementary expert and deliver it as one seamless
          live experience — the platform runs everything around it. You coach.
        </p>

        <ApplyCTA micro="5 founding pairs · reviewed individually · starting now" />

        {/* The quiet second door — extends into the form right here */}
        <HeroWaitlist />
      </div>
    </section>
  );
}
