import { MUTED, ORANGE, SectionHead } from "../ui";

/**
 * THE INVITATION (17 Sep 2026): the door into the showcase, and the one
 * place that says the pair below is an arrangement, not the definition.
 *
 * The demo runs a single shape: two independent experts over six weeks. A
 * reader who takes that as the rule quietly rules themselves out, so the
 * door names the other shapes in one line and promises they run identically.
 * The section below already carries the word "example"; this one says what
 * the example is an example OF, which is the stronger half of the same move.
 *
 * The opening line rides inside the sub as a smaller block rather than its
 * own paragraph: a <p> cannot nest a <p>, and the hierarchy should come from
 * size, not from a second margin fighting the head's own spacing.
 */
export function Invitation() {
  return (
    <section id="invitation" className="px-6 pt-20 md:pt-24 pb-0">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title={<>Explore one, <span style={{ color: ORANGE }}>in full.</span></>}
          sub={
            <>
              Two independent experts, six weeks, shown start to finish.
              <span className="block mt-4 text-[15px] md:text-[15.5px]" style={{ color: MUTED }}>
                One shape out of many. A studio brings in an outside expert for
                its members, two studios create one together, a third expert
                joins for the part neither of you teaches. All of it runs the
                way you are about to see.
              </span>
            </>
          }
        />
      </div>
    </section>
  );
}
