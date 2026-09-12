import { EX, ALEX, MIRA } from "../content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW } from "../ui";
import { AnswerIcon } from "@/app/components/FoundingCard";

/**
 * THE TWO SHAPES, shown with real objects (12 Sep 2026).
 *
 * The first version of this drew a diagram: discs, a plus, an equals and a
 * label pill. That breaks the landing's design law (content.ts): every
 * visual is a direct PORT of a real INFITRA surface, never an invented
 * layout. So the two ways in are shown as the people they are, in the
 * marketing page's own portrait grammar, and what they produce is shown as
 * the thing itself, the marketing page, ported at a third of the size from
 * the vignette below.
 *
 * Same example as the showcase further down, carrying the same honesty
 * label, so the reader meets it here and then sees it in full.
 */
function Face({ src, color }: { src: string; color: string }) {
  return (
    <span className="block shrink-0 w-14 h-14 rounded-full overflow-hidden" style={{ border: `2px solid ${color}59` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" />
    </span>
  );
}

/** A studio wears the card's own mark: cyan, and the two circles meeting. */
function StudioMark() {
  return (
    <span
      className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "rgba(8,145,178,0.10)", border: "2px solid rgba(8,145,178,0.35)" }}
    >
      <AnswerIcon kind="seeks" color={CYAN} size={24} />
    </span>
  );
}

function Shape({ left, caption }: { left: React.ReactNode; caption: string }) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        {left}
      </div>
      <p className="text-[13.5px] leading-snug mt-2.5" style={{ color: MUTED }}>
        {caption}
      </p>
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** The marketing page, ported small: cover plate, live pill, title block,
 *  the two experts, the shape of the offer. */
function MiniPage() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 22px 52px rgba(15,34,41,0.16)" }}
    >
      <div className="relative aspect-[2/1]" style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.55), rgba(15,34,41,0))" }} />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
        >
          <span className="w-1 h-1 rounded-full bg-[#9CF0FF] animate-pulse" />
          Live · {EX.weeks} weeks
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[9.5px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
          {EX.title}
        </p>
        <p className="text-[15px] font-headline leading-snug mt-1.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {EX.promise}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <span className="flex -space-x-1.5 shrink-0">
            {[ALEX, MIRA].map((p) => (
              <span key={p.name} className="w-7 h-7 rounded-full overflow-hidden" style={{ border: "1.5px solid #FFFFFF" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className="w-full h-full object-cover" />
              </span>
            ))}
          </span>
          <span className="text-[11.5px] font-bold" style={{ color: MUTED }}>
            {ALEX.first} &amp; {MIRA.first}
          </span>
          <span className="ml-auto text-[11px] font-bold font-headline" style={{ color: CYAN }}>
            {EX.weeks} weeks · {EX.sessions} live sessions
          </span>
        </div>
      </div>
    </div>
  );
}

export function TwoShapes() {
  return (
    <div>
      <div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}>
        <div className="grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.1fr)] gap-6 md:gap-8 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-5" style={{ color: CYAN, fontWeight: 700 }}>
              Two ways to build one
            </p>
            <div className="flex flex-col gap-5">
              <Shape
                left={
                  <>
                    <Face src={ALEX.avatar} color={ORANGE} />
                    <span className="w-4 h-px shrink-0" style={{ backgroundColor: "rgba(15,34,41,0.22)" }} />
                    <Face src={MIRA.avatar} color={CYAN} />
                  </>
                }
                caption="Two experts whose crafts complete each other."
              />
              <div style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }} />
              <Shape
                left={
                  <>
                    <StudioMark />
                    <span className="w-4 h-px shrink-0" style={{ backgroundColor: "rgba(15,34,41,0.22)" }} />
                    <Face src={ALEX.avatar} color={ORANGE} />
                  </>
                }
                caption="A studio and an outside expert."
              />
            </div>
          </div>

          <Arrow className="hidden md:block" />
          <Arrow className="md:hidden mx-auto rotate-90" />

          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-5" style={{ color: ORANGE, fontWeight: 700 }}>
              One live experience
            </p>
            <MiniPage />
          </div>
        </div>
      </div>
      <p className="text-[12px] text-center mt-3" style={{ color: FAINT }}>
        An example experience, built on INFITRA.
      </p>
    </div>
  );
}
