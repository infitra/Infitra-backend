"use client";

import { useState } from "react";

/**
 * ShareButton — copies the experience's PUBLIC buyer-page link to the
 * clipboard (it does not navigate — a creator sharing the card wants the link,
 * not to open their own owner-view of the page). Lives in the card's top-right
 * corner with the familiar share glyph; flips to a check + "Link copied" on
 * success. Same copy mechanism as PublishedShareBar.
 */

const SHARE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M8 7l4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export function ShareButton({ challengeId }: { challengeId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/experiences/${challengeId}`
        : `/experiences/${challengeId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard denied — no-op */
    }
  }

  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      {copied && (
        <span
          className="text-[11px] font-bold font-headline px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(8,145,178,0.12)", color: "#0891b2" }}
        >
          Link copied
        </span>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy share link"
        title="Copy public link"
        className="w-9 h-9 rounded-full inline-flex items-center justify-center transition-transform hover:scale-[1.06] active:scale-95"
        style={{
          backgroundColor: "rgba(255,255,255,0.94)",
          color: copied ? "#0891b2" : "#0F2229",
          boxShadow: "0 0 0 1px rgba(15,34,41,0.10), 0 2px 8px rgba(15,34,41,0.14)",
        }}
      >
        {copied ? CHECK_ICON : SHARE_ICON}
      </button>
    </div>
  );
}
