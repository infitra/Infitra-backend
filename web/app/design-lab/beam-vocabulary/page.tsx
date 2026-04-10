import Link from "next/link";
import type { CSSProperties } from "react";
import { DepthBackground } from "@/app/components/DepthBackground";

export const metadata = {
  title: "Beam vocabulary — Design Lab",
};

// Self-contained mockup of the bottom-beam direction with the new card
// vocabulary applied to a sessions-style list. Uses sample data so the
// page is viewable without auth.

const cardBeamCyan: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #9CF0FF",
    "0 0 18px rgba(156,240,255,0.45)",
    "0 0 48px rgba(156,240,255,0.20)",
    "0 6px 30px rgba(156,240,255,0.32)",
    "0 14px 50px rgba(156,240,255,0.16)",
  ].join(", "),
};

const buttonBeamOrange: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #FF6130",
    "0 0 14px rgba(255,97,48,0.55)",
    "0 0 36px rgba(255,97,48,0.28)",
    "0 5px 22px rgba(255,97,48,0.40)",
  ].join(", "),
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  published: {
    label: "Published",
    color: "text-[#9CF0FF] bg-[#9CF0FF]/10 border-[#9CF0FF]/25",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-[#9CF0FF]/70 bg-[#9CF0FF]/6 border-[#9CF0FF]/15",
  },
  ended: {
    label: "Ended",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/4 border-[#9CF0FF]/10",
  },
};

const SAMPLE_SESSIONS = [
  { id: "1", title: "Tuesday Morning Flow", status: "published", date: "8 Apr 2026 · 09:00", attendees: 14, revenueCHF: 280, isFeatured: true },
  { id: "2", title: "HIIT Power Hour", status: "scheduled", date: "9 Apr 2026 · 19:00", attendees: 8, revenueCHF: 160, isFeatured: false },
  { id: "3", title: "Strength Foundations", status: "scheduled", date: "11 Apr 2026 · 17:30", attendees: 22, revenueCHF: 440, isFeatured: false },
  { id: "4", title: "Yoga Reset", status: "ended", date: "5 Apr 2026 · 17:30", attendees: 31, revenueCHF: 620, isFeatured: false },
  { id: "5", title: "Mobility Mondays", status: "ended", date: "2 Apr 2026 · 17:30", attendees: 18, revenueCHF: 360, isFeatured: false },
];

export default function BeamVocabularyPage() {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      <DepthBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-10 py-10">
        {/* Lab breadcrumb */}
        <div className="mb-8">
          <Link
            href="/design-lab"
            className="font-headline text-[10px] uppercase tracking-[0.25em] text-white/40 hover:text-[#9CF0FF] transition-colors"
          >
            ← Design Lab
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              Sessions
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mt-1">
              Beam vocabulary preview · sample data
            </p>
          </div>
          <button
            type="button"
            className="px-7 py-3 rounded-md bg-[#0F2229] text-[#FF6130] text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
            style={buttonBeamOrange}
          >
            New Session
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {SAMPLE_SESSIONS.map((session) => {
            const s = STATUS_STYLES[session.status];
            return (
              <div
                key={session.id}
                className="beam-hover-cyan block p-5 rounded-xl bg-[rgba(15,34,41,0.55)] backdrop-blur-xl border border-[rgba(156,240,255,0.10)] hover:bg-[rgba(15,34,41,0.85)] hover:border-[rgba(156,240,255,0.28)] cursor-pointer group"
                style={session.isFeatured ? cardBeamCyan : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {session.isFeatured && (
                        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CF0FF] shrink-0">
                          Next up
                        </span>
                      )}
                      <h3 className="text-lg font-black text-white font-headline tracking-tight truncate">
                        {session.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9CF0FF]/40">
                      <span>{session.date}</span>
                      {session.attendees > 0 && (
                        <span>{session.attendees} attendees</span>
                      )}
                      {session.revenueCHF > 0 && (
                        <span>CHF {session.revenueCHF.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="text-[#9CF0FF]/30 group-hover:text-[#9CF0FF]/60 transition-colors shrink-0 mt-1"
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
