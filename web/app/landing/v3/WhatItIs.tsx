import { INK, ORANGE, CYAN, MUTED, SectionHead } from "../ui";
import { Reveal } from "../Reveal";
import { ExperienceChips } from "./ExperienceChips";

/**
 * M2 · WHAT AN INFITRA EXPERIENCE IS (12 Sep 2026).
 *
 * The hero says what the opportunity is and what INFITRA provides. This is
 * the beat right after: what the thing actually is, which the brand requires
 * no later than the third beat. It shows it rather than describing it: the
 * live room, the tribe space and the weekly arc, ported small from the
 * surfaces the showcase opens in full further down.
 *
 * Then the two facts a supplier weighs: everything around it is provided,
 * and what they keep. The independence line closes the section, where it
 * lands as legitimacy under the benefits rather than as a disclaimer, and
 * the lead-in hands over to the example.
 */
const TERMS = [
  {
    accent: CYAN,
    label: "Everything around it, provided.",
    body: "The page with checkout, the live rooms and the tribe space. You bring the craft.",
  },
  {
    accent: ORANGE,
    label: "You keep 90% of every sale.",
    body: "Split as you agree. INFITRA's founding fee is the remaining 10%, recorded in a transparent agreement before anything sells.",
  },
];

export function WhatItIs() {
  return (
    <section id="what" className="px-6 pt-20 md:pt-24 pb-10 md:pb-12">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="What an INFITRA experience is"
          title={<>Online, over several weeks, <span style={{ color: ORANGE }}>bought once.</span></>}
          sub="The people who join meet you live on video every week, and stay connected in their tribe space in between."
        />

        <Reveal>
          <ExperienceChips />
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-7 mt-10 md:mt-12 max-w-4xl mx-auto">
            {TERMS.map((t) => (
              <div key={t.label}>
                <span className="block w-9 h-[2px] rounded-full mb-3" style={{ backgroundColor: t.accent }} />
                <p className="text-[15px] font-headline" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {t.label}
                </p>
                <p className="text-[14.5px] leading-relaxed mt-1.5" style={{ color: MUTED }}>
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 md:mt-14 pt-10 md:pt-12" style={{ borderTop: "1px solid rgba(15,34,41,0.10)" }}>
            <p
              data-independence
              className="text-center text-base md:text-lg leading-relaxed max-w-3xl mx-auto"
              style={{ color: INK, fontWeight: 600 }}
            >
              You stay independent and still work together professionally: with
              whom you choose, when it fits, no exclusivity, no subscription,
              and free to leave at any time.
            </p>
            <p className="mt-10 md:mt-12 text-center text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
              One of the two shapes, shown start to finish: two experts, six
              weeks, one tribe. A studio and an outside expert run the same
              way, for the studio&apos;s members.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
