"use client";

import { useState } from "react";
import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, PRODUCT_SHADOW } from "./ui";

/**
 * M2 · WHAT YOU CAN BUILD — the card IS the product, like the real marketing
 * page: one caption line, then the card opening with its cover full-bleed,
 * ONE weighty title block (orange tracked kicker + big promise + centered
 * description), experts, stats, and the REAL weekly-journey carousel — all
 * 20 real sessions browsable across W1–W6 as image cards, so a visitor can
 * walk the whole flow and see how two complementary experts design together.
 */
export function WhatYouCanBuild() {
  const [week, setWeek] = useState(0);
  const sessions = EX.agenda[week];

  return (
    <section className="px-4 sm:px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <p className="text-[12px] font-bold font-headline text-center mb-8 tracking-wide" style={{ color: FAINT }}>
          An example experience, built on INFITRA.
        </p>

        {/* THE CARD IS THE PRODUCT — cover first, full bleed */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }}>
          <div className="relative aspect-[16/9] sm:aspect-[2/1]" style={{ backgroundColor: INK }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(15,34,41,0.45), rgba(15,34,41,0))" }}
            />
            <span
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline"
              style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
              Live · {EX.weeks} weeks
            </span>
          </div>

          <div className="p-6 md:p-10 text-center">
            {/* ONE title block — real page grammar, real weight */}
            <p
              className="text-[15px] md:text-[17px] uppercase tracking-[0.18em] font-headline"
              style={{ color: ORANGE, fontWeight: 800 }}
            >
              {EX.title}
            </p>
            <h2
              className="text-2xl md:text-[2.1rem] font-headline tracking-tight leading-[1.15] mt-3 max-w-2xl mx-auto"
              style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {EX.promise}
            </h2>
            <p className="text-[15px] leading-relaxed mt-4 max-w-xl mx-auto" style={{ color: MUTED }}>
              {EX.blurb}
            </p>

            {/* experts — real taglines, role colors */}
            <div className="grid sm:grid-cols-2 gap-3 mt-7 text-left">
              {[
                { p: ALEX, color: ORANGE },
                { p: MIRA, color: CYAN },
              ].map(({ p, color }) => (
                <div key={p.name} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: `${color}0a`, border: `1px solid ${color}26` }}>
                  <span className="shrink-0 w-12 h-12 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-headline" style={{ color: INK, fontWeight: 800 }}>{p.name}</span>
                    <span className="block text-[11.5px] font-semibold leading-snug" style={{ color }}>{p.tagline}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* stats — the real page's line */}
            <p className="text-[13.5px] font-bold font-headline mt-6" style={{ color: "#5b7886" }}>
              {EX.weeks} weeks · {EX.sessions} live sessions
              <span style={{ color: FAINT, fontWeight: 600 }}> · Always on: Tribe Space + Expert access</span>
            </p>

            {/* ── THE WEEKLY JOURNEY — the real carousel, all 20 sessions ── */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                {EX.arc.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setWeek(i)}
                    className="px-3.5 py-1.5 rounded-full text-[12px] font-black font-headline transition-colors"
                    style={
                      i === week
                        ? { backgroundColor: ORANGE, color: "#FFFFFF", boxShadow: "0 4px 12px rgba(255,97,48,0.30)" }
                        : { backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.10)" }
                    }
                  >
                    W{i + 1}
                  </button>
                ))}
              </div>
              <p className="text-[12px] uppercase tracking-[0.18em] font-headline mb-4" style={{ color: ORANGE, fontWeight: 800 }}>
                Week {week + 1}: {EX.arc[week]}
              </p>

              {/* session image cards — 2-col grid, the editorial weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {sessions.map((s) => (
                  <div key={s.title} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F8F6F0", border: "1px solid rgba(15,34,41,0.06)" }}>
                    <div className="relative aspect-[16/8]" style={{ backgroundColor: INK }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                    <div className="p-3.5">
                      <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>
                        {s.day} · {s.time} — {s.dur}
                      </p>
                      <p className="text-[13.5px] font-headline leading-snug mt-1" style={{ color: INK, fontWeight: 800 }}>
                        {s.title}
                      </p>
                      <p className="text-[10.5px] font-bold mt-0.5" style={{ color: s.host.includes("&") ? MUTED : s.host === "Mira" ? CYAN : ORANGE }}>
                        {s.host}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* positioning + CTA — the real page's close */}
            <div className="mt-9">
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
      </div>
    </section>
  );
}
