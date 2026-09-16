import { ALEX, MIRA, ANNA, NINA, TIM, SAM, PRIYA } from "../content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW } from "../ui";
import { AnswerIcon } from "@/app/components/FoundingCard";
import { CardWaves } from "@/app/components/BrandWaves";

/**
 * THE CIRCUIT (16 Sep 2026): who it is for, shown as what moves between them.
 *
 * The section used to name three winners and then show an example experience,
 * which answered neither question: the example belongs to the showcase, and a
 * list of winners never says why the three need each other. This shows the
 * dynamic instead. Two ways in on the left, the thing they make in the
 * middle, the people it reaches on the right, and the revenue running back to
 * the two who made it. The cards underneath then say what each side gets.
 *
 * The picture carries the explanation; the captions are context. Every piece
 * of it is the brand's own material: the real portraits from the example, the
 * card's own studio mark, the brand waves as the ground of the thing being
 * made. No invented objects.
 */
const CREAM = "#F2EFE8";

function Face({ src, color, size = 56 }: { src: string; color: string; size?: number }) {
  return (
    <span
      className="block shrink-0 rounded-full overflow-hidden"
      style={{ width: size, height: size, border: `2px solid ${color}59` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" />
    </span>
  );
}

/** A studio wears the card's own mark: cyan, and the two circles meeting. */
function StudioMark({ size = 56 }: { size?: number }) {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor: "rgba(8,145,178,0.10)",
        border: "2px solid rgba(8,145,178,0.35)",
      }}
    >
      <AnswerIcon kind="seeks" color={CYAN} size={Math.round(size * 0.42)} />
    </span>
  );
}

function Way({ left, caption }: { left: React.ReactNode; caption: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">{left}</div>
      <p className="text-[13px] leading-snug mt-2.5" style={{ color: MUTED }}>
        {caption}
      </p>
    </div>
  );
}

function Flow({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** What the two of them make: the brand's own ground, and the unit named. */
function ExperienceNode() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden px-5 py-7 text-center"
      style={{ backgroundColor: CREAM, border: "1px solid rgba(15,34,41,0.08)", boxShadow: "0 12px 34px rgba(15,34,41,0.12)" }}
    >
      <div aria-hidden className="absolute inset-0">
        <CardWaves id="circuit-unit" />
      </div>
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.22em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
          Together they make
        </p>
        <p className="text-[20px] font-headline leading-tight mt-1.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
          One live experience
        </p>
        <p className="text-[11.5px] font-bold font-headline mt-2" style={{ color: INK, opacity: 0.55 }}>
          Online · several weeks · bought once
        </p>
      </div>
    </div>
  );
}

function JoinersNode() {
  return (
    <div className="text-center">
      <div className="flex justify-center -space-x-3">
        {[ANNA, NINA, TIM, SAM, PRIYA].map((p) => (
          <span key={p.name} className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "2px solid #FFFFFF", boxShadow: "0 6px 16px rgba(15,34,41,0.14)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="w-full h-full object-cover" />
          </span>
        ))}
      </div>
      <p className="text-[15px] font-headline mt-3.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        The people who join
      </p>
      <p className="text-[12.5px] leading-snug mt-1" style={{ color: MUTED }}>
        Buy once, and are guided live by both.
      </p>
    </div>
  );
}

export function Circuit() {
  return (
    <div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}>
      <div className="grid md:grid-cols-[minmax(0,1.05fr)_auto_minmax(0,0.95fr)_auto_minmax(0,0.85fr)] gap-5 md:gap-4 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-4" style={{ color: CYAN, fontWeight: 700 }}>
            Two ways in
          </p>
          <div className="flex flex-col gap-4">
            <Way
              left={
                <>
                  <Face src={ALEX.avatar} color={ORANGE} />
                  <span className="w-3.5 h-px shrink-0" style={{ backgroundColor: "rgba(15,34,41,0.22)" }} />
                  <Face src={MIRA.avatar} color={CYAN} />
                </>
              }
              caption="Two experts whose crafts complete each other."
            />
            <div style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }} />
            <Way
              left={
                <>
                  <StudioMark />
                  <span className="w-3.5 h-px shrink-0" style={{ backgroundColor: "rgba(15,34,41,0.22)" }} />
                  <Face src={ALEX.avatar} color={ORANGE} />
                </>
              }
              caption="A studio and an outside expert."
            />
          </div>
        </div>

        <Flow className="hidden md:block" />
        <Flow className="md:hidden mx-auto rotate-90" />

        <ExperienceNode />

        <Flow className="hidden md:block" />
        <Flow className="md:hidden mx-auto rotate-90" />

        <JoinersNode />
      </div>

      {/* The return: the reason any of them does it. */}
      <div className="mt-7 md:mt-8 flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
          <path d="M20 12H5" />
          <path d="M11 6l-6 6 6 6" />
        </svg>
        <span className="flex-1 h-px" style={{ backgroundColor: "rgba(255,97,48,0.28)" }} />
        <p className="text-[13px] font-bold font-headline text-center" style={{ color: INK }}>
          Every sale goes back to the two who made it, split as they agree.
        </p>
        <span className="flex-1 h-px" style={{ backgroundColor: "rgba(255,97,48,0.28)" }} />
      </div>
    </div>
  );
}
