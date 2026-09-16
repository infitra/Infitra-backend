import { INK, ORANGE, CYAN, MUTED } from "../ui";
import { AnswerIcon } from "@/app/components/FoundingCard";
import { CardWaves } from "@/app/components/BrandWaves";

/**
 * TWO DOORS (16 Sep 2026): who it is for, inside the stage.
 *
 * One door per side that can start something, each addressed to that reader
 * and carrying the promise and the one way in that belongs to them. The
 * people who join are the customer of the thing being sold, not the audience
 * of this page, so they are named inside the doors rather than given a third.
 *
 * Cream cards on the brand's own waves, the same paper as the member cards.
 * Set as type on the dark ground they fought the headline for attention; as
 * cards they lift off it instead, and the softer surface lets the copy sit
 * quietly in ink where it belongs. On cream the studio's cyan is the deep one:
 * the bright cyan only works on teal.
 *
 * The nouns do the work the old diagram tried to do. Side by side, two columns
 * get read as one sentence, so the expert door ends on "or both", where it is
 * the last thing read rather than a clause in the middle, and the studio door
 * says EXPERTS, plural: one named partner would imply the only pairing is a
 * studio with an expert, which undersells a network.
 */
const CREAM = "#F2EFE8";
const GROUND_MASK = "linear-gradient(180deg, #000 0%, #000 84%, rgba(0,0,0,0) 100%)";

/** A barbell, in the same 2.1 stroke language as the card's answer icons. */
function Barbell() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5v5" />
      <path d="M6.75 6.5v11" />
      <path d="M17.25 6.5v11" />
      <path d="M21 9.5v5" />
      <path d="M6.75 12h10.5" />
    </svg>
  );
}

const DOORS = [
  {
    key: "experts",
    accent: ORANGE,
    glyph: "brings" as "brings" | "barbell",
    label: "Experts",
    promise: "New clients and a fuller offer, while you focus on your craft.",
    how: "Team up with a complementary expert, a studio with the members, or both.",
  },
  {
    key: "studios",
    accent: CYAN,
    glyph: "barbell" as "brings" | "barbell",
    label: "Studios and gyms",
    promise: "A digital revenue stream you do not build, staff or carry.",
    how: "Bring in the experts your members would pay for. No hire, no fixed wage.",
  },
];

export function TwoDoors() {
  return (
    <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-5 md:gap-6 text-left">
      {DOORS.map((d) => (
        <div
          key={d.key}
          data-door={d.key}
          className="relative rounded-3xl overflow-hidden"
          style={{
            backgroundColor: CREAM,
            border: "1px solid rgba(15,34,41,0.07)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.34)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[78%] pointer-events-none"
            style={{ maskImage: GROUND_MASK, WebkitMaskImage: GROUND_MASK }}
          >
            <CardWaves id={`door-${d.key}`} />
          </div>

          <div className="relative px-6 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center gap-3">
              <span
                className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: d.accent, boxShadow: `0 6px 18px ${d.accent}4d` }}
              >
                {d.glyph === "barbell" ? <Barbell /> : <AnswerIcon kind={d.glyph} color="#FFFFFF" size={24} />}
              </span>
              <p className="text-[15px] uppercase tracking-[0.16em] font-headline" style={{ color: d.accent, fontWeight: 800 }}>
                {d.label}
              </p>
            </div>

            <p
              className="text-[1.3rem] md:text-[1.45rem] font-headline leading-[1.2] mt-4"
              style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
            >
              {d.promise}
            </p>
            <p className="text-[14.5px] md:text-[15px] leading-relaxed mt-3" style={{ color: MUTED }}>
              {d.how}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
