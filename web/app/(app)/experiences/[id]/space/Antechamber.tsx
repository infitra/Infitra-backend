"use client";

/**
 * Antechamber — the UPCOMING buyer's waiting room. They hold a future run while a
 * prior run is still live, so they see NOTHING of the current cohort — just a
 * focused "your chapter opens [date]" card. Their intro is promised at kickoff,
 * not offered here (that would land in a tribe they aren't part of).
 */

import type { ExperienceSummary, SpaceCreator } from "@/lib/experienceSpace/store";
import { Avatar } from "./Avatar";

const INK = "#0F2229";
const CYAN = "#0891b2";
const ORANGE = "#FF6130";

function fmtChapterDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function Antechamber({
  experience,
  runStart,
  creators,
}: {
  experience: ExperienceSummary;
  runStart: string | null;
  creators: SpaceCreator[];
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16">
      <div
        className="rounded-3xl px-6 py-10 sm:px-10 text-center"
        style={{
          background: "linear-gradient(160deg, rgba(8,145,178,0.08), rgba(156,240,255,0.06) 60%, #FFFFFF)",
          boxShadow: "0 0 0 1px rgba(8,145,178,0.14), 0 12px 34px rgba(15,34,41,0.10)",
        }}
      >
        <div className="inline-flex w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.14)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-headline mt-5" style={{ color: CYAN, fontWeight: 800 }}>
          You&apos;re in
        </p>
        <h1 className="text-2xl sm:text-3xl font-headline tracking-tight mt-1.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {experience.title}
        </h1>
        <p className="text-lg sm:text-xl font-black font-headline mt-4" style={{ color: INK }} suppressHydrationWarning>
          Your experience starts {runStart ? fmtChapterDate(runStart) : "soon"}
        </p>
        <p className="text-[14px] font-medium mt-2.5 max-w-md mx-auto" style={{ color: "#5b7886" }}>
          Infitra experiences are alive and all about momentum. The current tribe is mid-run. We&apos;ll bring you into the tribe when the experience opens its next run with you as a vital part!
        </p>
        {creators.length > 0 && (
          <div className="mt-7">
            <p className="text-[10px] uppercase tracking-[0.16em] font-headline mb-2.5" style={{ color: "#94a3b8", fontWeight: 800 }}>
              Your experts
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {creators.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Avatar src={c.avatar} name={c.name} size={32} ring={c.role === "owner" ? ORANGE : CYAN} />
                  <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
