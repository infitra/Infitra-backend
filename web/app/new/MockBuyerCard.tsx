import { EX, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, FAINT, Person } from "./ui";

/**
 * Compact marketing-page snippet used INSIDE the publish step's browser
 * frame (the full example lives in WhatYouCanBuild). Frameless — the browser
 * chrome supplies the card. Conceptual: no price, no dates.
 */
export function MockBuyerCard() {
  return (
    <div className="overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF" }} aria-hidden>
      <div className="relative overflow-hidden aspect-[16/7]" style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={EX.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(15,34,41,0.45), rgba(15,34,41,0))" }}
        />
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
          style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#9CF0FF", fontWeight: 700 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
          Live · {EX.weeks} weeks
        </span>
      </div>

      <div className="p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>
          {EX.title}
        </p>
        <p className="text-base font-headline tracking-tight leading-snug" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.015em" }}>
          {EX.promise}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3.5">
          <Person avatar={ALEX.avatar} name={ALEX.name} tag={ALEX.tag} color={ORANGE} size={30} />
          <Person avatar={MIRA.avatar} name={MIRA.name} tag={MIRA.tag} color={CYAN} size={30} />
        </div>
        <div
          className="mt-4 rounded-full py-2.5 text-center text-white text-[13px] font-black font-headline"
          style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.32)" }}
        >
          I&apos;m in →
        </div>
      </div>
    </div>
  );
}
