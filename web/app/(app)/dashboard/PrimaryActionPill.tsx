"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Action button on an active-program card. Real contained pill,
 * styled like the landing page's "Apply" / nav's "+ Create" — orange
 * filled for the suggested action, white-outlined for the secondary
 * home destination.
 *
 * Two kinds:
 *   - kind="navigate": Link. Routes to href on click.
 *   - kind="share":    Button. Copies href to clipboard, swaps label
 *     to "Link copied ✓" for 2s. Falls back to navigation if
 *     clipboard isn't available.
 *
 * Two variants:
 *   - "filled":   orange background, white text. The suggested
 *     decision the cascade picked.
 *   - "outlined": transparent, dark text + border. The home
 *     destination, always present alongside a "filled" action.
 */

interface Props {
  label: string;
  kind: "navigate" | "share";
  href: string;
  variant?: "filled" | "outlined";
}

export function PrimaryActionPill({ label, kind, href, variant = "filled" }: Props) {
  const [copied, setCopied] = useState(false);

  const filledStyle = {
    backgroundColor: copied ? "#0891b2" : "#FF6130",
    color: "#FFFFFF",
    fontWeight: 700,
  };
  const outlinedStyle = {
    color: "#0F2229",
    backgroundColor: "rgba(255,255,255,0.70)",
    border: "1px solid rgba(15,34,41,0.15)",
    fontWeight: 700,
  };
  const style = variant === "filled" ? filledStyle : outlinedStyle;
  // Sentence case, regular tracking — matches the landing's "Apply"
  // button voice. Uppercase tracked-widest belongs on tertiary chrome
  // (status chip, role labels), not on the primary CTA.
  const baseClass =
    "inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-headline transition-transform hover:scale-[1.02] whitespace-nowrap";

  if (kind === "navigate") {
    return (
      <Link href={href} className={baseClass} style={style}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        try {
          const fullUrl = new URL(href, window.location.origin).toString();
          await navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.location.href = href;
        }
      }}
      className={baseClass}
      style={style}
    >
      {copied ? "Link copied ✓" : label}
    </button>
  );
}
