"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * ReviewsDisclosure — the dashboard card's review line (P6c).
 *
 * The trigger stays ONE compact line (gold star, average, count, fresh-this-
 * week badge). Opening lifts the list into a MODAL rather than expanding
 * inline: inline growth stretched the card without limit, and at 10+ reviews
 * it would have dominated the dashboard on desktop and made the card endless
 * on mobile (founder's call). The modal scrolls internally, so the card's
 * height is constant no matter how successful the experience gets.
 *
 * Portalled to document.body so no transformed/overflow-hidden ancestor can
 * trap it, with Escape + backdrop close and a body scroll-lock while open.
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

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-[11px] font-black font-headline tracking-tight" style={{ color: GOLD }}>
      {"★".repeat(filled)}
      <span style={{ color: "rgba(15,34,41,0.15)" }}>{"★".repeat(Math.max(0, 5 - filled))}</span>
    </span>
  );
}

export function ReviewsDisclosure({
  avg,
  count,
  thisWeek,
  reviews,
  experienceTitle,
}: {
  avg: number;
  count: number;
  thisWeek: number;
  reviews: CardReview[];
  experienceTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (count === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left transition-colors hover:bg-[rgba(15,34,41,0.03)]"
        style={{ border: "1px solid rgba(15,34,41,0.10)" }}
        aria-haspopup="dialog"
      >
        <span className="text-sm font-black font-headline" style={{ color: GOLD }}>★</span>
        <span className="text-sm font-black font-headline" style={{ color: INK }}>{avg.toFixed(1)}</span>
        <span className="text-[11px] font-bold font-headline" style={{ color: "#64748b" }}>
          {count} {count === 1 ? "review" : "reviews"}
        </span>
        {thisWeek > 0 && (
          <span
            className="text-[10px] font-black font-headline px-1.5 py-0.5 rounded-full"
            style={{ color: "#1D9E75", backgroundColor: "rgba(29,158,117,0.10)" }}
          >
            +{thisWeek} this week
          </span>
        )}
        <span className="ml-auto text-[10px] font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>
          Read
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15,34,41,0.45)" }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Reviews"
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: "#FFFFFF",
                maxHeight: "min(78vh, 640px)",
                boxShadow: "0 24px 60px rgba(15,34,41,0.28)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — stays put while the list scrolls under it. */}
              <div
                className="flex items-center gap-2.5 px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid rgba(15,34,41,0.08)" }}
              >
                <span className="text-lg font-black font-headline" style={{ color: GOLD }}>★</span>
                <span className="text-lg font-black font-headline" style={{ color: INK }}>{avg.toFixed(1)}</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold font-headline" style={{ color: "#64748b" }}>
                    {count} {count === 1 ? "review" : "reviews"}
                  </p>
                  {experienceTitle && (
                    <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{experienceTitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(15,34,41,0.06)] shrink-0"
                  aria-label="Close"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth={2.5} strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* The only scrolling region — card height stays constant. */}
              <div className="overflow-y-auto divide-y" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
                {reviews.length === 0 ? (
                  <p className="px-5 py-6 text-xs" style={{ color: "#94a3b8" }}>
                    No written reviews yet.
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Stars rating={r.rating} />
                        <span className="text-[12px] font-black font-headline" style={{ color: INK }}>
                          {r.reviewerName ?? "Member"}
                        </span>
                        <span className="ml-auto text-[10px] shrink-0" style={{ color: "#94a3b8" }} suppressHydrationWarning>
                          {new Date(r.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: "#475569" }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
