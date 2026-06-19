"use client";

/**
 * ViewOnlyBanner — the "signal on top" for a lineage member who can't post in
 * the space's ACTIVE run yet (server `viewer_state`):
 *
 *   upcoming — you bought a future run while a prior one is still live (case 3).
 *              Read-along, with the date your own chapter opens.
 *   ended    — your run is over and a later one is now live. Read-along, plus a
 *              Continue button that is the buyer-page checkout pointed at the
 *              next chapter (reuses PurchaseButton → create_checkout_session).
 *
 * Pairs with the ~75%-whitened content below it in ExperienceSpaceShell.
 */

import { PurchaseButton } from "@/app/components/PurchaseButton";
import type { NextChapter } from "@/lib/experienceSpace/store";

const INK = "#0F2229";
const CYAN = "#0891b2";

function fmtChapterDate(iso: string): string {
  // Date-only ("2026-06-25"); render as a calendar date (no time/zone).
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ViewOnlyBanner({
  state,
  runStart,
  nextChapter,
}: {
  state: "upcoming" | "ended";
  runStart: string | null;
  nextChapter: NextChapter | null;
}) {
  if (state === "upcoming") {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-start gap-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(156,240,255,0.10))",
          boxShadow: "0 0 0 1px rgba(8,145,178,0.18), 0 6px 20px rgba(8,145,178,0.10)",
        }}
      >
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(8,145,178,0.16)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-black font-headline leading-snug" style={{ color: INK, letterSpacing: "-0.01em" }} suppressHydrationWarning>
            Your chapter opens {runStart ? fmtChapterDate(runStart) : "soon"}
          </p>
          <p className="text-[13px] font-bold font-headline mt-0.5" style={{ color: "#5b7886" }}>
            You&apos;re reading along with the current group until then.
          </p>
        </div>
      </div>
    );
  }

  // ended
  return (
    <div
      className="rounded-2xl px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-5"
      style={{
        background: "linear-gradient(135deg, rgba(15,34,41,0.05), rgba(15,34,41,0.02))",
        boxShadow: "0 0 0 1px rgba(15,34,41,0.10), 0 6px 20px rgba(15,34,41,0.06)",
      }}
    >
      <div className="min-w-0 flex items-start gap-3.5">
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,34,41,0.07)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-black font-headline leading-snug" style={{ color: INK, letterSpacing: "-0.01em" }}>
            This experience has moved into its next chapter
          </p>
          <p className="text-[13px] font-bold font-headline mt-0.5" style={{ color: "#64748b" }}>
            Join to activate.
          </p>
        </div>
      </div>
      {nextChapter && (
        <div className="mt-3.5 sm:mt-0 sm:w-[176px] shrink-0">
          <PurchaseButton kind="challenge" targetId={nextChapter.id}>
            Continue
          </PurchaseButton>
        </div>
      )}
    </div>
  );
}
