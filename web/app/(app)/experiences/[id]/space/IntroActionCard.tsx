"use client";

/**
 * IntroActionCard — Bundle 5c (revised).
 *
 * The "introduce yourself" Action Bar card is now SELF-CONTAINED: the prompt
 * and the composer live together, so the action happens right here (no
 * "scroll down to the feed" disconnect). On submit it posts an `intro` and
 * clears itself via the store; the post then shows in the Tribe feed.
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
      className="rounded-2xl p-5 sm:p-6 mb-5 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,97,48,0.10), rgba(255,140,90,0.05))",
        border: "1px solid rgba(255,97,48,0.3)",
        boxShadow: "0 6px 24px rgba(255,97,48,0.10)",
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: "#FF6130", fontWeight: 800 }}>
        Your move
      </p>
      <p className="text-base font-black font-headline mb-3 leading-snug" style={{ color: "#0F2229" }}>
        {prompt}
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a few lines with your Tribe…"
        rows={3}
        maxLength={5000}
        className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none"
        style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
      />
      {error && <p className="text-xs mt-1.5" style={{ color: "#FF6130" }}>{error}</p>}
      <div className="flex justify-end mt-2.5">
        <button
          onClick={submit}
          disabled={posting || !body.trim()}
          className="px-5 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
        >
          {posting ? "Posting…" : "Introduce yourself →"}
        </button>
      </div>
    </div>
  );
}
