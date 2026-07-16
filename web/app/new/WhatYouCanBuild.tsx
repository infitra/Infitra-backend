import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, FAINT, PRODUCT_SHADOW, SectionHead } from "./ui";

/**
 * M2 · WHAT YOU CAN BUILD — a very compressed PORT of the real buyer page
 * (PublicChallengeHero grammar): INFITRA EXPERIENCE eyebrow → the promise as
 * the big headline → cover with LIVE pill → experts with their real taglines
 * → stats → the weekly journey strip (week pills + agenda session cards with
 * image thumbs) → the real positioning lines → the join pill. Real imagery,
 * real editorial type — no invented layout.
 */
export function WhatYouCanBuild() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <SectionHead eyebrow="An example" title="What you can build." />

        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
          <div className="p-6 md:p-10">
            {/* the real page opens: eyebrow → promise as H1 */}
            <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 800 }}>
              INFITRA Experience
            </p>
            <h3
              className="text-2xl md:text-[2.1rem] font-headline tracking-tight leading-[1.12] mb-6"
              style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {EX.promise}
            </h3>

            {/* cover */}
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1]" style={{ backgroundColor: INK }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(15,34,41,0.50), rgba(15,34,41,0))" }}
              />
              <span
                className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-headline"
                style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
                Live · {EX.weeks} weeks
              </span>
              <span
                className="absolute bottom-4 left-4 text-[11px] uppercase tracking-[0.2em] font-headline"
                style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}
              >
                {EX.title}
              </span>
            </div>

            {/* experts — real taglines, role colors */}
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              {[
                { p: ALEX, color: ORANGE },
                { p: MIRA, color: CYAN },
              ].map(({ p, color }) => (
                <div key={p.name} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: `${color}0a`, border: `1px solid ${color}26` }}>
                  <span className="shrink-0 w-11 h-11 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-headline" style={{ color: INK, fontWeight: 800 }}>{p.name}</span>
                    <span className="block text-[11px] font-semibold leading-snug" style={{ color }}>{p.tagline}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* stats — the real page's line */}
            <p className="text-[13px] font-bold font-headline mt-5 text-center" style={{ color: "#5b7886" }}>
              {EX.weeks} weeks · {EX.sessions} live sessions
              <span style={{ color: FAINT, fontWeight: 600 }}> · Always on: Tribe Space + Expert access</span>
            </p>

            {/* the weekly journey — week pills + agenda cards with thumbs */}
            <div className="mt-7">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] font-headline" style={{ color: INK, fontWeight: 800 }}>
                  The weekly journey
                </p>
                <div className="flex gap-1.5">
                  {EX.arc.map((_, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[9px] font-black font-headline"
                      style={
                        i === 0
                          ? { backgroundColor: ORANGE, color: "#FFFFFF" }
                          : { backgroundColor: "rgba(15,34,41,0.05)", color: "#94a3b8" }
                      }
                    >
                      W{i + 1}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-[0.16em] font-headline mb-3" style={{ color: ORANGE, fontWeight: 800 }}>
                Week 1 · {EX.arc[0]}
              </p>
              <div className="-mx-6 md:-mx-10 px-6 md:px-10 overflow-x-auto">
                <div className="grid grid-cols-3 gap-3 min-w-[520px]">
                  {EX.week1.map((s) => (
                    <div key={s.title} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F8F6F0", border: "1px solid rgba(15,34,41,0.06)" }}>
                      <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: INK }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="text-[12px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>{s.title}</p>
                        <p className="text-[10px] font-bold mt-1" style={{ color: FAINT }}>
                          {s.host} · live · {s.dur}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* the real positioning lines + join pill */}
            <div className="mt-8 text-center">
              <p className="text-[17px] md:text-lg font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>
                {EX.positioning[0]}
                <br />
                <span style={{ color: ORANGE }}>{EX.positioning[1]}</span>
              </p>
              <span
                className="inline-block mt-5 px-12 py-3.5 rounded-full text-white text-sm font-black font-headline"
                style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.32)" }}
              >
                I&apos;m in →
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4 tracking-wide" style={{ color: FAINT }}>
          An example experience, built on INFITRA.
        </p>
      </div>
    </section>
  );
}
