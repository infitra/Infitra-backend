"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Primary action on an active-program card. Two flavors:
 *
 *   - kind="navigate": plain text. The card's overlay link handles the
 *     click — this is the visual hint of where the card goes.
 *
 *   - kind="share": real button. Clicking copies the public-page URL,
 *     swaps the label to "Link copied" for 2s, then snaps back. Stops
 *     propagation so the overlay link doesn't fire too. Falls back to
 *     navigation if clipboard isn't available (insecure context,
 *     older browsers, headless preview).
 */

interface Props {
  label: string;
  kind: "navigate" | "share";
  /** For navigate: the destination. For share: the URL to copy. */
  href: string;
}

export function PrimaryActionPill({ label, kind, href }: Props) {
  const [copied, setCopied] = useState(false);

  if (kind === "navigate") {
    return (
      <span
        className="text-sm md:text-base font-headline"
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
          window.location.href = href;
        }
      }}
      className="text-sm md:text-base font-headline transition-colors"
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
