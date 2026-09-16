import { INK, ORANGE, CYAN, MUTED, CARD_SHADOW } from "../ui";

/**
 * THE MARK, TAKEN APART (16 Sep 2026): the model in one picture.
 *
 * Two people bring one part each, and what they make together is the whole
 * thing. The brand's own mark says that better than any diagram: each side is
 * literally a piece of it, and the two pieces are the INFITRA mark. Two rows,
 * two different cuts of the same mark, one result: whichever way in you take,
 * you end up at the same whole.
 *
 * Every piece is drawn by masking a brand colour through the part's alpha,
 * the way the founding mark is drawn, so all three render the same way, stay
 * crisp at any size, and the whole can carry both colours at once.
 *
 * Colour here means the two halves of a collaboration. A studio keeps the
 * cyan it wears everywhere else on the page.
 */
const MASK = (src: string) => ({
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
});

function Piece({ src, color, label }: { src: string; color: string; label: string }) {
  return (
    <div className="w-[82px] sm:w-[150px] flex flex-col items-center text-center">
      <span
        aria-hidden
        className="block w-[54px] h-[54px] sm:w-[94px] sm:h-[94px]"
        style={{ backgroundColor: color, ...MASK(src) }}
      />
      <p className="text-[11px] sm:text-[13px] leading-snug mt-3.5" style={{ color: MUTED }}>
        {label}
      </p>
    </div>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="text-[18px] sm:text-[24px] font-headline leading-none shrink-0 mt-[20px] sm:mt-[40px]"
      style={{ color: "rgba(15,34,41,0.28)", fontWeight: 700 }}
    >
      {children}
    </span>
  );
}

function Whole() {
  return (
    <div className="w-[108px] sm:w-[186px] flex flex-col items-center text-center">
      <span
        aria-hidden
        className="block w-[76px] h-[54px] sm:w-[133px] sm:h-[94px]"
        style={{
          background: `linear-gradient(115deg, ${ORANGE} 0%, ${ORANGE} 44%, ${CYAN} 56%, ${CYAN} 100%)`,
          ...MASK("/founding-mark.png"),
        }}
      />
      <p className="text-[12.5px] sm:text-[15px] font-headline leading-snug mt-3.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        One live experience
      </p>
      <p className="text-[10.5px] sm:text-[11.5px] leading-snug mt-0.5" style={{ color: MUTED }}>
        for the people who join
      </p>
    </div>
  );
}

const ROWS = [
  {
    key: "expert-expert",
    a: { src: "/mark/mark-first.png", color: ORANGE, label: "An expert" },
    b: { src: "/mark/mark-second.png", color: CYAN, label: "A complementary expert" },
  },
  {
    key: "studio-expert",
    a: { src: "/mark/mark-ends.png", color: CYAN, label: "A studio or gym" },
    b: { src: "/mark/mark-middle.png", color: ORANGE, label: "An outside expert" },
  },
];

export function MarkEquation() {
  return (
    <div className="rounded-3xl px-4 py-7 sm:p-8" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}>
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center" style={{ color: CYAN, fontWeight: 700 }}>
        Two ways in
      </p>

      <div className="mt-6 flex flex-col gap-6 sm:gap-7">
        {ROWS.map((r, i) => (
          <div key={r.key} data-shape={r.key}>
            {i > 0 && <div className="mb-6 sm:mb-7" style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }} />}
            <div className="flex items-start justify-center gap-1.5 sm:gap-6">
              <Piece {...r.a} />
              <Op>&times;</Op>
              <Piece {...r.b} />
              <Op>=</Op>
              <Whole />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[13.5px] sm:text-[15px] font-headline text-center mt-7 pt-6" style={{ color: INK, fontWeight: 600, borderTop: "1px solid rgba(15,34,41,0.08)" }}>
        Online, over several weeks, bought once.
      </p>
    </div>
  );
}
