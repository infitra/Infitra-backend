import { INK, ORANGE, CYAN, MUTED } from "../ui";
import { StageWaves } from "@/app/components/BrandWaves";
import { Reveal } from "../Reveal";
import { AnswerIcon } from "@/app/components/FoundingCard";
import { MarkEquation } from "./MarkEquation";
import { SplitVisual } from "./SplitVisual";

/**
 * M1b · THREE WINNERS (11 Sep 2026): the opportunity, named per side.
 *
 * Network value is combinatorial, and a list of possibilities reads as
 * vagueness. So the section SHOWS the two ways to build one first, with the
 * real faces and the real page they produce, then names the three sides that
 * come out ahead, each in its own economics: one promise and three proof
 * lines. The
 * third side, the people who join, is written as the RESULT of the first two,
 * so a studio owner reads it as "great for our members" and an expert as
 * "beyond what I could offer alone". It has no button.
 *
 * The stage runs on: this section keeps the hero's dark ground, so the whole
 * model, the mark, the three sides and the terms, reads as one act before the
 * page turns light for the example. The three cards stay light, because they
 * are cards, and they carry their audience in white on a solid bar in their
 * own colour: cyan for a studio, orange for an expert, both for the people
 * who join. Everything drawn directly on the teal uses the bright cyan.
 */
const BOTH = "linear-gradient(135deg, #FF6130 0%, #0891b2 100%)";
const TEAL = "#0C262E";
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.78)";
const CYAN_BRIGHT = "#9CF0FF";

const WINNERS = [
  {
    key: "studios",
    label: "For studios and gyms",
    bar: CYAN,
    dot: CYAN,
    glyph: "seeks" as const,
    promise: "A digital revenue stream you do not build, staff or carry.",
    proof: [
      "More for your members on top of the membership, with no hire, no fixed wage and nothing on the floor.",
      "Bring in a new expert, or a guest, whenever it needs fresh air.",
      "Your members stay yours, and the timetable does not move.",
    ],
  },
  {
    key: "experts",
    label: "For experts",
    bar: ORANGE,
    dot: ORANGE,
    glyph: "brings" as const,
    promise: "New clients and a fuller offer, while you focus on your craft.",
    proof: [
      "A studio's members, without building that audience yourself.",
      "Or an expert who leads the other half, so together you offer what neither of you could alone.",
      "Your clients and your audience stay yours.",
    ],
  },
  {
    key: "participants",
    label: "For the people who join",
    bar: BOTH,
    dot: ORANGE,
    glyph: "group" as const,
    promise: "Complete guidance in one place, each part led by an expert in it.",
    proof: [
      "One experience, bought once, in one place: no more switching between apps and coaches.",
      "More from a membership they already have, with every part at full depth.",
      "A tribe that keeps its purpose and its momentum between the live sessions.",
    ],
  },
];

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
    <section
      id="winners"
      data-dark
      className="relative overflow-hidden px-6 pt-20 md:pt-24 pb-20 md:pb-24"
      style={{ backgroundColor: TEAL }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <StageWaves id="winners" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto">
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
            Either way, three sides come out ahead.
          </p>
        </div>

        {/* The model first, in one picture: each side brings a part, and what
           they make together is the whole thing. */}
        <Reveal>
          <div className="mb-10 md:mb-12">
            <MarkEquation />
          </div>
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {WINNERS.map((w) => (
              <div
                key={w.key}
                data-winner={w.key}
                className="rounded-3xl flex flex-col text-left overflow-hidden"
                style={{ backgroundColor: "#FFFFFF", boxShadow: "0 18px 50px rgba(0,0,0,0.34)" }}
              >
                <div className="flex items-center gap-3 px-6 md:px-7 py-4" style={{ background: w.bar }}>
                  {w.glyph === "group" ? <GroupIcon color="#FFFFFF" size={22} /> : <AnswerIcon kind={w.glyph} color="#FFFFFF" size={22} />}
                  <p className="text-[15px] font-headline leading-none" style={{ color: "#FFFFFF", fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {w.label}
                  </p>
                </div>
                <div className="px-6 md:px-7 pt-5 pb-6 flex flex-col">
                  <h3
                    className="text-[1.35rem] md:text-2xl font-headline tracking-tight leading-tight"
                    style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    {w.promise}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {w.proof.map((line) => (
                      <li key={line} className="flex gap-2.5">
                        <span className="mt-[8px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: w.dot }} />
                        <span className="text-[14.5px] leading-snug" style={{ color: MUTED }}>
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* What one sale is worth to them, and what they give up: nothing. */}
        <Reveal>
          <div className="mt-10 md:mt-12">
            <SplitVisual />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
