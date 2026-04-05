"use client";

function generateWavePath(
  width: number,
  baseY: number,
  amplitude: number,
  frequency: number,
  phase: number
): string {
  const points: string[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y =
      baseY +
      Math.sin((i / steps) * Math.PI * frequency + phase) * amplitude +
      Math.sin((i / steps) * Math.PI * frequency * 0.5 + phase * 1.3) *
        (amplitude * 0.4);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

export function DepthBackground() {
  const width = 2880;

  // Generate multiple wave lines per layer for the wireframe mesh effect
  const bgLines = Array.from({ length: 5 }, (_, i) =>
    generateWavePath(width, 300, 60 + i * 8, 4 + i * 0.3, i * 0.7)
  );
  const midLines = Array.from({ length: 6 }, (_, i) =>
    generateWavePath(width, 280, 50 + i * 10, 3.5 + i * 0.4, i * 0.9 + 1)
  );
  const fgLines = Array.from({ length: 7 }, (_, i) =>
    generateWavePath(width, 260, 40 + i * 12, 3 + i * 0.5, i * 0.6 + 2)
  );

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Ambient color blobs ──────────────────────────── */}
      <div
        className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full opacity-[0.07] animate-[drift_25s_ease-in-out_infinite]"
        style={{
          background: "radial-gradient(circle, #9CF0FF 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-100px] -left-[200px] w-[500px] h-[500px] rounded-full opacity-[0.05] animate-[drift_30s_ease-in-out_infinite_reverse]"
        style={{
          background: "radial-gradient(circle, #FF6130 0%, transparent 70%)",
        }}
      />

      {/* ── Background wave layer — deep, blurred, slow ─── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[60%] animate-[wave-drift_40s_ease-in-out_infinite]"
        style={{ filter: "blur(3px)" }}
        viewBox={`0 0 ${width} 560`}
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="stroke-bg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#9CF0FF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {bgLines.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#stroke-bg)"
            strokeWidth={1.2}
            opacity={0.3 + i * 0.05}
          />
        ))}
      </svg>

      {/* ── Middle wave layer — moderate ────────────────── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[50%] animate-[wave-drift_28s_ease-in-out_infinite_reverse]"
        style={{ filter: "blur(1px)" }}
        viewBox={`0 0 ${width} 560`}
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="stroke-mid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#9CF0FF" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#FF6130" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {midLines.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#stroke-mid)"
            strokeWidth={0.8}
            opacity={0.4 + i * 0.06}
          />
        ))}
      </svg>

      {/* ── Foreground wave layer — sharp, vivid ───────── */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[40%] animate-[wave-drift_20s_ease-in-out_infinite]"
        viewBox={`0 0 ${width} 560`}
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="stroke-fg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="1" />
            <stop offset="35%" stopColor="#9CF0FF" stopOpacity="0.5" />
            <stop offset="65%" stopColor="#FF6130" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="1" />
          </linearGradient>
          {/* Glow filter for the brightest lines */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {fgLines.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="url(#stroke-fg)"
            strokeWidth={i < 2 ? 1.5 : 0.7}
            opacity={0.5 + i * 0.05}
            filter={i < 2 ? "url(#glow)" : undefined}
          />
        ))}
      </svg>

      {/* ── Floating particles ───────────────────────────── */}
      {Array.from({ length: 15 }).map((_, i) => {
        const size = 1 + Math.random() * 2.5;
        const left = Math.random() * 100;
        const top = 30 + Math.random() * 60;
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
