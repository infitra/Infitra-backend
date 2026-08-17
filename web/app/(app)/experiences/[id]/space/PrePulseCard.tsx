"use client";

/**
 * PrePulseCard — Bundle 6, two-axis since 2026-08-17. Action-zone card in the
 * ~4h before a session the participant is attending: MOOD ("how do you feel",
 * up = good) + ENERGY ("how's your tank", a state, not a score) — the same
 * two questions the reflection asks after, so the pair is subtractable.
 * Writes via submit_pre_pulse (individual stays private; only the cohort
 * aggregate is surfaced). Clears itself from the action items on submit/skip.
 */

import { useEffect, useState } from "react";
import { submitPrePulse } from "@/app/actions/pulse";
import { useExperienceSpaceStore } from "@/lib/experienceSpace/StoreProvider";
import { Slider } from "@/app/components/Slider";

const CYAN = "#0891b2";

export function PrePulseCard({
  sessionId,
  sessionTitle,
  startTime,
}: {
  sessionId: string;
  sessionTitle: string;
  startTime?: string;
}) {
  const clearActionItem = useExperienceSpaceStore((s) => s.clearActionItem);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submitting used to make the card disappear instantly, which read as "did
  // that even save?" — especially since the group average stays hidden until
  // a few people have answered. Say so, then clear.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => clearActionItem("pre_pulse", sessionId), 3200);
    return () => clearTimeout(t);
  }, [done, clearActionItem, sessionId]);

  const whenStr = startTime
    ? new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await submitPrePulse(sessionId, mood, energy);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(156,240,255,0.06))",
          boxShadow: "0 0 0 1.5px rgba(8,145,178,0.35), 0 10px 30px rgba(8,145,178,0.10)",
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: CYAN }} aria-hidden />
        <div className="pl-6 pr-5 py-5 flex items-start gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: CYAN }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </span>
          <div className="min-w-0">
            <p className="font-black font-headline text-[15px]" style={{ color: "#0F2229" }}>
              Thanks, your experts can see it
            </p>
            <p className="text-[12.5px] leading-snug mt-0.5" style={{ color: "#475569" }}>
              Your answer stays private. The group&apos;s readiness appears once
              a few more people have checked in.
            </p>
          </div>
        </div>
      </div>
    );
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
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          Ready check{whenStr ? ` · ${whenStr}` : ""}
        </span>
        <p
          className="font-black font-headline mt-2.5 leading-snug"
          style={{ color: "#0F2229", fontSize: "clamp(1.15rem, 3.6vw, 1.5rem)", letterSpacing: "-0.015em" }}
        >
          How are you arriving for {sessionTitle}?
        </p>
        <p className="text-[13px] mt-1" style={{ color: "#64748b" }}>Just for your Experts — only the group average is shown.</p>

        <div className="mt-4 max-w-sm space-y-4">
          <div>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
              Mood
            </p>
            <Slider value={mood} onChange={setMood} accent={CYAN} labelLow="Heavy" labelHigh="Great" />
          </div>
          <div>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider mb-1.5" style={{ color: "#64748b" }}>
              Energy
            </p>
            <Slider value={energy} onChange={setEnergy} accent={CYAN} labelLow="Running on empty" labelHigh="Fully charged" />
          </div>
        </div>

        {error && <p className="text-xs mt-2" style={{ color: "#FF6130" }}>{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={() => clearActionItem("pre_pulse", sessionId)}
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
            {busy ? "Saving…" : "Send pulse →"}
          </button>
        </div>
      </div>
    </div>
  );
}
