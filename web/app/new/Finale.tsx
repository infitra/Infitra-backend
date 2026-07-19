import { INK, ORANGE, CYAN, MUTED, FAINT, ApplyCTA } from "./ui";
import { Reveal } from "./Reveal";
import { WaitlistForm } from "./WaitlistForm";

/**
 * M8 · THE FINALE — "The room is open." The page's single climax, replacing
 * the old Process section. The mission statement frames the invite, then two
 * doors: creators found the pilot (primary, carries the compressed 5-step
 * path + the five founding slots), participants join the waitlist (quiet,
 * one field). The story ends with the reader choosing a side of the room.
 */

const STEPS = [
  { t: "Apply", d: "5 minutes" },
  { t: "Intro call", d: "with the founder" },
  { t: "Pair up", d: "we help you match" },
  { t: "Co-design", d: "1–2 weeks" },
  { t: "Go live", d: "your first run" },
] as const;

export function Finale() {
  return (
    <section id="join" className="px-6 pt-24 pb-32" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 16%, rgba(255,255,255,0.45) 100%)" }}>
      <div className="max-w-5xl mx-auto">
        {/* The conclusion — mission as the frame of the invite */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-4" style={{ color: ORANGE, fontWeight: 800 }}>
            From here
          </p>
          <h2
            className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.05] mb-6"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}
          >
            The room <span style={{ color: ORANGE }}>is open.</span>
          </h2>
          <p className="text-base md:text-xl leading-relaxed max-w-2xl mx-auto" style={{ color: MUTED }}>
            Digital fitness is shifting — from paying for access to content, to
            participating in live experiences built together. This is where it
            starts, and there are two ways in.
          </p>
        </div>

        <Reveal>
          <div className="grid lg:grid-cols-5 gap-6 items-stretch">
            {/* Door 1 — creators (primary) */}
            <div
              className="lg:col-span-3 rounded-3xl p-8 md:p-10 flex flex-col text-left"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 24px 60px rgba(255,97,48,0.12)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
                For creators · The founding pilot
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Build one of the first five.
              </h3>
              <p className="text-[15px] md:text-base mt-3 leading-relaxed" style={{ color: MUTED }}>
                Pair with a complementary expert and found a real experience with
                direct, hands-on support — everything you just scrolled through,
                running for your audience.
              </p>

              {/* the path, compressed */}
              <div className="flex flex-wrap items-center gap-y-2 mt-7">
                {STEPS.map((s, i) => (
                  <span key={s.t} className="flex items-center">
                    <span className="flex items-center gap-2">
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-headline"
                        style={{
                          backgroundColor: i === 0 ? ORANGE : "rgba(8,145,178,0.10)",
                          color: i === 0 ? "#FFFFFF" : CYAN,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-[12.5px] font-headline leading-none" style={{ color: INK, fontWeight: 800 }}>
                        {s.t}
                        <span className="block text-[10px] mt-1" style={{ color: FAINT, fontWeight: 700 }}>{s.d}</span>
                      </span>
                    </span>
                    {i < STEPS.length - 1 && (
                      <span className="mx-3 w-4 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} aria-hidden />
                    )}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-auto pt-9">
                <ApplyCTA />
                <div>
                  <span className="flex items-center gap-1.5" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,97,48,0.30)", boxShadow: "inset 0 0 0 1.5px rgba(255,97,48,0.55)" }} />
                    ))}
                  </span>
                  <p className="text-[11px] mt-2 tracking-wide" style={{ color: FAINT }}>
                    5 founding slots · DACH · reviewed individually
                  </p>
                </div>
              </div>
            </div>

            {/* Door 2 — participants (quiet) */}
            <div
              className="lg:col-span-2 rounded-3xl p-8 md:p-10 flex flex-col text-left"
              style={{ backgroundColor: "rgba(8,145,178,0.06)", boxShadow: "0 0 0 1px rgba(8,145,178,0.22)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>
                For participants
              </p>
              <h3 className="text-2xl md:text-[2rem] font-headline tracking-tight mt-3 leading-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Be in the first rooms.
              </h3>
              <p className="text-[15px] md:text-base mt-3 leading-relaxed" style={{ color: MUTED }}>
                The first experiences open with the pilot. Leave your email and
                you&apos;re first in when the doors open.
              </p>
              <div className="mt-auto pt-9">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
