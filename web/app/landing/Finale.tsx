import { INK, ORANGE, MUTED, FAINT, ApplyCTA } from "./ui";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

/**
 * M8 · THE FINALE — one ask (rewritten 11 Sep 2026).
 *
 * The page used to close on two doors of equal weight, experts and
 * participants. Participants have nothing to buy until experiences exist,
 * so building that demand first was the wrong order. The close is now the
 * single supply-side ask, with the participant line kept quiet underneath
 * so a curious visitor still has somewhere to go.
 */
export function Finale() {
  return (
    <section id="join" className="px-6 pt-20 pb-24" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 16%, rgba(255,255,255,0.45) 100%)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <p
          className="text-xl md:text-2xl font-headline tracking-tight mb-3"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          One live experience, <span style={{ color: ORANGE }}>built by two.</span>
        </p>
        <h2
          className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.12] md:leading-[1.02] mb-5"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Join the <span style={{ color: ORANGE }}>founding network.</span>
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: MUTED }}>
          Experts, studios and gyms, open to creating together. A profile takes
          about fifteen minutes, nothing is binding, and you hear from us the
          moment a profile fits yours.
        </p>

        <Reveal>
          <ApplyCTA xl micro="Every profile is reviewed personally." />
        </Reveal>

        {/* The quiet participant line: no door of its own, but not a dead end. */}
        <div className="mt-16 pt-8 max-w-md mx-auto" style={{ borderTop: "1px solid rgba(15,34,41,0.10)" }}>
          <p className="text-sm mb-4" style={{ color: FAINT }}>
            Not an expert or a studio? Leave your email and you are first in
            when the experiences open.
          </p>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
