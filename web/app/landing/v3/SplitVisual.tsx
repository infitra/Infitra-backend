import { ORANGE } from "../ui";

/**
 * THE SPLIT (16 Sep 2026): the terms, shown rather than stated, on the stage.
 *
 * One sale drawn whole: the overwhelming part of it belongs to the two people
 * who made the experience, and the remainder is INFITRA's founding fee. The
 * dashed divider between them is the point: where it falls is theirs to set,
 * not ours, and the agreement records it before anything sells. The two sides
 * wear the same colours they wear in the mark above.
 *
 * Money framing follows the brand: what they KEEP is the visual, the fee is
 * disclosed second. On the dark ground cyan is the bright one, and the block
 * itself stays close to neutral glass: orange laid thickly over teal goes
 * brown, so the colour belongs to the type on it rather than to the fill.
 */
const CREAM = "#F2EFE8";
const CREAM_MUTED = "rgba(242,239,232,0.82)";
const CREAM_FAINT = "rgba(242,239,232,0.55)";
const CYAN_BRIGHT = "#9CF0FF";

const KEEPS = [
  { label: "With whom you choose", accent: ORANGE },
  { label: "When it fits", accent: CYAN_BRIGHT },
  { label: "No exclusivity, no subscription", accent: ORANGE },
  { label: "Free to leave at any time", accent: CYAN_BRIGHT },
];

function Check({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M4 12.5l5.5 5.5L20 7" />
    </svg>
  );
}

export function SplitVisual() {
  return (
    <div
      className="rounded-3xl p-5 sm:p-7"
      style={{ backgroundColor: "rgba(242,239,232,0.06)", border: "1px solid rgba(242,239,232,0.22)" }}
    >
      <p className="text-[11px] uppercase tracking-[0.25em] font-headline" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
        One sale
      </p>

      {/* Side by side from sm up, where the widths carry the proportion. On a
         phone the fee strip sits under the block instead: a tenth of a narrow
         bar is too thin to read. */}
      <div className="mt-4 flex flex-col sm:flex-row rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(242,239,232,0.26)" }}>
        <div
          className="w-full sm:w-[90%] shrink-0 flex items-stretch"
          style={{ background: "linear-gradient(120deg, rgba(255,97,48,0.10) 0%, rgba(156,240,255,0.10) 100%), rgba(242,239,232,0.16)" }}
        >
          <div className="flex-1 px-4 py-4 sm:py-5 text-left flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              You
            </p>
          </div>
          <div className="self-stretch my-3 shrink-0" style={{ borderLeft: "2px dashed rgba(242,239,232,0.60)" }} />
          <div className="flex-1 px-4 py-4 sm:py-5 text-left flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN_BRIGHT, fontWeight: 800 }}>
              Your complement
            </p>
          </div>
          <div className="px-4 py-4 sm:py-5 text-right flex flex-col justify-center shrink-0">
            <p className="font-headline leading-none" style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.03em", fontSize: "clamp(1.85rem, 3.6vw, 2.5rem)" }}>
              90%
            </p>
            <p className="text-[12px] font-bold font-headline mt-1.5" style={{ color: CREAM_MUTED }}>
              split as you agree
            </p>
          </div>
        </div>
        <div
          className="w-full sm:w-[10%] shrink-0 min-w-0 px-3 py-2.5 sm:py-5 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-0 text-center"
          style={{ backgroundColor: "rgba(242,239,232,0.055)" }}
        >
          <p className="text-[18px] font-headline leading-none" style={{ color: CREAM, fontWeight: 700, letterSpacing: "-0.02em" }}>
            10%
          </p>
          <p className="text-[10px] leading-tight sm:mt-1.5" style={{ color: CREAM_FAINT }}>
            founding fee
          </p>
        </div>
      </div>

      <p className="text-[14px] leading-relaxed mt-4" style={{ color: CREAM_MUTED }}>
        Written into a transparent agreement both sides accept, before anything
        sells.
      </p>

      <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(242,239,232,0.22)" }}>
        <p data-independence className="text-lg md:text-xl leading-relaxed font-headline" style={{ color: CREAM, fontWeight: 600, letterSpacing: "-0.01em" }}>
          You stay independent and still work together professionally.
        </p>
        <div className="mt-3.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2.5">
          {KEEPS.map((k) => (
            <span key={k.label} className="inline-flex items-start gap-2 text-[14px] leading-snug" style={{ color: CREAM_MUTED }}>
              <span className="mt-[2px]">
                <Check color={k.accent} />
              </span>
              {k.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
