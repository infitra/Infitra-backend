import { INK, ORANGE, CYAN, MUTED, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

/**
 * M1b · TWO DOORS (new, 11 Sep 2026) — where gyms and studios enter the
 * story, early and as equals.
 *
 * The strategy is one product reached from two sides: an expert brings a
 * craft and needs a complement; a studio brings members and needs something
 * to sell that does not need a room. Putting this directly under the hero
 * means a studio owner never has to translate an expert-only page onto
 * themselves. Neither door is the "other" one: orange for experts, cyan for
 * studios, same weight, same size.
 */
export function TwoDoors() {
  return (
    <section className="px-6 py-20 md:py-24">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="Who it is for"
          title={<>One network, <span style={{ color: ORANGE }}>two ways in.</span></>}
          sub="The same live experience, reached from two sides. What you already have decides which door is yours."
        />

        <Reveal>
          <div className="grid md:grid-cols-2 gap-5 items-stretch">
            <div
              className="rounded-3xl p-6 md:p-8 flex flex-col text-left"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30), 0 20px 50px rgba(255,97,48,0.10)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                Experts
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                You bring your craft.
              </h3>
              <p className="text-[15px] md:text-base mt-4 leading-relaxed" style={{ color: MUTED }}>
                You go all in on your part, at full depth. Someone whose
                expertise completes yours takes the other half, live, for the
                same group across the same weeks. Together you offer something
                neither of you could offer alone, and your clients and your
                audience stay entirely yours.
              </p>
            </div>

            <div
              className="rounded-3xl p-6 md:p-8 flex flex-col text-left"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(8,145,178,0.30), 0 20px 50px rgba(8,145,178,0.10)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
                Studios and gyms
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                You bring your members.
              </h3>
              <p className="text-[15px] md:text-base mt-4 leading-relaxed" style={{ color: MUTED }}>
                Something to sell that needs no room and no extra hour on the
                timetable. Deliberately not your classes on a screen: it is
                built around what you do not teach in the room, led live by an
                outside expert, with your studio as the anchor. Your members
                buy the piece that completes what they already do with you.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
