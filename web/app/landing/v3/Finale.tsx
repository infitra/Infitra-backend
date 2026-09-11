import { INK, ORANGE, MUTED, FAINT, ApplyCTA } from "../ui";
import { Reveal } from "../Reveal";
import { WaitlistForm } from "../WaitlistForm";

/**
 * M8 · THE FINALE (11 Sep 2026): one ask. The kicker bookends the hero's
 * line. Participants have nothing to buy until experiences exist, so they
 * keep one quiet line under the ask instead of a door of their own.
 * The id "join" stays: LiveWeek's mobile Join button scrolls to it.
 */
export function Finale() {
  return (
    <section id="join" className="px-6 pt-20 pb-24" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 16%, rgba(255,255,255,0.45) 100%)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-xl md:text-2xl font-headline tracking-tight mb-3"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          Offer more <span style={{ color: ORANGE }}>without becoming everything.</span>
        </p>
        <h2
          className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.12] md:leading-[1.02] mb-5"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Join the <span style={{ color: ORANGE }}>founding network.</span>
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: MUTED }}>
          Experts, studios and gyms, open to creating together. A profile takes
          about fifteen minutes, nothing is binding, and when a profile fits
          yours, you hear from us personally.
        </p>

        <Reveal>
          <ApplyCTA label="Join the founding network" xl micro="Every profile is reviewed personally." />
        </Reveal>

        <div className="mt-16 pt-8 max-w-md mx-auto" style={{ borderTop: "1px solid rgba(15,34,41,0.10)" }}>
          <p className="text-sm mb-4" style={{ color: FAINT }}>
            Here to join one, not to build one? Leave your email and you are
            first in when the experiences open.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
