"use client";

/**
 * ExpandableDescription — Bundle 4.2.31.
 *
 * The creator's description can be very long (real Alex+Mira draft
 * wrapped to ~11 lines on mobile). That makes the product card swell
 * vertically and pushes the rest of the offer below the fold.
 *
 * Solution: collapse to 3 lines by default with a "Read more" affordance.
 * If the description is short (< 220 chars), render as-is — no collapse
 * needed.
 *
 * Tiny client island so the rest of PublicChallengeHero stays a server
 * component.
 */

import { useState } from "react";

const COLLAPSE_THRESHOLD = 220;

export function ExpandableDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = description.length > COLLAPSE_THRESHOLD;

  if (!needsCollapse) {
    return (
      <p
        className="mt-3 mx-auto leading-relaxed font-medium"
        style={{
          color: "#1e293b",
          fontSize: "1.0625rem",
          maxWidth: "32rem",
        }}
      >
        {description}
      </p>
    );
  }

  return (
    <div className="mx-auto" style={{ maxWidth: "32rem" }}>
      <p
        className={`mt-3 leading-relaxed font-medium whitespace-pre-line ${expanded ? "" : "line-clamp-3"}`}
        style={{
          color: "#1e293b",
          fontSize: "1.0625rem",
        }}
      >
        {description}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="mt-2 text-sm font-bold font-headline transition-opacity hover:opacity-70 active:opacity-50"
        style={{ color: "#FF6130", letterSpacing: "-0.005em" }}
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}
