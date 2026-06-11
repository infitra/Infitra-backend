"use client";

import { useState } from "react";

const CYAN = "#0891b2";
const INK_BORDER = "rgba(15,34,41,0.10)";
const MUTED = "#64748b";

/**
 * Calendar export link with a success acknowledgment.
 *
 * The href points at an `.ics` route handler; the browser downloads it and the
 * OS hands off to the calendar app's import sheet. That sheet is OS-controlled
 * and never reports back to us, so the action otherwise feels like nothing
 * happened ("did it work?"). We confirm on click and tell the user the import
 * sheet IS the expected next step.
 *
 *   variant="pill"   — filled cyan CTA (Experience Space, success page).
 *   variant="subtle" — quiet outline action (dashboard header, beside Edit).
 */
export function CalendarButton({
  href,
  label,
  block = false,
  variant = "pill",
}: {
  href: string;
  label: string;
  block?: boolean;
  variant?: "pill" | "subtle";
}) {
  const [done, setDone] = useState(false);

  const onClick = () => {
    setDone(true);
    window.setTimeout(() => setDone(false), 6000);
  };

  const CalIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
  const CheckIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  if (variant === "subtle") {
    return (
      <a
        href={href}
        download
        onClick={onClick}
        title="Download your sessions as a calendar file"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-headline transition-colors hover:bg-[#0F2229]/[0.05]"
        style={{
          color: done ? CYAN : "#475569",
          border: `1px solid ${done ? `${CYAN}55` : INK_BORDER}`,
          backgroundColor: "rgba(255,255,255,0.55)",
          fontWeight: 700,
        }}
      >
        {done ? CheckIcon : CalIcon}
        {done ? "Exported ✓" : label}
      </a>
    );
  }

  return (
    <div className={block ? "w-full" : "inline-block"}>
      <a
        href={href}
        download
        onClick={onClick}
        className={`${
          block ? "flex w-full" : "inline-flex"
        } items-center justify-center gap-1.5 rounded-xl py-3 px-4 text-[13px] font-black font-headline transition-transform hover:scale-[1.01]`}
        style={{
          backgroundColor: `${CYAN}14`,
          color: CYAN,
          boxShadow: `inset 0 0 0 1.5px ${CYAN}40`,
        }}
      >
        {done ? CheckIcon : CalIcon}
        {done ? "Exported to your calendar" : label}
      </a>
      {done && (
        <p className="text-[11px] mt-1.5 text-center" style={{ color: MUTED }}>
          Opens in your calendar app — tap Add to confirm.
        </p>
      )}
    </div>
  );
}
