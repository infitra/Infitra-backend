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
 * questions, unchanged. "Explore one, in full" drops from heading to
 * lead-in, because it is a door into what follows rather than this
 * section's subject, and the openness line reads better after the shape
 * than before it.
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

        <p
          className="mt-8 md:mt-9 text-center text-[15px] md:text-base leading-relaxed max-w-2xl mx-auto"
          style={{ color: MUTED }}
        >
          <span className="font-headline" style={{ color: INK, fontWeight: 700 }}>
            Explore one, in full.
          </span>{" "}
          One shape out of many: a studio brings in an outside expert for its
          members, two studios create one together, a third expert joins for
          the part neither of you teaches.
        </p>
      </div>
    </section>
  );
}
