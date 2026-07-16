import { INK, ORANGE, CYAN, MUTED, FAINT, ApplyCTA } from "./ui";

/**
 * M8 · FROM HERE — the path from application to the first live session,
 * then the final CTA. Process transparency reads serious and lowers the
 * cost of clicking Apply.
 */

const STEPS = [
  { t: "Apply", d: "5 minutes" },
  { t: "Intro call", d: "with the founder" },
  { t: "Pair up & onboard", d: "we help you match" },
  { t: "Co-design", d: "1–2 weeks in the workspace" },
  { t: "Publish & go live", d: "your first run" },
] as const;

export function Process() {
  return (
    <section className="px-6 pt-24 pb-32">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
          From here
        </p>
        <h2
          className="text-4xl md:text-5xl font-headline tracking-tight mb-14"
          style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          Be one of the first 5 pairs.
        </h2>

        {/* The path */}
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-3 md:gap-0 mb-14">
          {STEPS.map((s, i) => (
            <div key={s.t} className="flex md:flex-1 items-center md:flex-col gap-3 md:gap-2.5 text-left md:text-center">
              <span
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black font-headline"
                style={{
                  backgroundColor: i === 0 ? ORANGE : "rgba(8,145,178,0.10)",
                  color: i === 0 ? "#FFFFFF" : CYAN,
                  boxShadow: i === 0 ? "0 4px 12px rgba(255,97,48,0.30)" : undefined,
                }}
              >
                {i + 1}
              </span>
              <span className="md:px-2">
                <span className="block text-sm font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
                  {s.t}
                </span>
                <span className="block text-[11px] mt-0.5" style={{ color: FAINT }}>
                  {s.d}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span className="hidden md:block h-px flex-1 mt-[-34px]" style={{ backgroundColor: "rgba(8,145,178,0.25)" }} aria-hidden />
              )}
            </div>
          ))}
        </div>

        <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: MUTED }}>
          Closed pilot with fitness creator pairs in DACH (Switzerland, Germany, Austria).
          One real experience per pair, run live with direct support.
        </p>

        <ApplyCTA micro="Reviewed individually · starting now" />
      </div>
    </section>
  );
}
