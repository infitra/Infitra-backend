import { ORANGE } from "../ui";
import { CardWaves } from "@/app/components/BrandWaves";

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
      <p className="text-[11px] sm:text-[13px] leading-snug mt-3.5" style={{ color: CREAM_MUTED }}>
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
function Whole({ id }: { id: string }) {
  return (
    <div className="w-[108px] sm:w-[186px] flex flex-col items-center text-center">
      <span
        aria-hidden
        className="relative block w-[76px] h-[54px] sm:w-[133px] sm:h-[94px] overflow-hidden"
        style={MASK("/founding-mark.png")}
      >
        {/* The brand colours carry it, the real waves run across them: the
           wave field's own middle is a pale band, which at this size would
           wash the mark out on its own. */}
        <span
          className="absolute inset-0"
          style={{ background: `linear-gradient(115deg, ${ORANGE} 0%, ${ORANGE} 46%, ${CYAN_BRIGHT} 54%, ${CYAN_BRIGHT} 100%)` }}
        />
        <span className="absolute inset-0" style={{ opacity: 0.38 }}>
          <CardWaves id={id} />
        </span>
      </span>
      <p className="text-[12.5px] sm:text-[15px] font-headline leading-snug mt-3.5" style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.02em" }}>
        One live experience
      </p>
      <p className="text-[10.5px] sm:text-[11.5px] leading-snug mt-0.5" style={{ color: CREAM_MUTED }}>
        for the people who join
      </p>
    </div>
  );
}

const ROWS = [
  {
    key: "expert-expert",
    id: "whole-a",
    a: { src: "/mark/mark-first.png", color: ORANGE, label: "An expert" },
    b: { src: "/mark/mark-second.png", color: CYAN_BRIGHT, label: "A complementary expert" },
  },
  {
    key: "studio-expert",
    id: "whole-b",
    a: { src: "/mark/mark-ends.png", color: CYAN_BRIGHT, label: "A studio or gym" },
    b: { src: "/mark/mark-middle.png", color: ORANGE, label: "An outside expert" },
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
              <Whole id={r.id} />
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
