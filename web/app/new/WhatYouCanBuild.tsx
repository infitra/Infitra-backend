"use client";

import { useState } from "react";
import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";

/**
 * M2 · WHAT YOU CAN BUILD — no wrapper framing: the example IS the card,
 * a compressed PORT of the real marketing page (PublicChallengeHero):
 * INFITRA EXPERIENCE eyebrow → the promise as the headline → cover with
 * LIVE pill → title kicker + one-line description → experts with real
 * taglines → stats → the REAL WeeklyJourneyCarousel (clickable W1–W6 pills,
 * real theme headers, real agenda session rows) → the page's positioning
 * lines → the join pill. Small client island for the carousel only.
 */
export function WhatYouCanBuild() {
  const [week, setWeek] = useState(0);
  const sessions = EX.agenda[week];

  return (
    <section className="px-4 sm:px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.25em] font-headline text-center mb-8" style={{ color: CYAN, fontWeight: 700 }}>
          An example — what you can build
        </p>

        {/* THE CARD IS THE PAGE */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
          <div className="p-6 md:p-10">
            <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 800 }}>
              INFITRA Experience
            </p>
            <h2
              className="text-2xl md:text-[2.1rem] font-headline tracking-tight leading-[1.12]"
              style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {EX.promise}
            </h2>

            {/* cover */}
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1] mt-6" style={{ backgroundColor: INK }}>
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
            </div>

            {/* kicker + one-line description */}
            <p className="text-[11px] uppercase tracking-[0.2em] font-headline mt-5" style={{ color: FAINT, fontWeight: 800 }}>
              {EX.title}
            </p>
            <p className="text-[14px] leading-relaxed mt-2" style={{ color: MUTED }}>
              {EX.blurb}
            </p>

            {/* experts — real taglines */}
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
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

            {/* stats */}
            <p className="text-[13px] font-bold font-headline mt-5 text-center" style={{ color: "#5b7886" }}>
              {EX.weeks} weeks · {EX.sessions} live sessions
              <span style={{ color: FAINT, fontWeight: 600 }}> · Always on: Tribe Space + Expert access</span>
            </p>

            {/* ── THE WEEKLY JOURNEY — the real carousel, browsable ── */}
            <div className="mt-7 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "#FAF8F3" }}>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                {EX.arc.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setWeek(i)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-black font-headline transition-colors"
                    style={
                      i === week
                        ? { backgroundColor: ORANGE, color: "#FFFFFF", boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }
                        : { backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.08)" }
                    }
                  >
                    W{i + 1}
                  </button>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-headline text-center mb-4" style={{ color: ORANGE, fontWeight: 800 }}>
                Week {week + 1}: {EX.arc[week]}
              </p>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.title} className="flex items-center gap-3.5 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}>
                    <span className="shrink-0 w-16 text-left">
                      <span className="block text-[11px] uppercase tracking-widest font-headline" style={{ color: INK, fontWeight: 800 }}>{s.day}</span>
                      <span className="block text-[9.5px] font-semibold" style={{ color: FAINT }}>{s.time} — {s.dur}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>{s.title}</span>
                      <span className="block text-[10px] font-bold" style={{ color: FAINT }}>{s.host}</span>
                    </span>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(8,145,178,0.45)" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* positioning + CTA — the real page's close */}
            <div className="mt-8 text-center">
              <p className="text-[17px] md:text-lg font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>
                {EX.positioning[0]}
                <br />
                <span style={{ color: ORANGE }}>{EX.positioning[1]}</span>
              </p>
              <span
                className="inline-block mt-5 px-12 py-3.5 rounded-full text-white text-sm font-black font-headline"
                style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.32)" }}
                aria-hidden
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
