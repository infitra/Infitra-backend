"use client";

/**
 * ReflectionCard — Bundle 7. Action-zone card shown after a session the
 * participant attended ends: an energy-after slider (prominent) + optional free
 * text. Submits via submit_session_reflection, which posts a kind='reflection'
 * post to the Tribe feed (it streams in via the feed's realtime). Clears itself
 * from the action items on submit/skip.
 */

import { useState } from "react";
import { submitSessionReflection } from "@/app/actions/reflection";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { Slider } from "@/app/components/Slider";

const CYAN = "#0891b2";

export function ReflectionCard({
  sessionId,
  sessionTitle,
}: {
  sessionId: string;
  sessionTitle: string;
}) {
  const clearActionItem = useExperienceSpaceStore((s) => s.clearActionItem);
  const [energy, setEnergy] = useState(5);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await submitSessionReflection(sessionId, body.trim(), energy);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    clearActionItem("reflection", sessionId);
  }

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(156,240,255,0.06))",
        boxShadow: "0 0 0 1.5px rgba(8,145,178,0.35), 0 10px 30px rgba(8,145,178,0.10)",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: CYAN }} aria-hidden />
      <div className="pl-6 pr-5 sm:pr-6 py-5 sm:py-6">
        <span
          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-headline px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: CYAN, fontWeight: 800, boxShadow: "0 2px 8px rgba(8,145,178,0.3)" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          Reflect
        </span>
        <p
          className="font-black font-headline mt-2.5 leading-snug"
          style={{ color: "#0F2229", fontSize: "clamp(1.15rem, 3.6vw, 1.5rem)", letterSpacing: "-0.015em" }}
        >
          How was {sessionTitle}?
        </p>

        <div className="mt-4 max-w-sm">
          <Slider value={energy} onChange={setEnergy} accent={CYAN} labelLow="Wiped out" labelHigh="Energized" />
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Anything to share with your Tribe? (optional)"
          rows={2}
          maxLength={5000}
          className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none mt-4"
          style={{ backgroundColor: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />

        {error && <p className="text-xs mt-1.5" style={{ color: "#FF6130" }}>{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-3">
          <button
            onClick={() => clearActionItem("reflection", sessionId)}
            className="px-4 py-2.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
            style={{ color: "#64748b" }}
          >
            Skip
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{ backgroundColor: CYAN, boxShadow: "0 4px 14px rgba(8,145,178,0.35)" }}
          >
            {busy ? "Posting…" : "Post reflection →"}
          </button>
        </div>
      </div>
    </div>
  );
}
