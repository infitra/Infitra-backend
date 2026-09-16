import { ORANGE } from "../ui";
import { Reveal } from "../Reveal";
import { AnswerIcon } from "@/app/components/FoundingCard";
import { MarkEquation } from "./MarkEquation";
import { SplitVisual } from "./SplitVisual";

/**
 * M1b · WHO IT IS FOR (16 Sep 2026): the model, then the opportunity per side.
 *
 * The page has to say whose page this is before it says how anything works,
 * so the two sides that can start something stand next to each other with
 * their role and their promise carrying all the weight, in their own colour:
 * experts orange, studios and gyms cyan. The detail sits under each in a
 * quiet container, where it is available without competing.
 *
 * The people who join are the RESULT of those two, not a third party to
 * recruit, so they get one wide, quieter card underneath rather than a third
 * column. Everything here stands on the stage's dark ground: no white cards,
 * no tinted bars.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CREAM_SOFT = "rgba(242,239,232,0.70)";
const CYAN_BRIGHT = "#9CF0FF";

const PANEL = {
  backgroundColor: "rgba(242,239,232,0.05)",
  border: "1px solid rgba(242,239,232,0.16)",
};

const SIDES = [
  {
    key: "experts",
    accent: ORANGE,
    glyph: "brings" as const,
    label: "For experts",
    promise: "New clients and a fuller offer, while you focus on your craft.",
    proof: [
      "A studio's members, without building that audience yourself.",
      "Or an expert who leads the other half, so together you offer what neither of you could alone.",
      "Your clients and your audience stay yours.",
    ],
  },
  {
    key: "studios",
    accent: CYAN_BRIGHT,
    glyph: "seeks" as const,
    label: "For studios and gyms",
    promise: "A digital revenue stream you do not build, staff or carry.",
    proof: [
      "More for your members on top of the membership, with no hire, no fixed wage and nothing on the floor.",
      "Bring in a new expert, or a guest, whenever it needs fresh air.",
      "Your members stay yours, and the timetable does not move.",
    ],
  },
];

const JOINERS = {
  promise: "Complete guidance in one place, each part led by an expert in it.",
  proof: [
    "One experience, bought once, in one place: no more switching between apps and coaches.",
    "More from a membership they already have, with every part at full depth.",
    "A tribe that keeps its purpose and its momentum between the live sessions.",
  ],
};

/** Three people, in the same 2.1 stroke language as the card's answer icons. */
function GroupIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="7.5" r="3.2" />
      <path d="M6 20c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" />
      <circle cx="4.8" cy="9.6" r="2.3" />
      <circle cx="19.2" cy="9.6" r="2.3" />
      <path d="M1.6 18c.3-2.2 1.7-3.6 3.6-4" />
      <path d="M22.4 18c-.3-2.2-1.7-3.6-3.6-4" />
    </svg>
  );
}

export function ThreeWinners() {
  return (
    <section id="winners" className="relative px-6 pt-10 md:pt-14 pb-20 md:pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
            Who it is for
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
            style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            One experience, <span style={{ color: ORANGE }}>three winners.</span>
          </h2>
          <p className="text-base md:text-lg mt-5 leading-relaxed max-w-2xl mx-auto" style={{ color: CREAM_MUTED }}>
            Experts, studios and gyms, and the people who join. Either way,
            three sides come out ahead.
          </p>
        </div>

        {/* The model first, in one picture: each side brings a part, and what
           they make together is the whole thing. */}
        <Reveal>
          <MarkEquation />
        </Reveal>

        {/* The two sides who can start one, side by side. */}
        <Reveal>
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 mt-14 md:mt-16">
            {SIDES.map((s) => (
              <div key={s.key} data-winner={s.key}>
                <div className="flex items-center gap-2.5">
                  <AnswerIcon kind={s.glyph} color={s.accent} size={20} />
                  <p className="text-[12px] uppercase tracking-[0.2em] font-headline" style={{ color: s.accent, fontWeight: 800 }}>
                    {s.label}
                  </p>
                </div>
                <h3
                  className="text-[1.6rem] md:text-[1.85rem] font-headline leading-[1.12] mt-4"
                  style={{ color: s.accent, fontWeight: 700, letterSpacing: "-0.025em" }}
                >
                  {s.promise}
                </h3>
                <ul className="mt-6 rounded-2xl p-5 space-y-3" style={PANEL}>
                  {s.proof.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.accent }} />
                      <span className="text-[13.5px] leading-snug" style={{ color: CREAM_SOFT }}>
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>

        {/* And what that produces for the people it is all for. */}
        <Reveal>
          <div data-winner="participants" className="mt-8 md:mt-10 rounded-2xl p-5 sm:p-6" style={PANEL}>
            <div className="flex items-center gap-2.5">
              <GroupIcon color={CREAM} size={18} />
              <p className="text-[12px] uppercase tracking-[0.2em] font-headline" style={{ color: CREAM, fontWeight: 800 }}>
                For the people who join
              </p>
            </div>
            <p className="text-[1.1rem] md:text-[1.25rem] font-headline leading-snug mt-3" style={{ color: CREAM, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {JOINERS.promise}
            </p>
            <ul className="mt-4 grid sm:grid-cols-3 gap-x-7 gap-y-2.5">
              {JOINERS.proof.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(242,239,232,0.45)" }} />
                  <span className="text-[13px] leading-snug" style={{ color: CREAM_SOFT }}>
                    {line}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* What one sale is worth to them, and what they give up: nothing. */}
        <Reveal>
          <div className="mt-12 md:mt-14">
            <SplitVisual />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
