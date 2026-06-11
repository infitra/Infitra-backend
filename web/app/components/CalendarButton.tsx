"use client";

import { useEffect, useState } from "react";

const CYAN = "#0891b2";
const INK_BORDER = "rgba(15,34,41,0.10)";
const MUTED = "#64748b";

function fmtWhen(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const CAL_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

/**
 * Calendar export link.
 *
 * The href is an `.ics` route handler; the browser downloads it and the OS
 * hands off to the calendar app's import sheet (which never reports back). A
 * transient on-click "success ✓" flashed and vanished — invisible on mobile
 * (the calendar app takes over instantly) and pointless on desktop (you still
 * have to open the file). Instead we persist a "Last exported <time>" line via
 * localStorage: a durable, honest signal of when this calendar was last pulled.
 *
 *   variant="pill"   — filled cyan CTA with the timestamp underneath.
 *   variant="subtle" — quiet outline action; timestamp shown as a tooltip.
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
  const key = `infitra:lastCalExport:${href}`;
  const [lastExported, setLastExported] = useState<number | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v) setLastExported(Number(v));
    } catch {
      /* localStorage unavailable — no-op */
    }
  }, [key]);

  const onClick = () => {
    const ts = Date.now();
    try {
      window.localStorage.setItem(key, String(ts));
    } catch {
      /* ignore */
    }
    setLastExported(ts);
  };

  if (variant === "subtle") {
    return (
      <a
        href={href}
        download
        onClick={onClick}
        title={lastExported ? `Last exported ${fmtWhen(lastExported)}` : "Download your sessions as a calendar file"}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-headline transition-colors hover:bg-[#0F2229]/[0.05]"
        style={{
          color: "#475569",
          border: `1px solid ${INK_BORDER}`,
          backgroundColor: "rgba(255,255,255,0.55)",
          fontWeight: 700,
        }}
      >
        {CAL_ICON}
        {label}
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
        {CAL_ICON}
        {label}
      </a>
      <p className="text-[11px] mt-1.5 text-center" style={{ color: MUTED }}>
        {lastExported
          ? `Last exported ${fmtWhen(lastExported)}`
          : "Opens in your calendar app to add your sessions"}
      </p>
    </div>
  );
}
