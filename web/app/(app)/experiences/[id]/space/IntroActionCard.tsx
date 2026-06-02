"use client";

/**
 * IntroActionCard — Bundle 5c (bold "Your Move").
 *
 * The directive container that opens the locker room: a confident, high-presence
 * card (orange accent bar + filled YOUR MOVE tag) holding the intro prompt AND
 * its composer together, so the action happens right here — no "scroll to the
 * feed" disconnect. On submit it posts an `intro` and clears itself via the
 * store; the post then shows in the Tribe feed.
 */

import { useState } from "react";
import { createChallengePost } from "@/app/actions/community";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";

export function IntroActionCard({
  spaceId,
  prompt,
}: {
  spaceId: string;
  prompt: string;
}) {
  const clearIntroAction = useExperienceSpaceStore((s) => s.clearIntroAction);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    const result = await createChallengePost(spaceId, body.trim(), { kind: "intro" });
    if (result?.error) {
      setError(result.error);
      setPosting(false);
      return;
    }
    clearIntroAction();
  }

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,97,48,0.13), rgba(255,140,90,0.05))",
        boxShadow: "0 0 0 1.5px rgba(255,97,48,0.35), 0 10px 30px rgba(255,97,48,0.12)",
      }}
    >
      {/* Orange accent bar — "act here" */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: "#FF6130" }} aria-hidden />

      <div className="pl-6 pr-5 sm:pr-6 py-5 sm:py-6">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-headline px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: "#FF6130", fontWeight: 800, boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          Your move
        </span>
        <p
          className="font-black font-headline mt-2.5 leading-snug"
          style={{ color: "#0F2229", fontSize: "clamp(1.15rem, 3.6vw, 1.5rem)", letterSpacing: "-0.015em" }}
        >
          {prompt}
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share a few lines with your Tribe…"
          rows={3}
          maxLength={5000}
          className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none mt-3.5"
          style={{ backgroundColor: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />
        {error && <p className="text-xs mt-1.5" style={{ color: "#FF6130" }}>{error}</p>}
        <div className="flex justify-end mt-3">
          <button
            onClick={submit}
            disabled={posting || !body.trim()}
            className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
          >
            {posting ? "Posting…" : "Introduce yourself →"}
          </button>
        </div>
      </div>
    </div>
  );
}
