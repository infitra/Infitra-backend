"use client";

/**
 * CollabReviewCard — Surface B (H3c). Shown in the Experience Space to a CREATOR
 * once the experience is over: rate each co-host you collaborated with. PRIVATE
 * — only other creators ever see these (RLS enforces it server-side; this card
 * renders for creators only). One row per co-host the viewer hasn't yet rated.
 */

import { useState } from "react";
import { submitCollabReview } from "@/app/actions/review";
import { StarRating } from "./StarRating";

const CYAN = "#0891b2";

function CollabReviewRow({
  challengeId,
  subject,
}: {
  challengeId: string;
  subject: { id: string; name: string };
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating < 1) {
      setError("Tap a star to rate.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await submitCollabReview(challengeId, subject.id, rating, body.trim());
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <StarRating value={rating} readOnly size={16} />
        <p className="text-xs font-bold font-headline" style={{ color: "#0F2229" }}>
          Feedback on {subject.name} saved — private to creators.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.6)", border: "1px solid rgba(8,145,178,0.18)" }}>
      <p className="text-sm font-bold font-headline" style={{ color: "#0F2229" }}>
        How was collaborating with {subject.name}?
      </p>
      <div className="mt-2">
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Optional — only other creators can see this"
        className="w-full rounded-lg p-2.5 text-sm resize-none focus:outline-none mt-2"
        style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
      />
      {error && <p className="text-xs mt-1" style={{ color: "#FF6130" }}>{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          onClick={submit}
          disabled={busy}
          className="px-5 py-2 rounded-full text-white text-xs font-black font-headline transition-transform hover:scale-[1.02] disabled:opacity-50"
          style={{ backgroundColor: CYAN, boxShadow: "0 4px 14px rgba(8,145,178,0.30)" }}
        >
          {busy ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

export function CollabReviewCard({
  challengeId,
  experienceTitle,
  coHosts,
}: {
  challengeId: string;
  experienceTitle: string;
  coHosts: { id: string; name: string }[];
}) {
  if (coHosts.length === 0) return null;
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(8,145,178,0.10), rgba(156,240,255,0.05))",
        boxShadow: "0 0 0 1.5px rgba(8,145,178,0.30)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: CYAN }} aria-hidden />
      <div className="pl-6 pr-5 sm:pr-6 py-5 sm:py-6">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-headline px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: CYAN, fontWeight: 800 }}
        >
          Private · Creators only
        </span>
        <p
          className="font-black font-headline mt-2.5 leading-snug"
          style={{ color: "#0F2229", fontSize: "clamp(1.1rem, 3.4vw, 1.4rem)", letterSpacing: "-0.015em" }}
        >
          Rate your collaboration
        </p>
        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
          How was working together on {experienceTitle}? Only other creators can see
          this — never participants.
        </p>
        <div className="mt-4 space-y-3">
          {coHosts.map((c) => (
            <CollabReviewRow key={c.id} challengeId={challengeId} subject={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
