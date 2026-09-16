import { INK, ORANGE, CYAN, MUTED, SectionHead } from "../ui";
import { Reveal } from "../Reveal";

/**
 * M7b · HOW JOINING WORKS (11 Sep 2026): the ask, and the smallest version
 * of it. Everything above proves what a collaboration becomes; this says
 * what is asked for today, a profile and nothing else, and what comes back.
 *
 * Sits after the proof on purpose: proof, then mechanism, then the closing
 * ask. The state of the network is shown in the hero, where the profiles are,
 * and the split is shown once, up in the model section, so this section only
 * ever explains the mechanism.
 *
 * No counts and no dates anywhere.
 */
const STEPS = [
  {
    n: "01",
    t: "You apply.",
    d: "Every application is read personally, and you hear back within a week. If it fits, your personal invitation follows, and the profile itself takes about fifteen minutes: what you bring, and who you would want next to you.",
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
    <section id="network" className="px-6 py-20 md:py-28">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="How joining works"
          title={<>Joining costs a profile, <span style={{ color: CYAN }}>and nothing else.</span></>}
          sub="No upfront cost, no subscription, no lock-in. Your audience and your clients stay entirely yours."
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

      </div>
    </section>
  );
}
