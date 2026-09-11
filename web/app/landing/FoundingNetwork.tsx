import { INK, ORANGE, CYAN, MUTED, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

/**
 * M7b · THE FOUNDING NETWORK (new, 11 Sep 2026) — the actual offer, and the
 * smallest version of it.
 *
 * Everything above this proves what a collaboration becomes. This section
 * says what is being asked for today, which is a profile and nothing else,
 * and what comes back: a personal introduction when a fit appears, the
 * founding badge, and terms that stay. The terms live here rather than in
 * the hero, because the architecture is tension, opportunity, the thing,
 * the mechanism, and only then the deal.
 *
 * No counts and no dates anywhere: a public number is a countable failure
 * state before there is traction.
 */
const STEPS = [
  {
    n: "01",
    t: "Your profile.",
    d: "About fifteen minutes. What you bring, and what would complement it. It is live in the network the moment you save it, and you can change it any time.",
  },
  {
    n: "02",
    t: "We come to you.",
    d: "When a profile fits yours, you hear from us personally. Nothing binding, nothing to run, and nothing happens publicly about you without your word.",
  },
  {
    n: "03",
    t: "Yours to keep.",
    d: "The founding member badge stays on your profile when INFITRA opens publicly, founding profiles hold the top spot in discovery, and your audience stays yours.",
  },
];

export function FoundingNetwork() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="The founding network"
          title={<>Be in the picture <span style={{ color: CYAN }}>before anything starts.</span></>}
          sub="The network is where the right pairing is found. Experts, studios and gyms, open to creating together. Joining costs a profile and nothing else."
        />

        <Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl p-6 md:p-7 text-left"
                style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 10px 32px rgba(15,34,41,0.08)" }}
              >
                <span className="text-[11px] font-headline tracking-[0.2em]" style={{ color: ORANGE, fontWeight: 800 }}>
                  {s.n}
                </span>
                <h3 className="text-xl font-headline tracking-tight mt-2.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {s.t}
                </h3>
                <p className="text-[15px] mt-2.5 leading-relaxed" style={{ color: MUTED }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The deal, last and plain, led by what experts keep. */}
        <Reveal>
          <div
            className="mt-5 rounded-3xl px-6 py-7 md:px-9 md:py-8 text-center"
            style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: "0 0 0 1px rgba(8,145,178,0.20)" }}
          >
            <p className="text-xl md:text-2xl font-headline" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Experts keep <span style={{ color: ORANGE }}>90%</span> of every sale, split as you agree.
            </p>
            <p className="text-sm mt-3 leading-relaxed" style={{ color: MUTED }}>
              No upfront cost, no subscription, no lock-in. Your audience and
              your clients stay entirely yours.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
