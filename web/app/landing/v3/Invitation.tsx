import { Eyebrow, ORANGE, INK, MUTED } from "../ui";
import { ExperienceShape } from "./ExperienceShape";

/**
 * THE INVITATION (23 Sep 2026): the answer first, then the door.
 *
 * This section used to be a door with nothing behind it: it said "explore
 * one in full" to a reader who did not yet know what one WAS. "Live
 * experience" is brand vocabulary and the page never glossed it, which is
 * why two candidates reached a call still asking what an experience looks
 * like. So the section now states the shape, shows it once (ExperienceShape),
 * and only then hands over to the example.
 *
 * The sentence is BRAND's own ratified answer to the first two cold-reader
 * questions, unchanged. The two intents that answer the second question a
 * reader has, what is it FOR ME, live inside the card itself (see
 * ExperienceShape): they are one object with the shape, not a caption under
 * it. Order matters and is not negotiable either way: a reader who cannot
 * picture the thing learns nothing from a taxonomy of it.
 *
 * It replaces rather than joins: the mock marketing page gave up its
 * caption strip in the same change, so the page did not get longer.
 */
export function Invitation() {
  return (
    <section id="invitation" className="px-6 pt-20 md:pt-24 pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-9 md:mb-10">
          <div className="mb-3">
            <Eyebrow>How it works</Eyebrow>
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Live, <span style={{ color: ORANGE }}>week after week.</span>
          </h2>
          <p
            className="text-base md:text-lg mt-5 leading-relaxed"
            style={{ color: MUTED }}
          >
            Participants buy once, meet the experts live on video across the
            weeks, and stay connected in one space in between.
          </p>
        </div>

        <ExperienceShape />

      </div>
    </section>
  );
}
