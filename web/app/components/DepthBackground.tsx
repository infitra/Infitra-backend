"use client";

export function DepthBackground() {
  // Hand-crafted organic wave paths (Bezier curves, not sine functions)
  // Each set has slightly offset paths creating the wireframe mesh look
  const bgPaths = [
    "M0,350 C240,280 480,400 720,320 C960,240 1200,380 1440,300 C1680,220 1920,360 2160,290 C2400,220 2640,350 2880,300",
    "M0,380 C240,320 480,430 720,360 C960,290 1200,410 1440,340 C1680,270 1920,390 2160,330 C2400,260 2640,380 2880,340",
    "M0,410 C240,360 480,460 720,400 C960,340 1200,440 1440,380 C1680,320 1920,420 2160,370 C2400,310 2640,410 2880,370",
  ];

  const midPaths = [
    "M0,300 C200,220 440,360 720,270 C1000,180 1200,340 1440,260 C1680,180 1920,320 2160,250 C2400,180 2640,310 2880,260",
    "M0,330 C200,260 440,390 720,310 C1000,230 1200,370 1440,300 C1680,230 1920,350 2160,290 C2400,230 2640,340 2880,290",
    "M0,360 C200,300 440,420 720,350 C1000,280 1200,400 1440,340 C1680,280 1920,380 2160,330 C2400,280 2640,370 2880,320",
    "M0,390 C200,340 440,450 720,390 C1000,330 1200,430 1440,380 C1680,330 1920,410 2160,370 C2400,330 2640,400 2880,350",
  ];

  const fgPaths = [
    "M0,260 C180,180 420,320 720,230 C1020,140 1200,300 1440,220 C1680,140 1920,280 2160,210 C2400,140 2640,270 2880,220",
    "M0,285 C180,210 420,345 720,260 C1020,180 1200,330 1440,255 C1680,180 1920,310 2160,245 C2400,180 2640,300 2880,250",
    "M0,310 C180,240 420,370 720,290 C1020,220 1200,360 1440,290 C1680,220 1920,340 2160,280 C2400,220 2640,330 2880,280",
    "M0,335 C180,270 420,395 720,320 C1020,260 1200,390 1440,325 C1680,260 1920,370 2160,315 C2400,260 2640,360 2880,310",
    "M0,360 C180,300 420,420 720,350 C1020,300 1200,420 1440,360 C1680,300 1920,400 2160,350 C2400,300 2640,390 2880,340",
  ];

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Ambient color glow ───────────────────────────── */}
      <div
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full opacity-[0.07] animate-[drift_25s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #9CF0FF 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-100px] -left-[200px] w-[500px] h-[500px] rounded-full opacity-[0.05] animate-[drift_30s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, #FF6130 0%, transparent 70%)" }}
      />

      {/* ── Background wave layer ────────────────────────── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[55%] animate-[wave-drift_38s_ease-in-out_infinite]"
        style={{ filter: "blur(3px)" }}
        viewBox="0 0 2880 560"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="s-bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {bgPaths.map((d, i) => (
          <path key={i} d={d} stroke="url(#s-bg)" strokeWidth={1.2} opacity={0.3 + i * 0.08} />
        ))}
      </svg>

      {/* ── Middle wave layer ────────────────────────────── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[48%] animate-[wave-drift_26s_ease-in-out_infinite_reverse]"
        style={{ filter: "blur(1px)" }}
        viewBox="0 0 2880 560"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="s-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#9CF0FF" stopOpacity="0.15" />
            <stop offset="60%" stopColor="#FF6130" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {midPaths.map((d, i) => (
          <path key={i} d={d} stroke="url(#s-mid)" strokeWidth={0.9} opacity={0.35 + i * 0.07} />
        ))}
      </svg>

      {/* ── Foreground wave layer — sharpest, most vivid ── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[42%] animate-[wave-drift_19s_ease-in-out_infinite]"
        viewBox="0 0 2880 560"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="s-fg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
            <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.4" />
            <stop offset="65%" stopColor="#FF6130" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {fgPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#s-fg)"
            strokeWidth={i < 2 ? 1.4 : 0.7}
            opacity={0.45 + i * 0.06}
            filter={i < 2 ? "url(#glow)" : undefined}
          />
        ))}
      </svg>

      {/* ── Floating particles ───────────────────────────── */}
      {Array.from({ length: 12 }).map((_, i) => {
        const size = 1 + Math.random() * 2;
        const left = Math.random() * 100;
        const top = 40 + Math.random() * 50;
        const delay = Math.random() * 15;
        const duration = 12 + Math.random() * 15;
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
