import { INK, ORANGE, CYAN, MUTED, SectionHead } from "../ui";
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
 * Colours follow the member card: cyan and the two circles meeting for the
 * studio (the complement brought in), orange and the person for the expert
 * (what they bring). The people who join get both colours at once, orange
 * into cyan, because their result is made of both halves. Each card wears its
 * colour as a tinted band, so the three promises read as three offers instead
 * of three paragraphs. No black, no badge gold.
 */
const BOTH = "linear-gradient(135deg, #FF6130 0%, #0891b2 100%)";

const WINNERS = [
  {
    key: "studios",
    label: "For studios and gyms",
    bar: CYAN,
    ring: "rgba(8,145,178,0.30)",
    glow: "rgba(8,145,178,0.10)",
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
    ring: "rgba(255,97,48,0.30)",
    glow: "rgba(255,97,48,0.10)",
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
    ring: "rgba(15,34,41,0.10)",
    glow: "rgba(8,145,178,0.08)",
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
    <section id="winners" className="px-6 pt-20 md:pt-24 pb-6 md:pb-8">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="Who it is for"
          title={<>One experience, <span style={{ color: ORANGE }}>three winners.</span></>}
          sub="Either way, three sides come out ahead."
        />

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
                style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1.5px ${w.ring}, 0 20px 50px ${w.glow}` }}
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
