import { INK, CYAN, FAINT, SectionHead } from "./ui";

/**
 * M6 · ALL OF IT, LIVE TODAY — the compact "everything included" grid.
 * Honesty footnote: this page shows the actual platform, running in
 * production — the anti-oversell anchor of the whole story.
 */

const FEATURES = [
  "Shared workspace",
  "Signed contracts",
  "Automatic revenue splits",
  "Experience page + checkout",
  "Stripe payments · CHF",
  "Live session rooms",
  "Tribe space",
  "Progress + check-ins",
  "Questions routed to experts",
  "Calendar export",
  "Continuations",
  "Ratings that credit every expert",
] as const;

export function Handled() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <SectionHead
          eyebrow="All of it, live today"
          title="Everything around the coaching — handled."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.78)", border: "1px solid rgba(8,145,178,0.20)" }}
            >
              <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="text-xs md:text-[13px] font-headline leading-tight" style={{ color: INK, fontWeight: 700 }}>
                {f}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs mt-8 tracking-wide max-w-md mx-auto" style={{ color: FAINT }}>
          This page shows the actual platform. Every surface above is running in production today.
        </p>
      </div>
    </section>
  );
}
