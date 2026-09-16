import { ORANGE } from "../ui";

/**
 * THE MARK, TAKEN APART (16 Sep 2026): the model in one picture.
 *
 * Two sides bring one part each, and what they make together is the whole
 * thing. The brand's own mark says that better than any diagram: each side is
 * literally a piece of it. Two rows, two different cuts of the same mark, one
 * result: whichever way in you take, you end up at the same whole.
 *
 * The parts are OUTLINED and the whole is filled, so the weight of each row
 * sits on the role and on the result rather than on the shapes. The outline
 * is the mark drawn in the ground colour with the accent pushed out around it
 * from four sides, which gives an even rim on a shape we only have as an
 * image.
 *
 * Colour is the page's role code: experts orange, studios and gyms cyan.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.72)";
const CYAN_BRIGHT = "#9CF0FF";
const TEAL = "#0C262E";

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

const rim = (color: string, w: number) =>
  [
    `drop-shadow(${w}px 0 0 ${color})`,
    `drop-shadow(-${w}px 0 0 ${color})`,
    `drop-shadow(0 ${w}px 0 ${color})`,
    `drop-shadow(0 -${w}px 0 ${color})`,
  ].join(" ");

function Piece({ src, color, label }: { src: string; color: string; label: string }) {
  return (
    <div className="w-[82px] sm:w-[150px] flex flex-col items-center text-center">
      <span aria-hidden className="block" style={{ filter: rim(color, 2) }}>
        <span
          className="block w-[54px] h-[54px] sm:w-[94px] sm:h-[94px]"
          style={{ backgroundColor: TEAL, ...MASK(src) }}
        />
      </span>
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

/** The whole, filled: one thing, in the brand's two colours. The handover is
 *  fast because cyan and orange meet in mud if you let them interpolate. */
function Whole() {
  return (
    <div className="w-[108px] sm:w-[186px] flex flex-col items-center text-center">
      <span
        aria-hidden
        className="block w-[76px] h-[54px] sm:w-[133px] sm:h-[94px]"
        style={{
          background: `linear-gradient(45deg, ${CYAN_BRIGHT} 0%, ${CYAN_BRIGHT} 44%, ${ORANGE} 56%, ${ORANGE} 100%)`,
          ...MASK("/founding-mark.png"),
        }}
      />
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
    b: { src: "/mark/mark-second.png", color: ORANGE, label: "Complementary expert" },
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
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center" style={{ color: CREAM_MUTED, fontWeight: 700 }}>
        Two ways in
      </p>

      <div className="mt-7 flex flex-col gap-7 sm:gap-8">
        {ROWS.map((r, i) => (
          <div key={r.key} data-shape={r.key}>
            {i > 0 && <div className="mb-7 sm:mb-8 max-w-2xl mx-auto" style={{ borderTop: "1px solid rgba(242,239,232,0.16)" }} />}
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
