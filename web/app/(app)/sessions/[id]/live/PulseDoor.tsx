"use client";

/**
 * PulseDoor — the arrival pulse at the room door (founder design, 17 Aug).
 *
 * The pre-pulse card in the space only reaches people who visit the space in
 * the hours before a session; the DOOR is the one point every attendee passes,
 * so the before-number becomes near-complete. Completes the loop: pulse at
 * the door in, reflection at the door out.
 *
 * THE JOIN PATH IS SACRED (we fought for its reliability), so the door is
 * built to be unable to break it:
 *   - "Enter the room" is always enabled; the sliders are optional scenery.
 *   - The submit is fire-and-forget: entering NEVER waits on it, and any
 *     pulse error is swallowed (the pulse can fail silently; the join cannot).
 *   - The server page already skips the door entirely for experts, for late
 *     joiners, and for anyone who pulsed earlier via the space card
 *     (one ask per session, whichever door they hit first).
 */

import { useState } from "react";
import { submitPrePulse } from "@/app/actions/pulse";
import { LiveRoomEmbed } from "@/app/components/LiveRoomEmbed";
import { Slider } from "@/app/components/Slider";

const ORANGE = "#FF6130";
const CYAN_BRIGHT = "#9CF0FF";

export function PulseDoor({
  sessionId,
  sessionTitle,
  backHref,
}: {
  sessionId: string;
  sessionTitle: string;
  backHref: string;
}) {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [touched, setTouched] = useState(false);
  const [entered, setEntered] = useState(false);

  if (entered) {
    return (
      <LiveRoomEmbed
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        isHost={false}
        backHref={backHref}
      />
    );
  }

  function enter(withPulse: boolean) {
    if (withPulse) {
      // Fire-and-forget: the room never waits on the pulse.
      void submitPrePulse(sessionId, mood, energy).catch(() => {});
    }
    setEntered(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ backgroundColor: "#0C262E" }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <img src="/logo-mark.png" alt="" width={28} height={28} className="rounded-lg" />
          <span
            className="text-lg font-headline leading-none"
            style={{ color: ORANGE, fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            INFITRA
          </span>
        </div>

        <p
          className="text-[11px] uppercase tracking-[0.22em] font-headline mb-2"
          style={{ color: CYAN_BRIGHT, fontWeight: 700 }}
        >
          Quick pulse
        </p>
        <h1
          className="text-2xl font-black font-headline tracking-tight leading-tight"
          style={{ color: "#FFFFFF" }}
        >
          How are you arriving?
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          Two taps before you head into {sessionTitle}. Only the group average
          is shown — and tonight you&apos;ll see what the hour changed.
        </p>

        <div className="mt-7 space-y-5">
          <div>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Mood
            </p>
            <div className="pulse-door-slider">
              <Slider
                value={mood}
                onChange={(v) => { setMood(v); setTouched(true); }}
                accent={ORANGE}
                labelLow="Heavy"
                labelHigh="Great"
              />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold font-headline uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              Energy
            </p>
            <div className="pulse-door-slider">
              <Slider
                value={energy}
                onChange={(v) => { setEnergy(v); setTouched(true); }}
                accent={ORANGE}
                labelLow="Running on empty"
                labelHigh="Fully charged"
              />
            </div>
          </div>
        </div>
        {/* The Slider's low/high captions are ink-on-light by default; on the
            dark door they need lifting. Scoped, not a Slider API change. */}
        <style>{`.pulse-door-slider { color: rgba(255,255,255,0.55); }`}</style>

        <button
          onClick={() => enter(touched)}
          className="w-full mt-8 py-3.5 rounded-full text-white text-[15px] font-black font-headline transition-transform hover:scale-[1.01]"
          style={{ backgroundColor: ORANGE, boxShadow: "0 6px 20px rgba(255,97,48,0.40)" }}
        >
          Enter the room →
        </button>
        {!touched && (
          <button
            onClick={() => enter(false)}
            className="block w-full mt-3 text-center text-[12px] underline hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Skip, just let me in
          </button>
        )}
      </div>
    </div>
  );
}
