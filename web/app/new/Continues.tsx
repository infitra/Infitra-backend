import { INK, ORANGE, CYAN, MUTED, FAINT } from "./ui";

/**
 * M5 · AFTER THE FINALE — the continuation mechanic as a revenue line.
 * Mock = the real UI: run 1 completed → run 2 live, tribe carries over,
 * the "jump back in" strip past members actually see.
 */

export function Continues() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
            After the finale
          </p>
          <h2
            className="text-3xl md:text-4xl font-headline tracking-tight mb-5"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Experiences that don&apos;t end.
          </h2>
          <p className="text-base md:text-lg leading-relaxed max-w-md" style={{ color: MUTED }}>
            When a run wraps, the next one opens. The tribe carries over and past members
            rejoin in one tap. Retention becomes a revenue line — not a relaunch campaign.
          </p>
        </div>

        {/* Mock: run 1 → run 2 + the rejoin strip */}
        <div aria-hidden>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 rounded-2xl p-4 opacity-70"
              style={{ backgroundColor: "rgba(255,255,255,0.75)", boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }}
            >
              <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
                Run 1 · Jan – Feb
              </p>
              <p className="text-[13px] font-black font-headline mt-1" style={{ color: MUTED }}>
                ✓ Completed
              </p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: FAINT }}>12 members · rated ★ </p>
            </div>
            <svg width="26" height="14" viewBox="0 0 26 14" fill="none" className="shrink-0" aria-hidden>
              <line x1="1" y1="7" x2="20" y2="7" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" />
              <path d="M16 2 L23 7 L16 12" stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30), 0 12px 32px rgba(15,34,41,0.10)" }}
            >
              <p className="text-[8px] uppercase tracking-widest font-headline flex items-center gap-1" style={{ color: "#ef4444", fontWeight: 800 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse" /> Run 2 · Live now
              </p>
              <p className="text-[13px] font-black font-headline mt-1" style={{ color: INK }}>
                Same tribe, next chapter
              </p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: FAINT }}>one tap to continue</p>
            </div>
          </div>

          {/* the strip a past member sees */}
          <div
            className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.14), rgba(255,97,48,0.05))", boxShadow: "0 0 0 1px rgba(255,97,48,0.26)" }}
          >
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.16em] font-headline flex items-center gap-1.5" style={{ color: ORANGE, fontWeight: 800 }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ORANGE }} />
                Continues · live now
              </p>
              <p className="text-[13px] font-black font-headline truncate mt-0.5" style={{ color: INK }}>
                Your tribe moved on — jump back in
              </p>
            </div>
            <span
              className="shrink-0 px-4 py-2 rounded-full text-white text-[11px] font-black font-headline"
              style={{ backgroundColor: ORANGE, boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }}
            >
              Join →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
