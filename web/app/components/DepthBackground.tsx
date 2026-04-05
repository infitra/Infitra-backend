"use client";

export function DepthBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* ── Color blobs — ambient light sources ──────────── */}
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full opacity-[0.07] animate-[drift_25s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #9CF0FF 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-100px] -left-[200px] w-[500px] h-[500px] rounded-full opacity-[0.05] animate-[drift_30s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, #FF6130 0%, transparent 70%)" }} />

      {/* ── SVG Wave Layers ──────────────────────────────── */}
      {/* Background wave — slowest, blurred for depth */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[45%] opacity-[0.25] animate-[wave-drift_35s_ease-in-out_infinite]"
        style={{ filter: "blur(4px)" }}
        viewBox="0 0 2880 560"
        preserveAspectRatio="none"
      >
        <path
          d="M0,320 Q360,200 720,280 Q1080,360 1440,240 Q1800,120 2160,280 Q2520,440 2880,320 L2880,560 L0,560 Z"
          fill="url(#wave-bg)"
          stroke="url(#wave-bg-stroke)"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="wave-bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#4AB8CC" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wave-bg-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Middle wave — moderate speed */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[35%] opacity-[0.35] animate-[wave-drift_25s_ease-in-out_infinite_reverse]"
        style={{ filter: "blur(1px)" }}
        viewBox="0 0 2880 400"
        preserveAspectRatio="none"
      >
        <path
          d="M0,200 Q360,120 720,220 Q1080,320 1440,180 Q1800,40 2160,200 Q2520,360 2880,200 L2880,400 L0,400 Z"
          fill="url(#wave-mid)"
          stroke="url(#wave-mid-stroke)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="wave-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#0F2229" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wave-mid-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
            <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Foreground wave — fastest, sharpest, most vivid */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[25%] opacity-[0.5] animate-[wave-drift_18s_ease-in-out_infinite]"
        viewBox="0 0 2880 280"
        preserveAspectRatio="none"
      >
        <path
          d="M0,140 Q360,60 720,160 Q1080,260 1440,120 Q1800,0 2160,140 Q2520,280 2880,140 L2880,280 L0,280 Z"
          fill="url(#wave-fg)"
          stroke="url(#wave-fg-stroke)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="wave-fg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.7" />
            <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.3" />
            <stop offset="65%" stopColor="#FF6130" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="wave-fg-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
            <stop offset="40%" stopColor="#9CF0FF" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#FF6130" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Floating particles ───────────────────────────── */}
      {Array.from({ length: 20 }).map((_, i) => {
        const size = 1 + Math.random() * 3;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = 10 + Math.random() * 15;
        const isCyan = Math.random() > 0.3;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              backgroundColor: isCyan ? "#9CF0FF" : "#FF6130",
              opacity: 0,
              animation: `particle-float ${duration}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
