import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, SectionHead } from "./ui";
import { Reveal } from "./Reveal";

/**
 * M7 · THE FOUNDING PILOT — honest terms, two columns. Economics stay quiet:
 * the 10% pilot share is one bullet, not a headline (founder's call — the
 * platform speaks, not its pricing).
 */

const GET = [
  "Direct, hands-on work with the founder",
  "Founding terms — 10% platform share during the pilot",
  "Real influence on what gets built next",
  "Founding-creator status at public launch",
] as const;

const ASK = [
  "Design and run one real experience with your audience",
  "Show up to honest weekly feedback",
  "Based in DACH — or ready to pair with someone who is",
] as const;

function List({ items, color }: { items: readonly string[]; color: string }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-sm md:text-[15px] leading-snug" style={{ color: MUTED }}>
          <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: `${color}14` }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span style={{ color: INK, fontWeight: 600 }}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function FoundingPilot() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <SectionHead
          eyebrow="The founding pilot"
          title="Deliberately small. Deliberately early."
          sub="Everything you just saw is built and running. The pilot is where it meets real audiences — that's why it's 5 pairs, not 500."
        />
        <Reveal>
        <div
          className="rounded-3xl p-7 md:p-10 grid md:grid-cols-2 gap-8 md:gap-12"
          style={{ backgroundColor: "rgba(255,255,255,0.72)", boxShadow: CARD_SHADOW }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-4" style={{ color: ORANGE, fontWeight: 800 }}>
              What founding pairs get
            </p>
            <List items={GET} color={ORANGE} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-4" style={{ color: CYAN, fontWeight: 800 }}>
              What we ask
            </p>
            <List items={ASK} color={CYAN} />
          </div>
        </div>
        </Reveal>
        <p className="text-center text-xs mt-6 tracking-wide" style={{ color: FAINT }}>
          No fixed costs. The platform only earns when you do.
        </p>
      </div>
    </section>
  );
}
