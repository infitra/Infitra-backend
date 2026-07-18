"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT } from "./ui";

/**
 * M3 · HOW TO COLLABORATE ON INFITRA — the beat engine, in the dark room.
 *
 * Scroll is quantized into discrete BEATS — and DAMPED: however hard the
 * fling, the displayed beat advances at most one step per CATCHUP_MS toward
 * the scroll target, so every beat is always seen and scroll strength never
 * skips story. Each beat is one hard cut: a frame change or a phase reveal.
 * The Publish click fast-forwards by scrolling the page (scroll stays the
 * single source of truth).
 *
 * The room is dark teal wearing the ACTUAL brand waves in a dark theme —
 * the same three wave paths as WaveFlowingBackground, gradient-tuned for
 * depth. At the outro the stage turns transparent, the light waves flood
 * back, and the scroll draws the heartbeat under "Now it comes alive."
 */

/* ── Feel constants — tune on deploy ───────────────────────── */
const BEAT_VH = 70; // runway per beat unit
const CATCHUP_MS = 240; // damping: max one beat per this interval
const CUT_MS = 260; // frame hard-cut duration
const POP_MS = 340; // phase reveal duration
const CASCADE_MS = 170; // published-items stagger
const EASE = "cubic-bezier(.3,.7,.3,1)";

/* dark room palette */
const TEAL = "#0C262E";
const LIGHT = "#F6F3EC";
const LIGHT_MUTED = "rgba(244,241,232,0.72)";
const CYAN_BRIGHT = "#9CF0FF";
const CARD_POP = "0 0 0 1px rgba(255,255,255,0.06), 0 26px 60px rgba(0,0,0,0.38)";
const FIT = "origin-center [@media(max-height:900px)]:scale-[0.93] [@media(max-height:820px)]:scale-[0.85] [@media(max-height:730px)]:scale-[0.76]";

/* ── The beat map — every entry is one scroll notch ────────── */
type BeatDef = { f: number; p: number; w: number };
const BEATS: BeatDef[] = [
  { f: 0, p: 0, w: 1 }, // intro
  { f: 1, p: 0, w: 1 }, // invitation — invited
  { f: 1, p: 1, w: 1 }, // invitation — accepted
  { f: 2, p: 0, w: 1 }, // workspace — static
  { f: 2, p: 1, w: 0.9 }, // workspace — session + Mira's message
  { f: 2, p: 2, w: 0.9 }, // workspace — split adjusts
  { f: 2, p: 3, w: 1 }, // workspace — "locking for review"
  { f: 3, p: 0, w: 1 }, // agreement — locked rows
  { f: 3, p: 1, w: 1.1 }, // agreement — agreed by all collaborators
  { f: 4, p: 0, w: 1.2 }, // publish — the CTA
  { f: 4, p: 1, w: 1.3 }, // publish — everything in between
  { f: 5, p: 0, w: 1.6 }, // outro — the heartbeat
];
const TOTAL_W = BEATS.reduce((a, b) => a + b.w, 0);
const BOUNDS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let acc = 0;
  for (const b of BEATS) {
    out.push([acc, acc + b.w]);
    acc += b.w;
  }
  return out;
})();
const STEP_SPAN: [number, number] = [BOUNDS[1][0], BOUNDS[10][1]];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ── Icons ─────────────────────────────────────────────────── */
const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const FINGERPRINT = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
    <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
    <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
    <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
  </svg>
);
const ICON_SESSIONS = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M16 3v4M8 3v4M3 11h18" />
    <path d="M10.5 14.2l4 2.3-4 2.3z" />
  </svg>
);
const ICON_SPACE = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" />
    <circle cx="17" cy="9" r="2.2" />
    <path d="M15 14a4 4 0 0 1 6 3.5v1" />
  </svg>
);
const ICON_MEGAPHONE = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10v4h3l11 5V5L6 10H3z" />
    <path d="M20 9a5 5 0 0 1 0 6" />
  </svg>
);
const ICON_SPLIT = (color: string, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v7" />
    <path d="M12 10l-6.5 8.5M12 10l6.5 8.5" />
    <circle cx="12" cy="3" r="0.5" />
  </svg>
);

/* ── The brand waves, dark theme — still, discreet, just hinted ── */
function DarkWaves({ hidden }: { hidden: boolean }) {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: hidden ? 0 : 1, transition: `opacity 450ms ${EASE}` }}>
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="dw-flow-1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.10" />
            <stop offset="40%" stopColor="#9CF0FF" stopOpacity="0.045" />
            <stop offset="52%" stopColor="#0C262E" stopOpacity="0" />
            <stop offset="64%" stopColor="#FF6130" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.11" />
          </linearGradient>
          <linearGradient id="dw-flow-2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9CF0FF" stopOpacity="0.07" />
            <stop offset="50%" stopColor="#0C262E" stopOpacity="0" />
            <stop offset="100%" stopColor="#FF6130" stopOpacity="0.07" />
          </linearGradient>
        </defs>
        <path
          d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z"
          fill="url(#dw-flow-1)"
        />
        <path
          d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z"
          fill="url(#dw-flow-2)"
        />
      </svg>
    </div>
  );
}

/* ── Phase reveal — space reserved, pops decisively ────────── */
function Pop({
  show,
  d = 0,
  from = "translateY(14px) scale(0.97)",
  className,
  children,
}: {
  show: boolean;
  d?: number;
  from?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "none" : from,
        transition: `opacity ${POP_MS}ms ${EASE} ${d}ms, transform ${POP_MS}ms ${EASE} ${d}ms`,
        pointerEvents: show ? undefined : "none",
      }}
    >
      {children}
    </div>
  );
}

/* ── Step head (dark room) ─────────────────────────────────── */
function StepHead({ kicker, accent, title, copy }: { kicker: string; accent: string; title: string; copy?: string }) {
  return (
    <div className="mb-8">
      <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: accent, fontWeight: 800 }}>
        {kicker}
      </p>
      <h3 className="text-3xl md:text-[2.6rem] md:leading-[1.12] font-headline tracking-tight mb-4 max-w-3xl mx-auto" style={{ color: LIGHT, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      {copy && (
        <p className="text-[15.5px] md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: LIGHT_MUTED }}>
          {copy}
        </p>
      )}
    </div>
  );
}

/* ══ Frame 1 · The invitation ═══════════════════════════════ */

function PortraitCard({ p, color }: { p: { name: string; tag: string; avatar: string }; color: string }) {
  return (
    <div className="rounded-3xl px-5 py-8 text-center w-52" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
      <span className="inline-block w-24 h-24 rounded-full overflow-hidden" style={{ border: `3px solid ${color}66` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar} alt="" className="w-full h-full object-cover" />
      </span>
      <p className="text-[16px] font-headline mt-3.5" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
      <p className="text-[10px] uppercase tracking-widest font-headline mt-1" style={{ color, fontWeight: 800 }}>{p.tag}</p>
    </div>
  );
}

function InvitationFrame({ phase }: { phase: number }) {
  const accepted = phase >= 1;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      <StepHead
        kicker="Step 01 · The invitation"
        accent={CYAN_BRIGHT}
        title="Pick your complement."
        copy="One invitation starts a shared draft with the expert who complements you. INFITRA supports multiple creators inside one experience."
      />

      {/* the invitation — the only place the accepted state lives */}
      <div className="flex justify-center mb-7">
        <div className="flex items-center gap-3.5 rounded-2xl px-5 py-3.5" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
          <span className="shrink-0 w-10 h-10 rounded-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="text-left">
            <span className="block text-[14px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
              Alex invited you to co-create an experience!
            </span>
            <span className="relative block h-[22px] mt-1.5">
              <span
                className="absolute left-0 top-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] uppercase tracking-widest font-headline"
                style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800, opacity: accepted ? 0 : 1, transition: "opacity 220ms ease" }}
              >
                Invitation
              </span>
              <span
                className="absolute left-0 top-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] uppercase tracking-widest font-headline"
                style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800, opacity: accepted ? 1 : 0, transform: accepted ? "scale(1)" : "scale(0.8)", transition: `opacity ${POP_MS}ms ${EASE} 80ms, transform ${POP_MS}ms ${EASE} 80ms` }}
              >
                {CHECK(CYAN, 10)} Accepted
              </span>
            </span>
          </span>
        </div>
      </div>

      {/* the pair — clean, aligned; the JOIN itself signals acceptance */}
      <div className="flex items-center justify-center gap-5 sm:gap-7">
        <PortraitCard p={ALEX} color={ORANGE} />
        <span
          className="relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: accepted ? "rgba(156,240,255,0.95)" : "rgba(156,240,255,0.12)",
            border: `1.5px solid ${accepted ? CYAN_BRIGHT : "rgba(156,240,255,0.35)"}`,
            boxShadow: accepted ? "0 0 32px rgba(156,240,255,0.45)" : "none",
            transition: `background-color ${POP_MS}ms ${EASE} 120ms, border-color ${POP_MS}ms ${EASE} 120ms, box-shadow ${POP_MS}ms ${EASE} 120ms`,
          }}
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke={CYAN_BRIGHT}
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden
            className="absolute"
            style={{ opacity: accepted ? 0 : 1, transform: accepted ? "scale(0.5) rotate(90deg)" : "none", transition: `opacity ${POP_MS}ms ${EASE} 120ms, transform ${POP_MS}ms ${EASE} 120ms` }}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEAL}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="absolute"
            style={{ opacity: accepted ? 1 : 0, transform: accepted ? "none" : "scale(0.5) rotate(-90deg)", transition: `opacity ${POP_MS}ms ${EASE} 160ms, transform ${POP_MS}ms ${EASE} 160ms` }}
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <PortraitCard p={MIRA} color={CYAN} />
      </div>
    </div>
  );
}

/* ══ Frame 2 · The workspace — actions revealed beat by beat ═ */

function WorkspaceFrame({ phase }: { phase: number }) {
  const ringOn = (target: number) => (phase === target ? `0 0 0 2.5px ${ORANGE}80, ` : "");
  return (
    <div className={`w-full max-w-4xl mx-auto ${FIT}`}>
      <StepHead kicker="Step 02 · The workspace" accent={ORANGE} title="Design it together." copy="A pre-structured experience to create inside — add a session, set the split, talk it through, right there." />

      <div className="grid md:grid-cols-[1.55fr_1fr] gap-5 items-start text-left">
        {/* the workspace */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
          <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <p className="text-[15px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, backgroundColor: "rgba(15,34,41,0.05)", fontWeight: 800 }}>
                Draft
              </span>
            </div>
            <div className="flex -space-x-1.5 shrink-0">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="relative w-7 h-7 rounded-full overflow-hidden" style={{ border: "2px solid #FFFFFF" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e", border: "1px solid #FFF" }} />
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
              <div className="rounded-2xl px-4 py-3.5 text-[15px] font-headline leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK, fontWeight: 700 }}>
                {EX.promise}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>The sessions</p>
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1" style={{ border: "1.5px dashed rgba(8,145,178,0.40)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[10px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                  <span className="relative shrink-0 w-16 h-11 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/landing/session-meet.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-headline leading-snug truncate" style={{ color: INK, fontWeight: 800 }}>Meet your Experts</span>
                    <span className="block text-[10px] font-bold mt-0.5" style={{ color: FAINT }}>Week 1 · Sun 13:00 · Alex &amp; Mira</span>
                  </span>
                </div>
                {/* beat: the session Mira adds — arrives WITH her message */}
                <Pop show={phase >= 1} from="translateX(-22px)">
                  <div
                    className="flex items-center gap-3 rounded-xl p-3"
                    style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.25)", boxShadow: `${ringOn(1)}0 0 0 0 transparent`, transition: `box-shadow 400ms ${EASE}` }}
                  >
                    <span className="relative shrink-0 w-16 h-11 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/landing/session-nutrition.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-headline leading-snug truncate" style={{ color: INK, fontWeight: 800 }}>Nutrition Foundations &amp; Weekly Setup</span>
                      <span className="block text-[10px] font-bold mt-0.5" style={{ color: FAINT }}>Week 1 · Mon 13:00 · Mira</span>
                    </span>
                    <span className="shrink-0 text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 800 }}>Added ✓</span>
                  </div>
                </Pop>
              </div>
            </div>

            {/* beat: the split — heavier, with a knob, demands attention */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>The team · revenue share</p>
              <div
                className="flex items-center gap-4 rounded-2xl px-4 py-4"
                style={{
                  backgroundColor: "#FAFAF7",
                  border: "1px solid rgba(15,34,41,0.06)",
                  boxShadow: `${ringOn(2)}0 0 0 0 transparent`,
                  transform: phase === 2 ? "scale(1.02)" : "scale(1)",
                  transition: `box-shadow 400ms ${EASE}, transform 400ms ${EASE}`,
                }}
              >
                <span className="flex -space-x-2 shrink-0">
                  {[{ a: ALEX.avatar, c: ORANGE }, { a: MIRA.avatar, c: CYAN }].map(({ a, c }) => (
                    <span key={a} className="w-8 h-8 rounded-full overflow-hidden" style={{ border: `2px solid ${c}59`, backgroundColor: "#fff" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a} alt="" className="w-full h-full object-cover" />
                    </span>
                  ))}
                </span>
                <span className="relative flex-1 h-3.5 rounded-full overflow-visible">
                  <span className="absolute inset-0 rounded-full overflow-hidden flex">
                    <span style={{ width: phase >= 2 ? `${EX.split.owner}%` : "50%", backgroundColor: ORANGE, transition: `width 700ms ${EASE}` }} />
                    <span style={{ flex: 1, backgroundColor: CYAN }} />
                  </span>
                  <span
                    className="absolute top-1/2 w-6 h-6 rounded-full"
                    style={{
                      left: phase >= 2 ? `${EX.split.owner}%` : "50%",
                      transform: "translate(-50%,-50%)",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 0 0 2px rgba(15,34,41,0.18), 0 4px 12px rgba(15,34,41,0.30)",
                      transition: `left 700ms ${EASE}`,
                    }}
                  />
                </span>
                <span className="relative w-14 text-right">
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[15px] font-black font-headline tabular-nums" style={{ color: INK, opacity: phase >= 2 ? 0 : 1, transition: "opacity 200ms ease" }}>50/50</span>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[15px] font-black font-headline tabular-nums" style={{ color: ORANGE, opacity: phase >= 2 ? 1 : 0, transition: "opacity 200ms ease 350ms" }}>60/40</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the team chat — messages land as the work happens */}
        <div
          className="rounded-3xl p-5 md:mt-8"
          style={{ backgroundColor: "#FAF8F3", boxShadow: `${ringOn(3)}${CARD_POP}`, transition: `box-shadow 400ms ${EASE}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>Team chat</p>
            <span className="flex -space-x-1">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="w-[18px] h-[18px] rounded-full overflow-hidden" style={{ border: "1.5px solid #FAF8F3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                </span>
              ))}
            </span>
          </div>
          <div className="space-y-3">
            {/* arrives together with the session she added */}
            <Pop show={phase >= 1} from="translateY(10px)">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[12.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                  Added my nutrition sessions for weeks 1–3 ✓
                </div>
              </div>
            </Pop>
            {/* beat: Alex closes the design — the loudest message */}
            <Pop show={phase >= 3} from="translateY(12px) scale(0.94)">
              <div className="flex items-start gap-2 justify-end">
                <div
                  className="rounded-2xl rounded-tr-md px-4 py-3 text-[13.5px] font-headline leading-snug"
                  style={{ backgroundColor: "rgba(255,97,48,0.12)", color: INK, fontWeight: 700, boxShadow: `0 0 0 1.5px ${ORANGE}59` }}
                >
                  I think we are all set — I&apos;ll lock this for review!
                </div>
                <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                </span>
              </div>
            </Pop>
            <div className="rounded-full px-4 py-2.5 text-[11.5px]" style={{ backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
              Message your team…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 3 · The agreement — the record carries the weight ═ */

function AgreementFrame({ phase }: { phase: number }) {
  return (
    <div className={`w-full max-w-xl mx-auto ${FIT}`}>
      <StepHead kicker="Step 03 · The agreement" accent={CYAN_BRIGHT} title="Lock it. Review. Agree." copy="The whole design locks as one. Your partner reviews and agrees to exactly that." />

      <div className="flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10.5px] uppercase tracking-widest font-headline" style={{ color: "#4ade80", backgroundColor: "rgba(74,222,128,0.12)", fontWeight: 800 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3.5" y="11" width="17" height="10" rx="2" />
            <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
          </svg>
          Locked for review
        </span>
        <p className="text-[17px] font-headline tracking-tight mt-3" style={{ color: LIGHT, fontWeight: 800 }}>{EX.title}</p>
        <p className="text-[9.5px] uppercase tracking-[0.18em] font-headline mt-1 mb-6" style={{ color: "rgba(244,241,232,0.5)", fontWeight: 800 }}>The whole design</p>

        <div className="w-full max-w-lg space-y-2.5">
          {[`All ${EX.sessions} sessions — as designed`, "Ownership — as assigned", `Split — ${EX.split.owner} / ${EX.split.cohost}`].map((t) => (
            <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
              <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 14)}</span>
              <span className="text-[14px] font-bold font-headline" style={{ color: INK }}>{t}</span>
            </div>
          ))}
        </div>

        {/* beat: THE RECORD — diligent, timestamped, heavy */}
        <Pop show={phase >= 1} from="translateY(20px) scale(0.93)" className="w-full mt-7">
          <div className="rounded-3xl px-7 py-7 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 2.5px rgba(255,97,48,0.45), 0 34px 80px rgba(0,0,0,0.5)" }}>
            <p className="inline-flex items-center gap-2.5 text-[22px] md:text-[26px] font-headline tracking-tight" style={{ color: INK, fontWeight: 800, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#16a34a" }}>{CHECK("#16a34a", 24)}</span> Agreed by all collaborators
            </p>
            <div className="grid grid-cols-2 gap-4 mt-5">
              {[
                { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp },
                { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp },
              ].map(({ p, color, action, stamp }) => (
                <div key={p.name} className="rounded-2xl px-5 py-4 text-left" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.08)" }}>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
                  <p className="text-[19px] leading-none mt-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>{p.name}</p>
                  <p className="flex items-center gap-1.5 mt-3 text-[11px] font-black font-headline tabular-nums" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                    Recorded · {stamp}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10.5px] font-bold font-headline mt-4" style={{ color: FAINT }}>
              Every agreement recorded — exactly as accepted, exactly when.
            </p>
          </div>
        </Pop>
      </div>
    </div>
  );
}

/* ══ Frame 4 · The publish — your click, then everything ════ */

const HANDLED = [
  { t: "Sessions", d: "All 20 scheduled — live rooms ready to open.", icon: ICON_SESSIONS, color: CYAN },
  { t: "Experience space", d: "The tribe's room, open and waiting for members.", icon: ICON_SPACE, color: CYAN },
  { t: "Marketing page", d: "Live on your link, checkout included — ready to promote.", icon: ICON_MEGAPHONE, color: ORANGE },
  { t: "Contract", d: "Recorded & sealed automatically — tamper-evident.", icon: FINGERPRINT, color: CYAN },
  { t: "Revenue split", d: "Armed for every sale — exactly as agreed.", icon: ICON_SPLIT, color: ORANGE },
];

function PublishFrame({ phase, onPublish }: { phase: number; onPublish: () => void }) {
  const published = phase >= 1;
  return (
    <div className={`w-full max-w-2xl mx-auto ${FIT}`}>
      {/* two-state head, crisp swap */}
      <div className="relative mb-6" style={{ minHeight: 140 }}>
        <div className="absolute inset-x-0 top-0" style={{ opacity: published ? 0 : 1, transition: `opacity ${CUT_MS}ms ${EASE}` }}>
          <StepHead kicker="Step 04 · The publish" accent={ORANGE} title="All agreed. One move left." />
        </div>
        <div className="absolute inset-x-0 top-0" style={{ opacity: published ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 80ms` }}>
          <StepHead kicker="Step 04 · The publish" accent={ORANGE} title="One click from agreement to promotion and sales." copy="INFITRA takes care of everything in between." />
        </div>
      </div>

      <div className="relative" style={{ minHeight: 460 }}>
        {/* state 1 — full focus on the CTA */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-start pt-6"
          style={{ opacity: published ? 0 : 1, transform: published ? "translateY(-14px)" : "none", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: published ? "none" : "auto" }}
        >
          <button
            type="button"
            onClick={onPublish}
            className="px-16 py-6 rounded-full text-white text-xl font-black font-headline transition-transform hover:scale-[1.05]"
            style={{ backgroundColor: ORANGE, boxShadow: "0 18px 54px rgba(255,97,48,0.55), 0 5px 18px rgba(255,97,48,0.35)" }}
          >
            Publish now!
          </button>
          <p className="text-[13px] mt-5" style={{ color: LIGHT_MUTED }}>Your move — or keep scrolling.</p>
        </div>

        {/* state 2 — everything in between, one by one, with weight */}
        <div
          className="absolute inset-0 flex flex-col gap-3 text-left"
          style={{ opacity: published ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 100ms`, pointerEvents: published ? "auto" : "none" }}
        >
          {HANDLED.map(({ t, d, icon, color }, i) => (
            <Pop key={t} show={published} d={250 + i * CASCADE_MS} from="translateY(16px) scale(0.97)">
              <div className="flex items-center gap-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
                <span className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                  {icon(color, 22)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{t}</span>
                  <span className="block text-[12.5px] font-semibold mt-1 leading-snug" style={{ color: MUTED }}>{d}</span>
                </span>
                <span className="ml-auto shrink-0" style={{ color: "#16a34a" }}>{CHECK("#16a34a", 15)}</span>
              </div>
            </Pop>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 5 · Outro — back into the light ══════════════════ */

function OutroFrame({ instant = false }: { instant?: boolean }) {
  return (
    <div className="w-full">
      <p className="text-4xl md:text-6xl font-headline tracking-tight leading-[1.1] text-center" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.025em" }}>
        Now it <span style={{ color: ORANGE }}>comes alive.</span>
      </p>
      <div className="relative mt-12 h-24 md:h-32 -mx-5 sm:-mx-8 lg:-ml-60 lg:-mr-16" aria-hidden>
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" fill="none">
          <defs>
            <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={CYAN} />
              <stop offset="55%" stopColor={CYAN} />
              <stop offset="100%" stopColor={ORANGE} />
            </linearGradient>
          </defs>
          <path d="M0,80 L1200,80" stroke="rgba(15,34,41,0.08)" strokeWidth={2} strokeDasharray="3 7" />
          <path
            d="M0,80 H400 L430,80 L452,18 L478,142 L502,80 H740 L772,80 L794,24 L820,136 L844,80 H1200"
            stroke="url(#ecgGrad)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.15}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={instant ? 0 : 1}
            data-ecg
          />
          <path
            d="M0,80 H400 L430,80 L452,18 L478,142 L502,80 H740 L772,80 L794,24 L820,136 L844,80 H1200"
            stroke="url(#ecgGrad)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={instant ? 0 : 1}
            data-ecg
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Intro ─────────────────────────────────────────────────── */

function IntroFrame() {
  return (
    <div>
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[10.5px] uppercase tracking-[0.25em] font-headline mb-3.5" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
          How it works
        </p>
        <h2 className="text-3xl md:text-5xl font-headline tracking-tight" style={{ color: LIGHT, fontWeight: 700, letterSpacing: "-0.02em" }}>
          How to collaborate on INFITRA.
        </h2>
        <p className="text-base md:text-lg mt-5 leading-relaxed max-w-2xl mx-auto" style={{ color: LIGHT_MUTED }}>
          Four moves. Everything else is handled.
        </p>
      </div>
      <div className="flex justify-center mt-8" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CYAN_BRIGHT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

/* ── The chapter ───────────────────────────────────────────── */

const RAIL = [
  { label: "The invitation", frame: 1, firstBeat: 1 },
  { label: "The workspace", frame: 2, firstBeat: 3 },
  { label: "The agreement", frame: 3, firstBeat: 7 },
  { label: "The publish", frame: 4, firstBeat: 9 },
];

export function HowItWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [target, setTarget] = useState(0);
  const [beat, setBeat] = useState(0);
  const [pinned, setPinned] = useState(true);
  const beatRef = useRef(0);
  const jumpGuardRef = useRef(false);
  const jumpTimerRef = useRef(0);

  const frame = BEATS[beat].f;
  const phase = BEATS[beat].p;
  const isOutro = frame === 5;

  /* damping: step at most ONE beat toward the scroll target per interval —
     scroll strength can never skip story */
  useEffect(() => {
    if (beat === target) return;
    const t = setTimeout(
      () =>
        setBeat((b) => {
          const nb = b + Math.sign(target - b);
          beatRef.current = nb;
          return nb;
        }),
      CATCHUP_MS,
    );
    return () => clearTimeout(t);
  }, [beat, target]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerHeight < 600) {
      const raf0 = requestAnimationFrame(() => setPinned(false));
      return () => cancelAnimationFrame(raf0);
    }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = wrapperRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      let pos = clamp01(-r.top / total) * TOTAL_W;

      // THE LEASH: the page can never be more than one beat ahead/behind the
      // displayed beat — a fling gets held at the next beat's edge and flows
      // through beat by beat at CATCHUP pace. Explicit jumps bypass via guard.
      if (!jumpGuardRef.current) {
        const bcur = beatRef.current;
        const maxPos = bcur >= BEATS.length - 1 ? Infinity : BOUNDS[bcur + 1][1] - 0.04;
        const minPos = bcur <= 0 ? -Infinity : BOUNDS[bcur - 1][0] + 0.02;
        if (pos > maxPos || pos < minPos) {
          const held = Math.min(Math.max(pos, minPos), maxPos);
          window.scrollTo({ top: window.scrollY + r.top + (held / TOTAL_W) * total, behavior: "auto" });
          pos = held;
        }
      }

      let bi = BEATS.length - 1;
      for (let i = 0; i < BOUNDS.length; i++) {
        if (pos >= BOUNDS[i][0] && pos < BOUNDS[i][1]) {
          bi = i;
          break;
        }
      }
      setTarget((prev) => (prev === bi ? prev : bi));

      const sp = clamp01((pos - STEP_SPAN[0]) / (STEP_SPAN[1] - STEP_SPAN[0]));
      if (railFillRef.current) railFillRef.current.style.height = `${(sp * 100).toFixed(1)}%`;

      const [oa, ob] = BOUNDS[BOUNDS.length - 1];
      const draw = clamp01((pos - oa) / ((ob - oa) * 0.75));
      frameRefs.current[5]?.querySelectorAll<SVGPathElement>("[data-ecg]").forEach((p) => {
        p.style.strokeDashoffset = String(1 - draw);
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /** Scroll the page to a beat's midpoint — scroll stays the source of truth. */
  function jumpToBeat(i: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const mid = (BOUNDS[i][0] + BOUNDS[i][1]) / 2;
    jumpGuardRef.current = true;
    window.clearTimeout(jumpTimerRef.current);
    jumpTimerRef.current = window.setTimeout(() => {
      jumpGuardRef.current = false;
    }, 1100);
    beatRef.current = i;
    setBeat(i);
    setTarget(i);
    window.scrollTo({ top: window.scrollY + r.top + (mid / TOTAL_W) * total, behavior: "smooth" });
  }

  if (!pinned) {
    return (
      <>
        <section className="px-4 sm:px-6 py-20 relative overflow-hidden" style={{ backgroundColor: TEAL }}>
          <DarkWaves hidden={false} />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="py-8">
              <IntroFrame />
            </div>
            <div className="py-12"><InvitationFrame phase={1} /></div>
            <div className="py-12"><WorkspaceFrame phase={3} /></div>
            <div className="py-12"><AgreementFrame phase={1} /></div>
            <div className="py-12"><PublishFrame phase={1} onPublish={() => {}} /></div>
          </div>
        </section>
        <section className="px-4 sm:px-6 py-20">
          <div className="max-w-5xl mx-auto text-center">
            <OutroFrame instant />
          </div>
        </section>
      </>
    );
  }

  return (
    <section>
      <div ref={wrapperRef} className="relative" style={{ height: `${TOTAL_W * BEAT_VH}vh` }}>
        <div
          className="sticky top-0 w-full overflow-hidden h-screen"
          style={{ height: "100dvh", backgroundColor: isOutro ? "rgba(12,38,46,0)" : TEAL, transition: `background-color 450ms ${EASE}` }}
        >
          {/* the brand waves, dark theme */}
          <DarkWaves hidden={isOutro} />

          {/* Rail — desktop */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-5" style={{ opacity: frame >= 1 && frame <= 4 ? 1 : 0.2, transition: "opacity 400ms ease" }}>
            <div className="relative w-px rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
              <div ref={railFillRef} className="absolute top-0 left-0 w-px rounded-full" style={{ height: "0%", backgroundColor: ORANGE }} />
            </div>
            <div className="flex flex-col justify-between gap-8 py-0.5">
              {RAIL.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => jumpToBeat(s.firstBeat)}
                  className="flex items-center gap-3 text-left transition-opacity duration-300"
                  style={{ opacity: frame === s.frame ? 1 : 0.4 }}
                >
                  <span className="shrink-0 w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: frame === s.frame ? ORANGE : "rgba(255,255,255,0.3)" }} />
                  <span className="min-w-0">
                    <span className="block text-[9.5px] uppercase tracking-widest font-headline" style={{ color: frame === s.frame ? ORANGE : "rgba(244,241,232,0.5)", fontWeight: 800 }}>
                      0{s.frame}
                    </span>
                    <span className="block text-[13px] font-headline leading-tight whitespace-nowrap" style={{ color: LIGHT, fontWeight: 700 }}>
                      {s.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress dots — mobile */}
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: frame >= 1 && frame <= 4 ? 1 : 0, transition: "opacity 400ms ease" }}>
            {RAIL.map((s) => (
              <span key={s.frame} className="h-1.5 rounded-full transition-all duration-300" style={{ width: frame === s.frame ? 18 : 6, backgroundColor: frame === s.frame ? ORANGE : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>

          {/* Frames — hard cuts, one visible at a time, all centered */}
          {[0, 1, 2, 3, 4, 5].map((f) => {
            const active = frame === f;
            return (
              <div
                key={f}
                ref={(el) => {
                  frameRefs.current[f] = el;
                }}
                aria-hidden={!active}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-60 lg:pr-16 pt-24 pb-14"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "none" : "translateY(12px)",
                  transition: active
                    ? `opacity ${CUT_MS}ms ${EASE} 70ms, transform ${CUT_MS}ms ${EASE} 70ms`
                    : `opacity 160ms ${EASE}, transform 160ms ${EASE}`,
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                <div className="w-full max-w-5xl mx-auto">
                  {f === 0 && <IntroFrame />}
                  {f === 1 && <InvitationFrame phase={active ? phase : 0} />}
                  {f === 2 && <WorkspaceFrame phase={active ? phase : 0} />}
                  {f === 3 && <AgreementFrame phase={active ? phase : 0} />}
                  {f === 4 && <PublishFrame phase={active ? phase : 0} onPublish={() => jumpToBeat(10)} />}
                  {f === 5 && <OutroFrame />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
