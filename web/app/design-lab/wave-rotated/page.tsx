"use client";

import Image from "next/image";
import Link from "next/link";

// Light-theme background where the existing horizontal wave system is
// wrapped in a rotated container so the whole thing tilts diagonally.
// Same wave-lr / wave-rl drift animations as the dark version, just
// flowing along a rotated axis. Saved as an option for comparison.

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

const PARTICLES = [
  { size: 2, left: 8,  top: 88, delay: 0,  dur: 18, warm: false },
  { size: 3, left: 18, top: 72, delay: 3,  dur: 22, warm: false },
  { size: 2, left: 12, top: 60, delay: 7,  dur: 15, warm: false },
  { size: 2.5, left: 24, top: 50, delay: 1,  dur: 20, warm: false },
  { size: 2, left: 32, top: 38, delay: 10, dur: 17, warm: false },
  { size: 3, left: 5,  top: 78, delay: 5,  dur: 25, warm: false },
  { size: 2, left: 22, top: 88, delay: 12, dur: 16, warm: false },
  { size: 2.5, left: 38, top: 30, delay: 2,  dur: 19, warm: false },
  { size: 2, left: 46, top: 22, delay: 8,  dur: 21, warm: true  },
  { size: 3, left: 54, top: 16, delay: 4,  dur: 23, warm: true  },
  { size: 2, left: 62, top: 12, delay: 14, dur: 14, warm: true  },
  { size: 2.5, left: 70, top: 8,  delay: 6,  dur: 20, warm: true  },
  { size: 2, left: 78, top: 6,  delay: 9,  dur: 18, warm: true  },
  { size: 3, left: 86, top: 14, delay: 11, dur: 24, warm: true  },
  { size: 2, left: 92, top: 22, delay: 3,  dur: 16, warm: true  },
  { size: 2.5, left: 88, top: 32, delay: 13, dur: 22, warm: true  },
  { size: 2, left: 4,  top: 92, delay: 0,  dur: 19, warm: false },
  { size: 3, left: 14, top: 95, delay: 7,  dur: 21, warm: false },
  { size: 2, left: 96, top: 4,  delay: 15, dur: 15, warm: true  },
  { size: 2.5, left: 80, top: 40, delay: 4,  dur: 20, warm: true  },
];

export default function WaveRotatedPage() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#F2EFE8" }}>
      {/* ── Background: rotated wave system ───────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            transform: "rotate(16deg) scale(1.9)",
            transformOrigin: "center center",
          }}
        >
          {/* Wave 1 — back, biggest, blurred */}
          <div
            className="absolute bottom-0 left-[-50%] w-[200%] h-[100%] animate-[wave-lr_36s_ease-in-out_infinite]"
            style={{ filter: "blur(3px)" }}
          >
            <svg viewBox="0 0 2880 1000" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="wlr-w1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.78" />
                  <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#FF6130" stopOpacity="0.78" />
                </linearGradient>
              </defs>
              <path d="M0,180 Q360,40 720,160 Q1080,290 1440,80 Q1800,-50 2160,140 Q2520,330 2880,120 L2880,1000 L0,1000 Z" fill="url(#wlr-w1)" />
            </svg>
          </div>

          {/* Wave 2 — middle layer, drifts opposite direction */}
          <div className="absolute bottom-0 left-[-50%] w-[200%] h-[78%] animate-[wave-rl_24s_ease-in-out_infinite]">
            <svg viewBox="0 0 2880 780" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="wlr-w2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.92" />
                  <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.50" />
                  <stop offset="100%" stopColor="#FF6130" stopOpacity="0.92" />
                </linearGradient>
              </defs>
              <path d="M0,260 Q360,400 720,210 Q1080,40 1440,270 Q1800,460 2160,150 Q2520,0 2880,230 L2880,780 L0,780 Z" fill="url(#wlr-w2)" />
            </svg>
          </div>

          {/* Wave 3 — front, sharpest, vivid pure brand */}
          <div className="absolute bottom-0 left-[-50%] w-[200%] h-[52%] animate-[wave-lr_18s_ease-in-out_infinite]">
            <svg viewBox="0 0 2880 520" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="wlr-w3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
                  <stop offset="55%" stopColor="#9CF0FF" stopOpacity="0.65" />
                  <stop offset="100%" stopColor="#FF6130" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d="M0,210 Q360,310 720,160 Q1080,30 1440,210 Q1800,340 2160,120 Q2520,0 2880,180 L2880,520 L0,520 Z" fill="url(#wlr-w3)" />
            </svg>
          </div>
        </div>

        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              backgroundColor: p.warm ? "#FF6130" : "#0891b2",
              opacity: 0,
              animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
              boxShadow: p.warm
                ? "0 0 5px rgba(255,97,48,0.6)"
                : "0 0 5px rgba(8,145,178,0.6)",
            }}
          />
        ))}
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
              Rotated wave preview · sample data
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
