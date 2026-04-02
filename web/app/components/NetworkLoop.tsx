"use client";

const steps = [
  {
    label: "Creators",
    title: "Build & Collaborate",
    micro: "Build solo or together",
    color: "#FF6130",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6130" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: "Experiences",
    title: "Get Richer",
    micro: "Multi-expert, more engaging",
    color: "#9CF0FF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CF0FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    label: "Participants",
    title: "Engage & Contribute",
    micro: "Join, engage, contribute",
    color: "#9CF0FF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CF0FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Communities",
    title: "Grow & Strengthen",
    micro: "Grow stronger over time",
    color: "#FF6130",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF6130" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
];

// Positions for 4 nodes on a circle (top, right, bottom, left)
const positions = [
  { cx: 50, cy: 8 },   // top
  { cx: 92, cy: 50 },  // right
  { cx: 50, cy: 92 },  // bottom
  { cx: 8, cy: 50 },   // left
];

export function NetworkLoop() {
  return (
    <div className="w-full">
      {/* Subline */}
      <p className="text-center text-sm md:text-base text-[#9CF0FF]/40 max-w-xl mx-auto leading-relaxed mb-8">
        Collaboration creates experiences. Participation builds communities.
        Communities drive growth.
      </p>

      {/* Loop visual */}
      <div className="relative w-full max-w-[520px] mx-auto aspect-square">

        {/* SVG arrows only */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          fill="none"
        >
          {/* Flow arrows between nodes */}
          {[
            // top → right
            { d: "M 62 14 Q 82 22 86 38", color: "#9CF0FF" },
            // right → bottom
            { d: "M 86 62 Q 82 78 62 86", color: "#FF6130" },
            // bottom → left
            { d: "M 38 86 Q 18 78 14 62", color: "#9CF0FF" },
            // left → top
            { d: "M 14 38 Q 18 22 38 14", color: "#FF6130" },
          ].map(({ d, color }, i) => (
            <g key={i}>
              <path
                d={d}
                stroke={color}
                strokeWidth="0.6"
                strokeOpacity="0.5"
                fill="none"
                markerEnd={`url(#arrow-${i})`}
              />
              <defs>
                <marker
                  id={`arrow-${i}`}
                  viewBox="0 0 6 6"
                  refX="5" refY="3"
                  markerWidth="4" markerHeight="4"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} opacity="0.6" />
                </marker>
              </defs>
            </g>
          ))}
        </svg>

        {/* Center pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#9CF0FF]/4 blur-[30px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-xs font-bold text-[#9CF0FF]/30 tracking-widest uppercase font-headline">Loop</span>
        </div>

        {/* 4 Node cards */}
        {steps.map((step, i) => {
          const pos = positions[i];

          return (
            <div
              key={step.label}
              className="absolute flex flex-col items-center group"
              style={{
                left: `${pos.cx}%`,
                top: `${pos.cy}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Glow behind node */}
              <div
                className="absolute w-16 h-16 rounded-full blur-[20px] opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ background: step.color }}
              />

              {/* Icon circle */}
              <div
                className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border transition-all duration-300 group-hover:scale-110"
                style={{
                  borderColor: `${step.color}40`,
                  background: `${step.color}10`,
                }}
              >
                {step.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col items-center mt-2">
                <span
                  className="text-xs md:text-sm font-black font-headline tracking-tight whitespace-nowrap"
                  style={{ color: step.color }}
                >
                  {step.label}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-white/80 font-headline whitespace-nowrap">
                  {step.title}
                </span>
                <span className="text-[9px] md:text-[10px] text-[#9CF0FF]/30 whitespace-nowrap mt-0.5">
                  {step.micro}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom line */}
      <p className="text-center text-sm md:text-base text-[#9CF0FF]/30 mt-10 max-w-lg mx-auto leading-relaxed italic">
        &ldquo;Every collaboration strengthens the experience. Every community amplifies the network.&rdquo;
      </p>
    </div>
  );
}
