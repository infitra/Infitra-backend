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
 * questions, unchanged. Under the picture the section answers the second
 * question a reader has, what is it FOR ME, with the two intents. Order
 * matters and is not negotiable: a reader who cannot picture the thing
 * learns nothing from a taxonomy of it.
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

        {/* THE TWO INTENTS (23 Sep). This replaced a list of configurations
           (a studio with an expert, two studios, a third expert), which was
           the weakest possible cut: it told a reader who may pair with whom,
           which nobody asked, and implied a menu.
           Intent is the useful cut because it CROSSES THE ROLES. Both lines
           are true for an expert and for a studio, which the old identity
           list could never be. They are said rather than drawn on purpose:
           the picture above shows a mechanism, and an intent is a choice.
           The only way to draw a choice is two labelled panels, which is the
           invented-diagram slide this page does not do.
           They are also a ladder, not a fork: the second is the low-risk
           entry because the audience already exists, the first is the growth.
           The old "Explore one, in full" lead-in went with them: the section
           immediately below introduces itself as "An example experience", and
           that was the same fact twice, 100px apart. */}
        <div className="mt-9 md:mt-11 grid sm:grid-cols-2 gap-8 sm:gap-10 max-w-3xl mx-auto">
          <Intent title="A new experience, standing on its own.">
            You and a complement build it outside what either of you already
            sells, and open it to both your audiences.
          </Intent>
          <Intent title="Or more for the people you already have.">
            You bring in expertise you do not offer, and the audience is
            already there.
          </Intent>
        </div>
      </div>
    </section>
  );
}

/** An intent reads as its own statement, not as a bolded run-in: the title
 *  carries the weight and the line under it explains, which is the only way
 *  two of these get scanned instead of read. */
function Intent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-[19px] md:text-xl font-headline leading-snug"
        style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}
      >
        {title}
      </h3>
      <p
        className="mt-2 text-[15px] md:text-base leading-relaxed"
        style={{ color: MUTED }}
      >
        {children}
      </p>
    </div>
  );
}
