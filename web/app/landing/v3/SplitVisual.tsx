import { INK, ORANGE, CYAN, MUTED, CARD_SHADOW } from "../ui";

/**
 * THE SPLIT (16 Sep 2026): the terms, shown rather than stated.
 *
 * Independence and the revenue split are the two things every supplier asks
 * about, and they were sitting at the bottom of the section as quiet text.
 * One sale is now drawn whole: the overwhelming part of it belongs to the two
 * people who made the experience, divided however they agree, and the
 * remainder is INFITRA's founding fee. The dashed divider is the point: the
 * split is theirs to set, not ours, and the agreement records it before
 * anything sells.
 *
 * Money framing follows the brand: what they KEEP is the visual, the fee is
 * disclosed second. No count of anything else, no dates.
 */
const KEEPS = [
  { label: "With whom you choose", accent: ORANGE },
  { label: "When it fits", accent: CYAN },
  { label: "No exclusivity, no subscription", accent: ORANGE },
  { label: "Free to leave at any time", accent: CYAN },
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
    <div className="rounded-3xl p-6 md:p-8" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_SHADOW }}>
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline" style={{ color: CYAN, fontWeight: 700 }}>
        One sale
      </p>

      {/* Side by side from sm up, where the widths carry the proportion.
         On a phone the fee strip sits under the block instead: a tenth of a
         narrow bar is too thin to read. */}
      <div className="mt-4 flex flex-col sm:flex-row rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(15,34,41,0.08)" }}>
        <div
          className="w-full sm:w-[90%] shrink-0 flex items-stretch"
          style={{ background: "linear-gradient(120deg, rgba(255,97,48,0.14) 0%, rgba(8,145,178,0.14) 100%)" }}
        >
          <div className="flex-1 px-4 py-5 sm:py-6 text-left">
            <p className="text-[11px] uppercase tracking-[0.16em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              You
            </p>
            <p className="text-[12.5px] leading-snug mt-1" style={{ color: MUTED }}>
              and your complement
            </p>
          </div>
          <div className="self-stretch my-3 shrink-0" style={{ borderLeft: "2px dashed rgba(15,34,41,0.22)" }} />
          <div className="flex-1 px-4 py-5 sm:py-6 text-right flex flex-col justify-center">
            <p className="font-headline leading-none" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.03em", fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>
              90%
            </p>
            <p className="text-[12px] font-bold font-headline mt-1.5" style={{ color: MUTED }}>
              split as you agree
            </p>
          </div>
        </div>
        <div
          className="w-full sm:w-[10%] shrink-0 min-w-0 px-3 py-2.5 sm:py-6 flex flex-row sm:flex-col items-center justify-center gap-1.5 sm:gap-0 text-center"
          style={{ backgroundColor: "rgba(15,34,41,0.06)" }}
        >
          <p className="text-[18px] font-headline leading-none" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
            10%
          </p>
          <p className="text-[10px] leading-tight sm:mt-1.5" style={{ color: MUTED }}>
            founding fee
          </p>
        </div>
      </div>

      <p className="text-[13.5px] leading-relaxed mt-4" style={{ color: MUTED }}>
        Written into a transparent agreement both sides accept, before anything
        sells. No upfront cost, no subscription.
      </p>

      <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(15,34,41,0.10)" }}>
        <p data-independence className="text-base md:text-lg leading-relaxed" style={{ color: INK, fontWeight: 600 }}>
          You stay independent and still work together professionally.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
          {KEEPS.map((k) => (
            <span key={k.label} className="inline-flex items-start gap-2 text-[13.5px] leading-snug" style={{ color: MUTED }}>
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
