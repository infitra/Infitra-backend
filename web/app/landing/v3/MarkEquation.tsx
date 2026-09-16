import { ORANGE } from "../ui";
import { MarkWaves } from "@/app/components/BrandWaves";

/**
 * THE MARK, TAKEN APART (16 Sep 2026): the model in one picture.
 *
 * Two people bring one part each, and what they make together is the whole
 * thing. The brand's own mark says that better than any diagram: each side is
 * literally a piece of it, and the two pieces are the INFITRA mark. Two rows,
 * two different cuts of the same mark, one result: whichever way in you take,
 * you end up at the same whole.
 *
 * The pieces are drawn by masking a brand colour through each part's alpha,
 * the way the founding mark is drawn. The whole is masked the same way, but
 * what shows through it is the brand waves themselves: the thing they make
 * wears the brand, the parts only carry its colours.
 *
 * On the dark stage, cyan is the bright one. Colour here means the two halves
 * of a collaboration; a studio keeps the cyan it wears everywhere else.
 */
const CREAM_MUTED = "rgba(242,239,232,0.72)";
const CREAM = "#F2EFE8";
const CYAN_BRIGHT = "#9CF0FF";

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
      <p
        className="text-[15px] sm:text-[19px] font-headline leading-tight mt-4"
        style={{ color, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
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
      style={{ color: "rgba(242,239,232,0.40)", fontWeight: 700 }}
    >
      {children}
    </span>
  );
}

/** The whole mark, with the brand's own waves running through it. */
function Whole() {
  return (
    <div className="w-[108px] sm:w-[186px] flex flex-col items-center text-center">
      <span
        aria-hidden
        className="relative block w-[76px] h-[54px] sm:w-[133px] sm:h-[94px] overflow-hidden"
        style={MASK("/founding-mark.png")}
      >
        {/* The brand gradient, with the brand's own wave paths crossing it as
           light. Two things turn a mark like this grey: filling it with the
           wave field, whose middle is white, and letting cyan interpolate
           into orange, which meets in mud. Hence the fast handover. The experience is one thing, so the whole sweeps rather
           than showing its two parts. */}
        <span
          className="absolute inset-0"
          style={{ background: `linear-gradient(45deg, ${CYAN_BRIGHT} 0%, ${CYAN_BRIGHT} 44%, ${ORANGE} 56%, ${ORANGE} 100%)` }}
        />
        <MarkWaves />
      </span>
      <p className="text-[15px] sm:text-[19px] font-headline leading-tight mt-4" style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.02em" }}>
        One live experience
      </p>
      <p className="text-[11px] sm:text-[12.5px] leading-snug mt-1" style={{ color: CREAM_MUTED }}>
        for the people who join
      </p>
    </div>
  );
}

const ROWS = [
  {
    key: "expert-expert",
    a: { src: "/mark/mark-first.png", color: ORANGE, label: "Expert" },
    b: { src: "/mark/mark-second.png", color: CYAN_BRIGHT, label: "Complementary expert" },
  },
  {
    key: "studio-expert",
    a: { src: "/mark/mark-ends.png", color: CYAN_BRIGHT, label: "Studio or gym" },
    b: { src: "/mark/mark-middle.png", color: ORANGE, label: "Outside expert" },
  },
];

export function MarkEquation() {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
        Two ways in
      </p>

      <div className="mt-7 flex flex-col gap-7 sm:gap-8">
        {ROWS.map((r, i) => (
          <div key={r.key} data-shape={r.key}>
            {i > 0 && <div className="mb-7 sm:mb-8 max-w-2xl mx-auto" style={{ borderTop: "1px solid rgba(242,239,232,0.14)" }} />}
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

      <p className="text-[13.5px] sm:text-[15px] font-headline text-center mt-8" style={{ color: CREAM, fontWeight: 600 }}>
        Online, over several weeks, bought once.
      </p>
    </div>
  );
}
