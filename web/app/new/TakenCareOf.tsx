import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

/**
 * M5 · EVERYTHING TAKEN CARE OF — the recap AFTER the full story, mirroring
 * the page's two acts: while you build / while it runs. One composed
 * manifest card, then the honest division — the platform provides the space
 * for the tribe; engaging and leading it is the creator's craft.
 */

const BUILD = [
  "The shared workspace",
  "Clear ownership",
  "The agreement — recorded",
  "The contract — sealed automatically",
] as const;

const RUN = [
  "The marketing page + checkout",
  "The revenue split — booked on every sale",
  "Receipts + calendars",
  "The live rooms",
  "The space for your tribe",
  "Check-ins + reflections",
  "Reviews that credit every expert",
] as const;

function Column({ label, color, items }: { label: string; color: string; items: readonly string[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-4" style={{ color, fontWeight: 800 }}>
        {label}
      </p>
      <ul className="space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2.5">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: `${color}14` }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-[15px] font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>
              {t}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TakenCareOf() {
  return (
    <section className="px-6 py-28" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 14%, rgba(255,255,255,0.55) 86%, rgba(255,255,255,0) 100%)" }}>
      <div className="max-w-3xl mx-auto text-center">
        <SectionHead eyebrow="All of it, taken care of" title="Everything around the coaching." />

        <Reveal>
        <div
          className="rounded-3xl p-7 md:p-10 grid sm:grid-cols-2 gap-8 md:gap-12 text-left"
          style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}
        >
          <Column label="While you build" color={CYAN} items={BUILD} />
          <Column label="While it runs" color={ORANGE} items={RUN} />
        </div>
        </Reveal>

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
      </div>
    </section>
  );
}
