"use client";

import Link from "next/link";

/**
 * StatCards — the designed stat family for both console rails (founder's
 * call: the hairline spreadsheet grid had zero energy; every number needs
 * its own weight). Each card carries its own accent: a tinted wash, an icon
 * tile, a big headline number. Clickable cards lift and carry an arrow —
 * they are doors, not cells.
 */

const INK = "#0F2229";

export interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
  /** Optional second line under the label (e.g. "4 reviews"). */
  sub?: string;
  href?: string;
  onClick?: () => void;
}

export function StatCard({ icon, value, label, accent, sub, href, onClick }: StatCardProps) {
  const interactive = !!href || !!onClick;
  const body = (
    <div
      className={`rounded-xl p-3 h-full ${interactive ? "transition-transform hover:-translate-y-0.5 cursor-pointer" : ""}`}
      style={{
        background: `linear-gradient(135deg, ${accent}14, rgba(255,255,255,0.9) 70%)`,
        border: `1px solid ${accent}2E`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}1C`, color: accent }}
        >
          {icon}
        </span>
        {interactive && (
          <span className="text-[12px] font-black" style={{ color: accent }}>→</span>
        )}
      </div>
      <p
        className="text-[20px] font-black font-headline leading-none whitespace-nowrap"
        style={{ color: INK, letterSpacing: "-0.02em" }}
      >
        {value}
      </p>
      <p className="text-[10px] font-bold font-headline mt-1 leading-tight" style={{ color: "#64748b" }}>
        {label}
      </p>
      {sub && (
        <p className="text-[9.5px] leading-tight mt-0.5" style={{ color: "#94a3b8" }}>
          {sub}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left h-full">
        {body}
      </button>
    );
  }
  return body;
}

export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

// ─── Icons (1.6px brand strokes, consistent with CredentialIcon) ──

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const STAT_ICONS = {
  people: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 5.8M18.5 14.9c1.9.8 3 2.4 3 4.6" />
    </svg>
  ),
  star: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
    </svg>
  ),
  bolt: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  ),
  coins: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9.2a3.6 3.6 0 0 0-3-1.4c-2 0-3.6 1.9-3.6 4.2s1.6 4.2 3.6 4.2a3.6 3.6 0 0 0 3-1.4M7 10.7h4M7 13.3h4" />
    </svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16.5 9" />
    </svg>
  ),
  flame: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <path d="M12 3c1 3-0.5 4.5-1.8 6C8.7 10.7 8 12.2 8 14a4 4 0 0 0 8 0c0-1.2-.4-2.3-1-3.2-.4 1-1 1.7-2 2.2.6-2.7-.2-5.5-1-7Z" />
    </svg>
  ),
  live: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...strokeProps}>
      <rect x="2.5" y="6" width="14" height="12" rx="2.5" />
      <path d="M16.5 10.5l5-3v9l-5-3" />
    </svg>
  ),
} as const;
