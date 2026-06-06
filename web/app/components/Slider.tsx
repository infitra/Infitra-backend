"use client";

import type { CSSProperties } from "react";

/**
 * Reusable 0–10 touch slider — big thumb, filled track, value chip. Used by the
 * Pre-Session Pulse + Post-Session Reflection action cards.
 */
export function Slider({
  value,
  onChange,
  accent = "#0891b2",
  labelLow = "Low",
  labelHigh = "High",
}: {
  value: number;
  onChange: (v: number) => void;
  accent?: string;
  labelLow?: string;
  labelHigh?: string;
}) {
  const pct = (value / 10) * 100;
  return (
    <div className="infitra-slider">
      <style>{`
        .infitra-slider input[type=range] {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 8px; border-radius: 9999px; outline: none;
        }
        .infitra-slider input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 26px; height: 26px; border-radius: 9999px;
          background: var(--sl-accent); cursor: pointer;
          border: 3px solid #fff; box-shadow: 0 2px 8px rgba(15,34,41,0.28);
        }
        .infitra-slider input[type=range]::-moz-range-thumb {
          width: 26px; height: 26px; border-radius: 9999px;
          background: var(--sl-accent); cursor: pointer;
          border: 3px solid #fff; box-shadow: 0 2px 8px rgba(15,34,41,0.28);
        }
      `}</style>

      <div className="flex items-end justify-center mb-3">
        <span className="text-4xl font-black font-headline leading-none" style={{ color: accent }}>{value}</span>
        <span className="text-sm font-bold font-headline mb-0.5 ml-1" style={{ color: "#94a3b8" }}>/10</span>
      </div>

      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rating from 0 to 10"
        style={{
          ["--sl-accent"]: accent,
          background: `linear-gradient(to right, ${accent} ${pct}%, rgba(15,34,41,0.10) ${pct}%)`,
        } as CSSProperties}
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] uppercase tracking-wider font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>{labelLow}</span>
        <span className="text-[11px] uppercase tracking-wider font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>{labelHigh}</span>
      </div>
    </div>
  );
}
