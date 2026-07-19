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
        {/* The movement — the page opens on the manifesto, nothing above it.
           Two matched stanzas, full ink, only the destinations colored. */}
        <h1
          className="text-4xl md:text-[3.9rem] md:leading-[1.12] font-headline tracking-tight leading-tight mb-14"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          From isolation to <span style={{ color: ORANGE }}>collaboration.</span>
          <br />
          From content to <span style={{ color: CYAN }}>experience.</span>
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
