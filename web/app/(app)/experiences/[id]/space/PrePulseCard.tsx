"use client";

/**
 * PrePulseCard — Bundle 6. Action-zone card that appears in the ~4h before a
 * session the participant is attending: a single 0–10 readiness slider. Writes
 * via submit_pre_pulse (individual stays private; only the cohort aggregate is
 * surfaced on the session). Clears itself from the action items on submit/skip.
 */

import { useState } from "react";
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
  const [value, setValue] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whenStr = startTime
    ? new Date(startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await submitPrePulse(sessionId, value);
    if (res?.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    clearActionItem("pre_pulse", sessionId);
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
          How ready do you feel for {sessionTitle}?
        </p>
        <p className="text-[13px] mt-1" style={{ color: "#64748b" }}>Just for your Experts — only the group average is shown.</p>

        <div className="mt-4 max-w-sm">
          <Slider value={value} onChange={setValue} accent={CYAN} labelLow="Drained" labelHigh="Fired up" />
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
