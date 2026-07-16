import { INK, CYAN, FAINT, MUTED, SectionHead, ApplyCTA } from "./ui";

/**
 * M4 · EVERYTHING TAKEN CARE OF — a typographic cascade, not a feature grid.
 * Lists ONLY what the platform actually provides/automates. The tribe is
 * deliberately "the space for your tribe" — engaging and leading it is the
 * creator's job, and the closing line owns that division honestly.
 */

const LINES = [
  "The shared workspace.",
  "Clear ownership.",
  "The signed contract.",
  "The revenue split — on every sale.",
  "Your page and checkout.",
  "Receipts and calendars.",
  "The live rooms.",
  "The space for your tribe.",
  "Progress and check-ins.",
  "Reviews that credit every expert.",
] as const;

export function TakenCareOf() {
  return (
    <section className="px-6 py-28">
      <div className="max-w-2xl mx-auto text-center">
        <SectionHead eyebrow="All of it, taken care of" title="Everything around the coaching." />

        <div className="space-y-3.5">
          {LINES.map((line) => (
            <p key={line} className="flex items-center justify-center gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-lg md:text-2xl font-headline tracking-tight" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}>
                {line}
              </span>
            </p>
          ))}
        </div>

        {/* the honest division */}
        <div className="mt-14">
          <p className="text-[11px] uppercase tracking-[0.22em] font-headline mb-3" style={{ color: FAINT, fontWeight: 800 }}>
            So you can do the part only you can do
          </p>
          <p
            className="text-2xl md:text-4xl font-headline tracking-tight leading-[1.15]"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            You coach.
            <br />
            You lead your tribe.
          </p>
          <p className="text-base md:text-lg mt-4 max-w-md mx-auto" style={{ color: MUTED }}>
            The platform runs everything around you.
          </p>
        </div>

        <div className="mt-14">
          <ApplyCTA small micro="5 founding pairs · starting now" />
        </div>
      </div>
    </section>
  );
}
