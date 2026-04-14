"use client";

interface ShareDonutProps {
  shares: { label: string; percent: number; color: string }[];
  size?: number;
}

export function ShareDonut({ shares, size = 120 }: ShareDonutProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(15,34,41,0.06)"
          strokeWidth={14}
        />
        {/* Share segments */}
        {shares.map((share, i) => {
          const dashLength = (share.percent / 100) * circumference;
          const dashGap = circumference - dashLength;
          const offset = -accumulatedOffset * (circumference / 100) + circumference * 0.25;
          accumulatedOffset += share.percent;

          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={share.color}
              strokeWidth={14}
              strokeDasharray={`${dashLength} ${dashGap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.3s ease, stroke-dashoffset 0.3s ease" }}
            />
          );
        })}
        {/* Center text */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="text-xs font-black font-headline"
          fill="#0F2229"
        >
          {shares.length}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          className="text-[8px] font-bold font-headline"
          fill="#94a3b8"
        >
          creators
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1.5">
        {shares.map((share, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: share.color }} />
            <span className="text-xs font-bold font-headline text-[#0F2229]">{share.percent}%</span>
            <span className="text-xs text-[#94a3b8]">{share.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
