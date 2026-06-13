"use client";

/**
 * ReviewCard — Surface A (H3c). Shown in the Experience Space to a MEMBER once
 * the experience is over (experience_review_open) and they haven't reviewed it.
 * One rating for the whole experience — the backend credits all creators. The
 * card is gated by the page (reviewState), not the realtime action-item system,
 * so it self-manages its done/skip state (re-asks on next load until reviewed).
 */

import { useState } from "react";
import { submitExperienceReview } from "@/app/actions/review";
import { StarRating } from "./StarRating";

const ORANGE = "#FF6130";

export function ReviewCard({
  challengeId,
  experienceTitle,
}: {
  challengeId: string;
  experienceTitle: string;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"open" | "done" | "skipped">("open");
  const [error, setError] = useState<string | null>(null);

  if (state === "skipped") return null;

  if (state === "done") {
    return (
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,97,48,0.12), rgba(255,97,48,0.04))",
          boxShadow: "0 0 0 1.5px rgba(255,97,48,0.30)",
        }}
      >
        <div className="px-6 py-5 flex items-center gap-3">
          <StarRating value={rating} readOnly size={20} />
          <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
            Thanks for rating {experienceTitle}!
          </p>
        </div>
      </div>
    );
  }

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
    setState("done");
  }

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,97,48,0.12), rgba(255,97,48,0.05))",
        boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 10px 30px rgba(255,97,48,0.10)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: ORANGE }} aria-hidden />
      <div className="pl-6 pr-5 sm:pr-6 py-5 sm:py-6">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-headline px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: ORANGE, fontWeight: 800, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
        >
          Rate
        </span>
        <p
          className="font-black font-headline mt-2.5 leading-snug"
          style={{ color: "#0F2229", fontSize: "clamp(1.15rem, 3.6vw, 1.5rem)", letterSpacing: "-0.015em" }}
        >
          How was {experienceTitle}?
        </p>
        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
          Your rating helps future participants — and credits every Expert who led it.
        </p>

        <div className="mt-4">
          <StarRating value={rating} onChange={setRating} size={32} />
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={5000}
          placeholder="Anything you'd tell someone considering it? (optional)"
          className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none mt-4"
          style={{ backgroundColor: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />

        {error && <p className="text-xs mt-1.5" style={{ color: ORANGE }}>{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-3">
          <button
            onClick={() => setState("skipped")}
            className="px-4 py-2.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
            style={{ color: "#64748b" }}
          >
            Later
          </button>
          <button
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
  );
}
