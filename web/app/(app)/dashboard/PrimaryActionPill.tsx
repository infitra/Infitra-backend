"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Primary action on an active-program card. Two flavors:
 *
 *   - kind="navigate": renders as a Link. The card's overlay will
 *     route to the same href, so this is mostly a visual cue — but
 *     keeping it as a real Link means right-click / cmd-click work.
 *
 *   - kind="copy-link": renders as a button. Clicking copies the
 *     public-page URL to clipboard, swaps the label to "Link copied"
 *     for 2s, then snaps back. Stops propagation so it doesn't
 *     trigger the card's overlay link.
 *
 * The card always renders this label inline at the bottom-left of
 * the content. It sits above the overlay link (which uses absolute
 * positioning and no z-index), so the button gets its own clicks.
 */

interface Props {
  label: string;
  kind: "navigate" | "copy-link";
  /** For navigate: the destination. For copy-link: the URL to copy. */
  href: string;
}

export function PrimaryActionPill({ label, kind, href }: Props) {
  const [copied, setCopied] = useState(false);

  if (kind === "navigate") {
    // Plain text — the overlay Link handles the click. Rendering it as
    // a span avoids nesting <a> inside <a>.
    return (
      <span
        className="text-sm font-headline"
        style={{ color: "#FF6130", fontWeight: 700 }}
      >
        {label} →
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const fullUrl = new URL(href, window.location.origin).toString();
          await navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard can fail in non-secure contexts or older browsers.
          // Fall back to navigation so the user can copy from the address bar.
          window.location.href = href;
        }
      }}
      className="text-sm font-headline transition-colors"
      style={{
        color: copied ? "#0891b2" : "#FF6130",
        fontWeight: 700,
        position: "relative",
        zIndex: 20,
      }}
    >
      {copied ? "Link copied ✓" : `${label} →`}
    </button>
  );
}
