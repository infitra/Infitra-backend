import Link from "next/link";
import { DepthBackgroundWaves } from "@/app/components/DepthBackgroundWaves";

export const metadata = {
  title: "Wave background — Design Lab",
};

// Self-contained mockup of the original wave-and-particles background.
// Uses the OLD card styling (solid bg, basic borders, orange hover) so
// the comparison to the beam vocabulary is honest — both card system
// and background change between the two directions.

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  published: {
    label: "Published",
    color: "text-green-400 bg-green-400/8 border-green-400/20",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-400 bg-blue-400/8 border-blue-400/20",
  },
  ended: {
    label: "Ended",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/5 border-[#9CF0FF]/10",
  },
};

const SAMPLE_SESSIONS = [
  { id: "1", title: "Tuesday Morning Flow", status: "published", date: "8 Apr 2026 · 09:00", attendees: 14, revenueCHF: 280 },
  { id: "2", title: "HIIT Power Hour", status: "scheduled", date: "9 Apr 2026 · 19:00", attendees: 8, revenueCHF: 160 },
  { id: "3", title: "Strength Foundations", status: "scheduled", date: "11 Apr 2026 · 17:30", attendees: 22, revenueCHF: 440 },
  { id: "4", title: "Yoga Reset", status: "ended", date: "5 Apr 2026 · 17:30", attendees: 31, revenueCHF: 620 },
  { id: "5", title: "Mobility Mondays", status: "ended", date: "2 Apr 2026 · 17:30", attendees: 18, revenueCHF: 360 },
];

export default function WaveBackgroundPage() {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      <DepthBackgroundWaves />

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

        {/* Header (old style, solid orange pill button) */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              Sessions
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mt-1">
              Wave background preview · sample data
            </p>
          </div>
          <button
            type="button"
            className="px-5 py-2.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)]"
          >
            New Session
          </button>
        </div>

        {/* List (old card style: solid bg, orange hover) */}
        <div className="space-y-3">
          {SAMPLE_SESSIONS.map((session) => {
            const s = STATUS_STYLES[session.status];
            return (
              <div
                key={session.id}
                className="block p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#FF6130]/25 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-white font-headline tracking-tight truncate group-hover:text-[#FF6130] transition-colors">
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
                    className="text-[#9CF0FF]/20 group-hover:text-[#FF6130] transition-colors shrink-0 mt-1"
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
