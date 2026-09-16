import { ORANGE } from "../ui";
import { AnswerIcon } from "@/app/components/FoundingCard";

/**
 * TWO DOORS (16 Sep 2026): who it is for, inside the stage.
 *
 * One door per side that can start something, each addressed to that reader
 * in their own colour, each carrying the promise and the one way in that
 * belongs to them. The people who join are the customer of the thing being
 * sold, not the audience of this page, so they are named inside the doors
 * rather than given a third.
 *
 * The nouns do the work the old diagram tried to do. Side by side, two
 * columns get read as one sentence, so the expert door ends on "or both",
 * where it is the last thing read rather than a clause in the middle, and the
 * studio door says EXPERTS, plural: one named partner would imply the only
 * pairing is a studio with an expert, which undersells a network.
 *
 * Colour anchors, it does not shout. The disc and the label carry the side's
 * colour and the promise is set in cream: with the headline already running
 * orange into cyan, a coloured promise under it made four coloured blocks
 * compete and none of them won. The rule on this stage: one colour moment per
 * block, and the accent belongs to the mark that identifies the reader.
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
    how: "Team up with a complementary expert, a studio with the members, or both.",
  },
  {
    key: "studios",
    accent: CYAN_BRIGHT,
    glyph: "seeks" as const,
    label: "For studios and gyms",
    promise: "A digital revenue stream you do not build, staff or carry.",
    how: "Bring in the experts your members would pay for. No hire, no fixed wage.",
  },
];

export function TwoDoors() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-10 md:gap-0 text-left">
        {DOORS.map((d) => (
          <div key={d.key} data-door={d.key} className="md:first:pr-10 md:last:pl-10 md:last:border-l" style={{ borderColor: "rgba(242,239,232,0.14)" }}>
            <div className="flex items-center gap-3">
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: d.accent, boxShadow: `0 8px 22px ${d.accent}40` }}
              >
                <AnswerIcon kind={d.glyph} color={d.key === "studios" ? "#0C262E" : "#FFFFFF"} size={22} />
              </span>
              <p className="text-[12px] uppercase tracking-[0.22em] font-headline" style={{ color: d.accent, fontWeight: 800 }}>
                {d.label}
              </p>
            </div>
            <p
              className="text-[1.3rem] md:text-[1.45rem] font-headline leading-[1.2] mt-5"
              style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.025em" }}
            >
              {d.promise}
            </p>
            <p className="text-[14.5px] md:text-[15px] leading-relaxed mt-3" style={{ color: CREAM_SOFT }}>
              {d.how}
            </p>
          </div>
        ))}
      </div>

      {/* The one term that belongs to a pitch. Not "both sides": the network
         is not limited to a pair. */}
      <p
        data-keep
        className="text-center text-base md:text-lg font-headline mt-10 md:mt-12"
        style={{ color: CREAM, fontWeight: 600, letterSpacing: "-0.01em" }}
      >
        Keep <span style={{ color: ORANGE }}>90%</span> of every sale, split as
        you agree.
      </p>
    </div>
  );
}
