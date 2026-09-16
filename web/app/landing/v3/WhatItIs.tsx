import { ORANGE, MUTED, SectionHead } from "../ui";
import { Reveal } from "../Reveal";
import { ExperienceChips } from "./ExperienceChips";
import { SplitVisual } from "./SplitVisual";

/**
 * M2 · WHAT AN INFITRA EXPERIENCE IS (12 Sep 2026).
 *
 * The hero says what the opportunity is and what INFITRA provides. This is
 * the beat right after: what the thing actually is, which the brand requires
 * no later than the third beat. It shows it rather than describing it: the
 * live room, the tribe space and the weekly arc, ported small from the
 * surfaces the showcase opens in full further down.
 *
 * Then the two questions every supplier actually asks, answered as a picture
 * rather than a paragraph: what one sale is worth to them, and what they give
 * up by working this way. The lead-in hands over to the example.
 */
export function WhatItIs() {
  return (
    <section id="what" className="px-6 pt-20 md:pt-24 pb-10 md:pb-12">
      <div className="max-w-6xl mx-auto">
        <SectionHead
          eyebrow="What an INFITRA experience is"
          title={<>Online, over several weeks, <span style={{ color: ORANGE }}>bought once.</span></>}
          sub="The people who join meet you live on video every week, and stay connected in their tribe space in between."
        />

        <Reveal>
          <ExperienceChips />
        </Reveal>

        <Reveal>
          <div className="mt-12 md:mt-14">
            <SplitVisual />
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-12 md:mt-14 text-center text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
            One of the two shapes, shown start to finish: two experts, six
            weeks, one tribe. A studio and an outside expert run the same way,
            for the studio&apos;s members.
          </p>
        </Reveal>

      </div>
    </section>
  );
}
