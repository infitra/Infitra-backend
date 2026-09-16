import { ORANGE } from "../ui";
import { Reveal } from "../Reveal";
import { AnswerIcon } from "@/app/components/FoundingCard";

/**
 * M1b · TWO DOORS (16 Sep 2026): the only thing this section has to do.
 *
 * What stood here was an explanation of the model: the mark taken apart into
 * an equation, three parties named, and the terms shown as a panel. It read
 * as a slide. The equation in particular spent the largest block on the page
 * decorating a five-word sentence with a picture that only means something to
 * someone who already knows the mark, which a visitor does not.
 *
 * So: two doors, one per side that can start something, each addressed to
 * that reader in their own colour, each carrying the promise and the one way
 * in that belongs to them. The people who join are the customer of the thing
 * being sold, not the audience of this page, so they are named inside the
 * doors rather than given a third. The terms wait for the ask, where a
 * decider looks for them, and the demo underneath does the explaining.
 */
const CREAM = "#F2EFE8";
const CREAM_SOFT = "rgba(242,239,232,0.76)";
const CYAN_BRIGHT = "#9CF0FF";

const DOORS = [
  {
    key: "experts",
    accent: ORANGE,
    glyph: "brings" as const,
    label: "For experts",
    promise: "New clients and a fuller offer, while you focus on your craft.",
    how: "Team up with a complementary expert, or with a studio that already has the members. You lead your half, they lead theirs.",
  },
  {
    key: "studios",
    accent: CYAN_BRIGHT,
    glyph: "seeks" as const,
    label: "For studios and gyms",
    promise: "A digital revenue stream you do not build, staff or carry.",
    how: "Bring in an outside expert and sell it to the members you already have. No hire, no fixed wage, and nothing on the floor.",
  },
];

export function TwoDoors() {
  return (
    <section id="doors" className="relative px-6 pt-10 md:pt-14 pb-20 md:pb-24">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="grid md:grid-cols-2 gap-10 md:gap-14">
            {DOORS.map((d) => (
              <div key={d.key} data-door={d.key}>
                <div className="flex items-center gap-2.5">
                  <AnswerIcon kind={d.glyph} color={d.accent} size={20} />
                  <p className="text-[12px] uppercase tracking-[0.2em] font-headline" style={{ color: d.accent, fontWeight: 800 }}>
                    {d.label}
                  </p>
                </div>
                <h2
                  className="text-[1.7rem] md:text-[2rem] font-headline leading-[1.1] mt-4"
                  style={{ color: d.accent, fontWeight: 700, letterSpacing: "-0.03em" }}
                >
                  {d.promise}
                </h2>
                <p className="text-[15px] md:text-base leading-relaxed mt-5" style={{ color: CREAM_SOFT }}>
                  {d.how}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The one term that belongs to the pitch. The rest waits for the ask. */}
        <Reveal>
          <p
            data-keep
            className="text-center text-base md:text-lg font-headline mt-14 md:mt-16"
            style={{ color: CREAM, fontWeight: 600, letterSpacing: "-0.01em" }}
          >
            Both sides keep <span style={{ color: ORANGE }}>90%</span> of every
            sale, split as you agree.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
