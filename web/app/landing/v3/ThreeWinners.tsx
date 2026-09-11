import { INK, ORANGE, CYAN, MUTED, SectionHead } from "../ui";
import { Reveal } from "../Reveal";
import { AnswerIcon } from "@/app/components/FoundingCard";

/**
 * M1b · THREE WINNERS (11 Sep 2026): the opportunity, named per side.
 *
 * Network value is combinatorial, and a list of possibilities reads as
 * vagueness. So the section states one unit and exactly two ways to build
 * it, then names the three sides that come out ahead, each in its own
 * economics, one promise and three proof lines. The third side, the people
 * who join, has no button: they are not the page's audience, but naming
 * their win is what keeps the revenue talk honest.
 *
 * Colours follow the member card: cyan and the two circles meeting for the
 * studio (the complement brought in), orange and the person for the expert
 * (what they bring). Ink for the people who join, the brand's third token,
 * never the founding-badge gold.
 */
const WINNERS = [
  {
    key: "studios",
    label: "Studios and gyms",
    accent: CYAN,
    ring: "rgba(8,145,178,0.30)",
    glow: "rgba(8,145,178,0.10)",
    glyph: "seeks" as const,
    promise: "A digital offer you do not build, staff or carry.",
    proof: [
      "Revenue on top of the membership, with no hire, no fixed wage and nothing on the floor.",
      "Bring in a new expert, or a guest, whenever the offer needs fresh air.",
      "Your members stay yours, and the timetable does not move.",
    ],
  },
  {
    key: "experts",
    label: "Experts",
    accent: ORANGE,
    ring: "rgba(255,97,48,0.30)",
    glow: "rgba(255,97,48,0.10)",
    glyph: "brings" as const,
    promise: "New clients and a fuller offer, while you only teach your part.",
    proof: [
      "A studio's members, without building that audience yourself.",
      "Or an expert who leads the other half, so together you sell what neither of you could alone.",
      "Your clients and your audience stay yours.",
    ],
  },
  {
    key: "participants",
    label: "The people who join",
    accent: INK,
    ring: "rgba(15,34,41,0.18)",
    glow: "rgba(15,34,41,0.08)",
    glyph: "group" as const,
    promise: "Complete guidance, with each part led by an expert in it.",
    proof: [
      "Bought once, for the whole experience.",
      "Live on video across the weeks, with the experts in the room.",
      "A group that stays connected in between.",
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
    <section id="winners" className="px-6 pt-20 md:pt-24 pb-10 md:pb-12">
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="Who it is for"
          title={<>One experience, <span style={{ color: ORANGE }}>three winners.</span></>}
          sub="Two ways to build one: two experts whose crafts complete each other, or a studio and an outside expert. Either way, three sides come out ahead."
        />

        <Reveal>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {WINNERS.map((w) => (
              <div
                key={w.key}
                data-winner={w.key}
                className="rounded-3xl p-6 md:p-7 flex flex-col text-left"
                style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1.5px ${w.ring}, 0 20px 50px ${w.glow}` }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: w.accent }}>
                    {w.glyph === "group" ? <GroupIcon color="#FFFFFF" /> : <AnswerIcon kind={w.glyph} color="#FFFFFF" />}
                  </span>
                  <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: w.accent, fontWeight: 800 }}>
                    {w.label}
                  </p>
                </div>
                <h3
                  className="text-xl md:text-[1.4rem] font-headline tracking-tight mt-4 leading-tight"
                  style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  {w.promise}
                </h3>
                <ul className="mt-4 space-y-2">
                  {w.proof.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="mt-[8px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: w.accent }} />
                      <span className="text-[14.5px] leading-snug" style={{ color: MUTED }}>
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
