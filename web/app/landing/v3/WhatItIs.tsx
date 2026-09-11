import { INK, ORANGE, CYAN, MUTED, SectionHead } from "../ui";
import { Reveal } from "../Reveal";

/**
 * M2 · WHAT AN INFITRA EXPERIENCE IS (11 Sep 2026).
 *
 * The hero says what the opportunity is and what INFITRA provides. This is
 * the beat right after: what the thing actually looks like, which the brand
 * requires no later than the third beat, and what it costs you to try, which
 * is the objection every supplier raises second. The independence line closes
 * it: the reader has just been told what they get, so the sentence that says
 * they give up nothing lands as legitimacy rather than as a disclaimer.
 *
 * It ends on the lead-in to the example, so the showcase below opens as an
 * invited deep dive rather than a new chapter.
 */
const FACTS = [
  {
    accent: ORANGE,
    label: "You lead your half.",
    body: "Your complement leads theirs, and both parts stay at full depth.",
  },
  {
    accent: CYAN,
    label: "Everything around it, provided.",
    body: "The page with checkout, the live rooms and the tribe space.",
  },
  {
    accent: ORANGE,
    label: "You keep 90% of every sale.",
    body: "Split as you agree. INFITRA's founding fee is the remaining 10%.",
  },
  {
    accent: CYAN,
    label: "Recorded before anything sells.",
    body: "The revenue split is written into a transparent agreement both sides accept.",
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
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-7 max-w-4xl mx-auto">
            {FACTS.map((f) => (
              <div key={f.label}>
                <span className="block w-9 h-[2px] rounded-full mb-3" style={{ backgroundColor: f.accent }} />
                <p className="text-[15px] font-headline" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {f.label}
                </p>
                <p className="text-[14.5px] leading-relaxed mt-1.5" style={{ color: MUTED }}>
                  {f.body}
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
