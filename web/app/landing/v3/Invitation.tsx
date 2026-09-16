import { ORANGE, SectionHead } from "../ui";

/**
 * THE INVITATION (16 Sep 2026): the door into the showcase.
 *
 * Everything above is the model. Below it the whole thing runs, start to
 * finish. This says so in one line, so the deep dive reads as invited rather
 * than as another chapter starting unannounced.
 */
export function Invitation() {
  return (
    <section id="invitation" className="px-6 pt-20 md:pt-24 pb-0">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title={<>Explore one <span style={{ color: ORANGE }}>in full.</span></>}
          sub="One of the two shapes, shown start to finish: two experts, six weeks, one tribe. A studio and an outside expert run the same way, for the studio's members."
        />
      </div>
    </section>
  );
}
