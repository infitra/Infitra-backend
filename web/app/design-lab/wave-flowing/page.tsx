"use client";

import Image from "next/image";
import Link from "next/link";

// Light-theme background — same diagonal wavy stripes as wave-bending,
// but with two motion sources stacked:
//   1. SMIL animation on Wave 1's <feGaussianBlur stdDeviation> — the
//      broad blurred backdrop visibly breathes between sharper (8px)
//      and softer (28px) blur over 9s
//   2. CSS opacity pulses on all three wave layers, each on its own
//      independent cycle so the cumulative "amount of colour" actually
//      fluctuates over time
//
// No spatial transform anywhere — wave shapes never move, corners are
// always anchored. No filter brightness/saturate — brand colours stay
// exactly #9CF0FF and #FF6130 at every moment.

const SAMPLE_SESSIONS = [
  { id: "1", title: "Tuesday Morning Flow", status: "published", date: "8 Apr 2026 · 09:00", attendees: 14, revenueCHF: 280 },
  { id: "2", title: "HIIT Power Hour", status: "scheduled", date: "9 Apr 2026 · 19:00", attendees: 8, revenueCHF: 160 },
  { id: "3", title: "Strength Foundations", status: "scheduled", date: "11 Apr 2026 · 17:30", attendees: 22, revenueCHF: 440 },
  { id: "4", title: "Yoga Reset", status: "ended", date: "5 Apr 2026 · 17:30", attendees: 31, revenueCHF: 620 },
  { id: "5", title: "Mobility Mondays", status: "ended", date: "2 Apr 2026 · 17:30", attendees: 18, revenueCHF: 360 },
];

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  published: { label: "Published", color: "text-emerald-700 bg-emerald-100/80 border-emerald-200" },
  scheduled: { label: "Scheduled", color: "text-sky-700 bg-sky-100/80 border-sky-200" },
  ended: { label: "Ended", color: "text-slate-500 bg-slate-100/70 border-slate-200" },
};

export default function WaveFlowingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#F2EFE8" }}>
      {/* ── Background: native diagonal wavy stripes with breath ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Wave 1 — back, biggest. SVG blur stdDeviation animates 8↔28
            so the broad backdrop visibly breathes. */}
        <div
          className="absolute inset-0"
          style={{
            animation: "wave-pulse-1 7s ease-in-out infinite",
            willChange: "opacity",
          }}
        >
          <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="wfl-flow-1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.92" />
                <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.62" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
                <stop offset="65%" stopColor="#FF6130" stopOpacity="0.62" />
                <stop offset="100%" stopColor="#FF6130" stopOpacity="0.92" />
              </linearGradient>
              <filter id="wfl-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="18">
                  <animate
                    attributeName="stdDeviation"
                    values="8;28;8"
                    dur="9s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0;0.5;1"
                    keySplines="0.5 0 0.5 1;0.5 0 0.5 1"
                  />
                </feGaussianBlur>
              </filter>
            </defs>
            <path
              d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z"
              fill="url(#wfl-flow-1)"
              filter="url(#wfl-blur)"
            />
          </svg>
        </div>

        {/* Wave 2 — middle layer, fastest opacity dim/peak. */}
        <div
          className="absolute inset-0"
          style={{
            animation: "wave-pulse-2 5s ease-in-out infinite",
            willChange: "opacity",
          }}
        >
          <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="wfl-flow-2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.92" />
                <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.62" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.40" />
                <stop offset="65%" stopColor="#FF6130" stopOpacity="0.62" />
                <stop offset="100%" stopColor="#FF6130" stopOpacity="0.92" />
              </linearGradient>
            </defs>
            <path
              d="M -300 1500 C 150 1180, 500 1330, 850 980 C 1200 620, 1550 800, 1950 -300 L 1950 -1000 C 1550 -50, 1200 -250, 850 100 C 500 460, 150 250, -300 720 Z"
              fill="url(#wfl-flow-2)"
            />
          </svg>
        </div>

        {/* Wave 3 — front, sharpest, narrower band of pure vivid brand. */}
        <div
          className="absolute inset-0"
          style={{
            animation: "wave-pulse-3 6s ease-in-out infinite -1.5s",
            willChange: "opacity",
          }}
        >
          <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="wfl-flow-3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FF6130" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z"
              fill="url(#wfl-flow-3)"
            />
          </svg>
        </div>
      </div>

      {/* ── Foreground content ──────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-10">
        {/* Lab breadcrumb */}
        <div className="pt-4">
          <Link
            href="/design-lab"
            className="font-headline text-[10px] uppercase tracking-[0.25em] hover:opacity-80 transition-opacity"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            ← Design Lab
          </Link>
        </div>

        {/* INFITRA brand header */}
        <header
          className="flex items-center justify-between py-5 mt-4 border-b"
          style={{ borderColor: "rgba(15, 34, 41, 0.10)" }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden">
              <Image src="/logo-mark.png" alt="INFITRA" width={36} height={36} className="block" />
            </div>
            <span className="text-lg font-black tracking-tighter font-headline italic" style={{ color: "#FF6130" }}>
              INFITRA
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7">
            {["Home", "Sessions", "Challenges", "Earnings"].map((item, i) => (
              <a
                key={item}
                href="#"
                className="font-headline text-xs font-bold uppercase tracking-widest"
                style={{ color: i === 1 ? "#0F2229" : "rgba(15, 34, 41, 0.55)" }}
              >
                {item}
              </a>
            ))}
          </nav>
        </header>

        <div className="flex items-center justify-between mt-12 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight" style={{ color: "#0F2229" }}>
              Sessions
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Diagonal waves — flowing breath preview · sample data
            </p>
          </div>
          <button
            type="button"
            className="px-7 py-3 rounded-md text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform text-white"
            style={{
              backgroundColor: "#FF6130",
              boxShadow: "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            New Session
          </button>
        </div>

        <div className="space-y-3 pb-32">
          {SAMPLE_SESSIONS.map((session) => {
            const s = STATUS_STYLES[session.status];
            return (
              <div
                key={session.id}
                className="block p-5 rounded-xl backdrop-blur-xl cursor-pointer group transition-all duration-200"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.78)",
                  border: "1px solid rgba(15, 34, 41, 0.10)",
                  boxShadow: "0 1px 2px rgba(15, 34, 41, 0.04), 0 4px 16px rgba(15, 34, 41, 0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black font-headline tracking-tight truncate" style={{ color: "#0F2229" }}>
                        {session.title}
                      </h3>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "#64748b" }}>
                      <span>{session.date}</span>
                      {session.attendees > 0 && <span>{session.attendees} attendees</span>}
                      {session.revenueCHF > 0 && <span>CHF {session.revenueCHF.toFixed(2)}</span>}
                    </div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0 mt-1" style={{ color: "#94a3b8" }}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
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
