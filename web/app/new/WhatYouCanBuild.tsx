"use client";

import { useState } from "react";
import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT } from "./ui";
import { Drift } from "./vignette";

/**
 * M2 · WHAT YOU CAN BUILD — the hero vignette. Not a page-in-a-card: the
 * marketing page's ELEMENTS re-composed in layers that breathe — the cover
 * as a backdrop plate, the title block overlapping it, the experts floating,
 * and the weekly journey as a browsable strip (all 20 real sessions across
 * W1–W6, interactive). Gentle Drift parallax connects the layers on scroll.
 */
export function WhatYouCanBuild() {
  const [week, setWeek] = useState(0);
  const sessions = EX.agenda[week];

  return (
    <section
      className="px-4 sm:px-6 py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 14%, rgba(255,255,255,0.5) 86%, rgba(255,255,255,0) 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* the section's title moment — weighty, two-tone, and still the honesty label */}
        <div className="flex items-center gap-4 sm:gap-5 mb-10">
          <div className="hidden sm:block flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
          <h2
            className="mx-auto text-center text-2xl md:text-[2rem] font-headline tracking-tight leading-snug"
            style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            An example experience,
            <br className="sm:hidden" />
            <span style={{ color: ORANGE }}> built on INFITRA.</span>
          </h2>
          <div className="hidden sm:block flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
        </div>

        {/* ── the cover as backdrop plate ── */}
        <Drift depth={6}>
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[2/1]" style={{ backgroundColor: INK, boxShadow: "0 30px 80px rgba(15,34,41,0.20)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.55), rgba(15,34,41,0))" }} />
            <span
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline"
              style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
              Live · {EX.weeks} weeks
            </span>
          </div>
        </Drift>

        {/* ── the title block, overlapping the cover ── */}
        <Drift depth={16} className="relative z-10 -mt-14 sm:-mt-20">
          <div className="mx-auto w-[94%] sm:w-[86%] rounded-3xl px-6 py-7 sm:px-10 sm:py-8 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 26px 64px rgba(15,34,41,0.16)" }}>
            <p className="text-[13px] sm:text-[15px] uppercase tracking-[0.18em] font-headline" style={{ color: ORANGE, fontWeight: 800 }}>
              {EX.title}
            </p>
            <h2 className="text-xl sm:text-[1.75rem] font-headline tracking-tight leading-[1.18] mt-2.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
              {EX.promise}
            </h2>
            <p className="text-[13.5px] sm:text-[14.5px] leading-relaxed mt-3 max-w-xl mx-auto" style={{ color: MUTED }}>
              {EX.blurb}
            </p>
          </div>
        </Drift>

        {/* ── the experts, floating ── */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6 sm:px-6">
          {[
            { p: ALEX, color: ORANGE, depth: 22, r: -0.8 },
            { p: MIRA, color: CYAN, depth: 28, r: 0.8 },
          ].map(({ p, color, depth, r }) => (
            <Drift key={p.name} depth={depth}>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", boxShadow: `0 0 0 1px ${color}26, 0 16px 40px rgba(15,34,41,0.10)`, transform: `rotate(${r}deg)` }}>
                <span className="shrink-0 w-12 h-12 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[15px] font-headline" style={{ color: INK, fontWeight: 800 }}>{p.name}</span>
                  <span className="block text-[11.5px] font-semibold leading-snug" style={{ color }}>{p.tagline}</span>
                </span>
              </div>
            </Drift>
          ))}
        </div>

        {/* ── stats chip ── */}
        <Drift depth={12}>
          <p className="text-[13px] font-bold font-headline mt-6 text-center" style={{ color: "#5b7886" }}>
            {EX.weeks} weeks · {EX.sessions} live sessions
            <span style={{ color: FAINT, fontWeight: 600 }}> · Always on: Tribe Space + Expert access</span>
          </p>
        </Drift>

        {/* ── the weekly journey — the browsable strip ── */}
        <Drift depth={10} className="mt-7">
          <div className="rounded-3xl p-5 sm:p-6" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 26px 64px rgba(15,34,41,0.13)" }}>
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
                      : { backgroundColor: "#F8F6F0", color: FAINT }
                  }
                >
                  W{i + 1}
                </button>
              ))}
            </div>
            <p className="text-[12px] uppercase tracking-[0.18em] font-headline mb-4 text-center" style={{ color: ORANGE, fontWeight: 800 }}>
              Week {week + 1}: {EX.arc[week]}
            </p>

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
        </Drift>

        {/* ── the close ── */}
        <Drift depth={14}>
          <div className="mt-9 text-center">
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
        </Drift>
      </div>
    </section>
  );
}
