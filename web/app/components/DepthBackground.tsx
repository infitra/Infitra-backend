"use client";

export function DepthBackground() {
  const particles = [
    { size: 1.5, left: 12, top: 25, delay: 0, dur: 18, cyan: true },
    { size: 2.5, left: 85, top: 15, delay: 3, dur: 22, cyan: true },
    { size: 1, left: 45, top: 55, delay: 7, dur: 15, cyan: true },
    { size: 2, left: 70, top: 40, delay: 1, dur: 20, cyan: true },
    { size: 1.5, left: 30, top: 70, delay: 10, dur: 17, cyan: false },
    { size: 3, left: 8, top: 60, delay: 5, dur: 25, cyan: true },
    { size: 1, left: 92, top: 35, delay: 12, dur: 16, cyan: true },
    { size: 2, left: 55, top: 20, delay: 2, dur: 19, cyan: true },
    { size: 1.5, left: 38, top: 80, delay: 8, dur: 21, cyan: false },
    { size: 2.5, left: 75, top: 65, delay: 4, dur: 23, cyan: true },
    { size: 1, left: 20, top: 45, delay: 14, dur: 14, cyan: true },
    { size: 2, left: 60, top: 10, delay: 6, dur: 20, cyan: true },
    { size: 1.5, left: 42, top: 35, delay: 9, dur: 18, cyan: false },
    { size: 3, left: 88, top: 50, delay: 11, dur: 24, cyan: true },
    { size: 1, left: 15, top: 85, delay: 3, dur: 16, cyan: false },
    { size: 2, left: 50, top: 75, delay: 13, dur: 22, cyan: true },
    { size: 1.5, left: 95, top: 22, delay: 0, dur: 19, cyan: true },
    { size: 2.5, left: 5, top: 40, delay: 7, dur: 21, cyan: true },
    { size: 1, left: 65, top: 90, delay: 15, dur: 15, cyan: false },
    { size: 2, left: 33, top: 12, delay: 4, dur: 20, cyan: true },
    { size: 1.5, left: 78, top: 78, delay: 2, dur: 17, cyan: false },
    { size: 3, left: 22, top: 58, delay: 10, dur: 26, cyan: true },
    { size: 1, left: 48, top: 42, delay: 8, dur: 14, cyan: true },
    { size: 2, left: 82, top: 30, delay: 6, dur: 22, cyan: true },
    { size: 1.5, left: 58, top: 68, delay: 1, dur: 18, cyan: false },
    { size: 2.5, left: 3, top: 15, delay: 12, dur: 23, cyan: true },
    { size: 1, left: 72, top: 52, delay: 5, dur: 16, cyan: true },
    { size: 2, left: 28, top: 88, delay: 9, dur: 19, cyan: false },
    { size: 1.5, left: 90, top: 8, delay: 14, dur: 20, cyan: true },
    { size: 3, left: 40, top: 48, delay: 3, dur: 25, cyan: true },
  ];

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Bottom waves — sit on the very bottom, drift left/right ── */}

      {/* Wave 1 — back, slow, blurred, cyan-heavy */}
      <div
        className="absolute bottom-0 left-0 w-[200vw] h-[120px] animate-[wave-lr_30s_ease-in-out_infinite]"
        style={{ filter: "blur(3px)" }}
      >
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="w1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path d="M0,60 Q360,20 720,50 Q1080,80 1440,40 Q1800,10 2160,55 Q2520,90 2880,50 L2880,120 L0,120 Z" fill="url(#w1)" />
        </svg>
      </div>

      {/* Wave 2 — mid, opposite direction, cyan-orange mix */}
      <div
        className="absolute bottom-0 left-0 w-[200vw] h-[90px] animate-[wave-rl_22s_ease-in-out_infinite]"
        style={{ filter: "blur(1px)" }}
      >
        <svg viewBox="0 0 2880 90" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="w2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#9CF0FF" stopOpacity="0.15" />
              <stop offset="60%" stopColor="#FF6130" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path d="M0,40 Q360,70 720,35 Q1080,10 1440,45 Q1800,75 2160,30 Q2520,5 2880,40 L2880,90 L0,90 Z" fill="url(#w2)" />
        </svg>
      </div>

      {/* Wave 3 — front, sharp, vivid, orange-heavy */}
      <div
        className="absolute bottom-0 left-0 w-[200vw] h-[60px] animate-[wave-lr_16s_ease-in-out_infinite]"
      >
        <svg viewBox="0 0 2880 60" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="w3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
              <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#FF6130" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FF6130" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path d="M0,30 Q360,50 720,25 Q1080,5 1440,35 Q1800,55 2160,20 Q2520,0 2880,30 L2880,60 L0,60 Z" fill="url(#w3)" />
        </svg>
      </div>

      {/* ── Star particles ───────────────────────────────── */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            backgroundColor: p.cyan ? "#9CF0FF" : "#FF6130",
            opacity: 0,
            animation: `particle-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
