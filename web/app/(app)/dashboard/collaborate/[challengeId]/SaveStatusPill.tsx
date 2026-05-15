"use client";

import { useEffect, useState } from "react";
import type { SaveStatus } from "./useSaveStatus";

/**
 * The compact save-state indicator at the top of the workspace.
 * Replaces the per-section "Save Changes" button — auto-save fires on
 * field blur, this pill shows the result.
 *
 * idle → renders nothing (visual quietude)
 * saving → orange dot + "Saving…"
 * saved → cyan check + "Saved · 3s ago"
 * error → red dot + message + Retry button
 */

interface Props {
  status: SaveStatus;
  onRetry?: () => void;
}

function formatSecsAgo(at: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

export function SaveStatusPill({ status, onRetry }: Props) {
  // Force a re-render every second when status is "saved" so the
  // "3s ago" counter ticks visibly. Cheap and bounded — only ticks
  // for ~3s before the hook auto-fades the status to idle.
  const [, force] = useState(0);
  useEffect(() => {
    if (status.kind !== "saved") return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [status.kind]);

  if (status.kind === "idle") return null;

  if (status.kind === "saving") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-headline"
        style={{
          backgroundColor: "rgba(255,97,48,0.10)",
          color: "#FF6130",
          border: "1px solid rgba(255,97,48,0.20)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "#FF6130" }}
        />
        Saving…
      </span>
    );
  }

  if (status.kind === "saved") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-headline"
        style={{
          backgroundColor: "rgba(8,145,178,0.10)",
          color: "#0891b2",
          border: "1px solid rgba(8,145,178,0.20)",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="#0891b2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Saved · {formatSecsAgo(status.at)}
      </span>
    );
  }

  // error
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold font-headline"
      style={{
        backgroundColor: "rgba(220,38,38,0.08)",
        color: "#dc2626",
        border: "1px solid rgba(220,38,38,0.25)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "#dc2626" }}
      />
      <span className="max-w-[280px] truncate" title={status.message}>
        Couldn&apos;t save · {status.message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="underline hover:no-underline"
          style={{ color: "#dc2626" }}
        >
          Retry
        </button>
      )}
    </span>
  );
}
