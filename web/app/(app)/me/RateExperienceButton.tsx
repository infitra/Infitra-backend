"use client";

import { useState } from "react";
import { submitExperienceReview } from "@/app/actions/review";
import { StarRating } from "@/app/(app)/experiences/[id]/space/StarRating";

const ORANGE = "#FF6130";
const INK = "#0F2229";

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "#FFFFFF" : ORANGE} stroke={filled ? "#FFFFFF" : ORANGE} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" />
    </svg>
  );
}

function RatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold font-headline" style={{ color: "#475569" }}>
      <StarGlyph filled={false} /> Rated
    </span>
  );
}

/**
 * The completed-card rate control. Opens a modal keyed to the COMPLETED run's
 * challenge id and submits via submitExperienceReview — independent of the
 * Experience Space. (The space's room is now the active run, so an ended member's
 * in-space ReviewCard no longer surfaces for their finished run; this is the
 * reachable path.) Reviews are per-run; the RLS insert gate requires membership
 * of this run + experience_review_open, both true once it has ended.
 */
export function RateExperienceButton({
  challengeId,
  experienceTitle,
}: {
  challengeId: string;
  experienceTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) return <RatedBadge />;

  async function submit() {
    if (rating < 1) {
      setError("Tap a star to rate.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await submitExperienceReview(challengeId, rating, body.trim());
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-black font-headline transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.30)" }}
      >
        <StarGlyph filled /> Rate this experience
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15,34,41,0.55)" }}
          onClick={() => !busy && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl p-6 sm:p-7"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 30px 70px rgba(15,34,41,0.35)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="inline-flex items-center text-[10px] uppercase tracking-[0.18em] font-headline px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: ORANGE, fontWeight: 800 }}
            >
              Rate
            </span>
            <h2 className="font-black font-headline mt-3 leading-snug" style={{ color: INK, fontSize: "1.35rem", letterSpacing: "-0.015em" }}>
              How was {experienceTitle}?
            </h2>
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>
              Your rating helps future participants — and credits every Expert who led it.
            </p>

            <div className="mt-4">
              <StarRating value={rating} onChange={setRating} size={34} />
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Anything you'd tell someone considering it? (optional)"
              className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none mt-4"
              style={{ backgroundColor: "rgba(15,34,41,0.03)", border: "1px solid rgba(15,34,41,0.12)", color: INK }}
            />

            {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="px-4 py-2.5 rounded-full text-sm font-bold font-headline hover:opacity-80 disabled:opacity-50"
                style={{ color: "#64748b" }}
              >
                Later
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: ORANGE, boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                {busy ? "Submitting…" : "Submit rating →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
