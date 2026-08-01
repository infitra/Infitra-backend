"use client";

import { useState } from "react";

/**
 * ReviewsDisclosure — the dashboard card's review line (P6c polish).
 * Founder's call: the rating must be CLICKABLE and expand to the actual
 * reviews, with a yellow star. Collapsed it is one quiet line; open it lists
 * every review the loader passed (lineage-cumulative, newest first).
 */

const GOLD = "#EAB308";
const INK = "#0F2229";

export interface CardReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string | null;
}

export function ReviewsDisclosure({
  avg,
  count,
  thisWeek,
  reviews,
}: {
  avg: number;
  count: number;
  thisWeek: number;
  reviews: CardReview[];
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(15,34,41,0.10)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-[rgba(15,34,41,0.03)]"
        aria-expanded={open}
      >
        <span className="text-sm font-black font-headline" style={{ color: GOLD }}>★</span>
        <span className="text-sm font-black font-headline" style={{ color: INK }}>{avg.toFixed(1)}</span>
        <span className="text-[11px] font-bold font-headline" style={{ color: "#64748b" }}>
          {count} {count === 1 ? "review" : "reviews"}
        </span>
        {thisWeek > 0 && (
          <span className="text-[10px] font-black font-headline px-1.5 py-0.5 rounded-full" style={{ color: "#1D9E75", backgroundColor: "rgba(29,158,117,0.10)" }}>
            +{thisWeek} this week
          </span>
        )}
        <span
          className="ml-auto text-[10px] transition-transform"
          style={{ color: "#94a3b8", transform: open ? "rotate(90deg)" : "none" }}
        >
          ▸
        </span>
      </button>

      {open && (
        <div className="divide-y" style={{ borderTop: "1px solid rgba(15,34,41,0.07)", borderColor: "rgba(15,34,41,0.06)" }}>
          {reviews.length === 0 && (
            <p className="px-3.5 py-3 text-xs" style={{ color: "#94a3b8" }}>
              Reviews are loading on the experience page.
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black font-headline tracking-tight" style={{ color: GOLD }}>
                  {"★".repeat(Math.round(r.rating))}
                  <span style={{ color: "rgba(15,34,41,0.15)" }}>{"★".repeat(Math.max(0, 5 - Math.round(r.rating)))}</span>
                </span>
                <span className="text-[11px] font-bold font-headline" style={{ color: INK }}>
                  {r.reviewerName ?? "Member"}
                </span>
                <span className="ml-auto text-[10px]" style={{ color: "#94a3b8" }} suppressHydrationWarning>
                  {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {r.comment && (
                <p className="text-xs leading-relaxed mt-1" style={{ color: "#475569" }}>
                  {r.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
