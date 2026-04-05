"use client";

export function DepthBackground() {
  // Deterministic particles (no Math.random on render — avoids hydration mismatch)
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
      {/* ── Bottom glow — the radiant horizon ────────────── */}
      {/* Cyan glow — left side of bottom */}
      <div
        className="absolute bottom-[-80px] left-[10%] w-[500px] h-[200px] rounded-full animate-[glow-pulse_8s_ease-in-out_infinite]"
        style={{
          background: "radial-gradient(ellipse, #9CF0FF 0%, transparent 70%)",
          opacity: 0.15,
        }}
      />
      {/* Orange glow — right side of bottom */}
      <div
        className="absolute bottom-[-80px] right-[10%] w-[500px] h-[200px] rounded-full animate-[glow-pulse_10s_ease-in-out_infinite_2s]"
        style={{
          background: "radial-gradient(ellipse, #FF6130 0%, transparent 70%)",
          opacity: 0.1,
        }}
      />
      {/* Bright cyan core — concentrated glow point */}
      <div
        className="absolute bottom-[-20px] left-[25%] w-[150px] h-[60px] rounded-full animate-[glow-pulse_6s_ease-in-out_infinite_1s]"
        style={{
          background: "radial-gradient(ellipse, #9CF0FF 0%, transparent 60%)",
          opacity: 0.25,
        }}
      />
      {/* Bright orange core */}
      <div
        className="absolute bottom-[-20px] right-[25%] w-[120px] h-[50px] rounded-full animate-[glow-pulse_7s_ease-in-out_infinite_3s]"
        style={{
          background: "radial-gradient(ellipse, #FF6130 0%, transparent 60%)",
          opacity: 0.18,
        }}
      />

      {/* ── Floating star particles ──────────────────────── */}
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
