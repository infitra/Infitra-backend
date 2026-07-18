"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW TO COLLABORATE ON INFITRA — the beat engine, in the dark room.
 *
 * Scroll is quantized into discrete BEATS: every scroll notch is exactly one
 * hard cut — a frame change or a phase reveal inside a frame. No scrubbed
 * in-between states, no timers; the story advances only when the visitor
 * scrolls (the Publish click fast-forwards by scrolling the page for you, so
 * scroll position stays the single source of truth).
 *
 * The whole build chapter is an immersive DARK TEAL room with crisp diagonal
 * brand accents (no fog): white cards and the orange CTA pop hard. At the
 * outro the stage turns transparent — the page's wave background floods back
 * in — and the scroll draws the heartbeat under "Now it comes alive."
 */

/* ── Feel constants — tune on deploy ───────────────────────── */
const BEAT_VH = 60; // runway per beat unit
const CUT_MS = 260; // frame hard-cut duration
const POP_MS = 340; // phase reveal duration
const CASCADE_MS = 150; // published-items stagger
const EASE = "cubic-bezier(.3,.7,.3,1)";

/* dark room palette */
const TEAL = "#0C262E";
const LIGHT = "#F6F3EC";
const LIGHT_MUTED = "rgba(244,241,232,0.72)";
const CYAN_BRIGHT = "#9CF0FF";
const CARD_POP = "0 0 0 1px rgba(255,255,255,0.06), 0 26px 60px rgba(0,0,0,0.38)";

/* ── The beat map — every entry is one scroll notch ────────── */
type Beat = { f: number; p: number; w: number };
const BEATS: Beat[] = [
  { f: 0, p: 0, w: 1 }, // intro
  { f: 1, p: 0, w: 1 }, // invitation — invited
  { f: 1, p: 1, w: 1 }, // invitation — accepted
  { f: 2, p: 0, w: 1 }, // workspace — static
  { f: 2, p: 1, w: 0.9 }, // workspace — session added
  { f: 2, p: 2, w: 0.9 }, // workspace — split adjusts
  { f: 2, p: 3, w: 1 }, // workspace — "locking for review"
  { f: 3, p: 0, w: 1 }, // agreement — locked rows
  { f: 3, p: 1, w: 1.1 }, // agreement — agreed by both (hero)
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
const STEP_SPAN: [number, number] = [BOUNDS[1][0], BOUNDS[10][1]]; // rail fill range

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ── Icons ─────────────────────────────────────────────────── */
const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const FINGERPRINT = (color: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
    <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
    <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
    <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
  </svg>
);

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
    <div className="mb-9">
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: accent, fontWeight: 800 }}>
        {kicker}
      </p>
      <h3 className="text-2xl md:text-4xl font-headline tracking-tight mb-3 max-w-2xl mx-auto" style={{ color: LIGHT, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      {copy && (
        <p className="text-[15px] md:text-lg leading-relaxed max-w-xl mx-auto" style={{ color: LIGHT_MUTED }}>
          {copy}
        </p>
      )}
    </div>
  );
}

/* ══ Frame 1 · The invitation ═══════════════════════════════ */

function PortraitCard({ p, color, chip }: { p: { name: string; tag: string; avatar: string }; color: string; chip?: React.ReactNode }) {
  return (
    <div className="relative rounded-3xl px-4 py-7 text-center w-48" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
      {chip && <span className="absolute top-3.5 right-3.5">{chip}</span>}
      <span className="inline-block w-20 h-20 rounded-full overflow-hidden" style={{ border: `2.5px solid ${color}66` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar} alt="" className="w-full h-full object-cover" />
      </span>
      <p className="text-[15px] font-headline mt-3" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
      <p className="text-[9.5px] uppercase tracking-widest font-headline mt-0.5" style={{ color, fontWeight: 800 }}>{p.tag}</p>
    </div>
  );
}

function InvitationFrame({ phase }: { phase: number }) {
  const accepted = phase >= 1;
  return (
    <div className="w-full max-w-xl mx-auto">
      <StepHead kicker="Step 01 · The invitation" accent={CYAN_BRIGHT} title="Pick your complement." copy="One invitation starts a shared draft with the expert who completes what you teach." />

      {/* the invitation itself — centered, aligned */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
          <span className="shrink-0 w-9 h-9 rounded-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="text-left">
            <span className="block text-[13px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
              Alex invited you to co-create an experience!
            </span>
            <span className="relative block h-[20px] mt-1.5">
              <span
                className="absolute left-0 top-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800, opacity: accepted ? 0 : 1, transition: `opacity 220ms ease` }}
              >
                Invitation
              </span>
              <span
                className="absolute left-0 top-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800, opacity: accepted ? 1 : 0, transform: accepted ? "scale(1)" : "scale(0.8)", transition: `opacity ${POP_MS}ms ${EASE} 80ms, transform ${POP_MS}ms ${EASE} 80ms` }}
              >
                {CHECK(CYAN, 9)} Accepted
              </span>
            </span>
          </span>
        </div>
      </div>

      {/* the pair — one aligned row */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <PortraitCard
          p={ALEX}
          color={ORANGE}
          chip={
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-headline" style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800 }}>
              You
            </span>
          }
        />
        <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(156,240,255,0.12)", border: "1px solid rgba(156,240,255,0.35)" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN_BRIGHT} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <PortraitCard
          p={MIRA}
          color={CYAN}
          chip={
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-headline"
              style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800, opacity: accepted ? 1 : 0, transform: accepted ? "scale(1)" : "scale(0.7)", transition: `opacity ${POP_MS}ms ${EASE} 140ms, transform ${POP_MS}ms ${EASE} 140ms` }}
            >
              {CHECK(CYAN, 9)} Accepted
            </span>
          }
        />
      </div>
    </div>
  );
}

/* ══ Frame 2 · The workspace — actions revealed beat by beat ═ */

function WorkspaceFrame({ phase }: { phase: number }) {
  return (
    <div className="w-full max-w-3xl mx-auto origin-top [@media(max-height:820px)]:scale-[0.88] [@media(max-height:720px)]:scale-[0.78]">
      <StepHead kicker="Step 02 · The workspace" accent={ORANGE} title="Design it together." copy="A pre-structured experience to create inside — add a session, set the split, talk it through, right there." />

      <div className="grid md:grid-cols-[1.5fr_1fr] gap-4 items-start text-left">
        {/* the workspace */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <p className="text-[13.5px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, backgroundColor: "rgba(15,34,41,0.05)", fontWeight: 800 }}>
                Draft
              </span>
            </div>
            <div className="flex -space-x-1.5 shrink-0">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="relative w-6 h-6 rounded-full overflow-hidden" style={{ border: "2px solid #FFFFFF" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e", border: "1px solid #FFF" }} />
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
              <div className="rounded-2xl px-4 py-3 text-[13.5px] font-headline leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK, fontWeight: 700 }}>
                {EX.promise}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>The sessions</p>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ border: "1.5px dashed rgba(8,145,178,0.40)" }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[9px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                  <span className="relative shrink-0 w-14 h-10 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/landing/session-meet.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-headline leading-snug truncate" style={{ color: INK, fontWeight: 800 }}>Meet your Experts</span>
                    <span className="block text-[9px] font-bold mt-0.5" style={{ color: FAINT }}>Week 1 · Sun 13:00 · Alex &amp; Mira</span>
                  </span>
                </div>
                {/* beat: the session Mira just added */}
                <Pop show={phase >= 1} from="translateX(-22px)">
                  <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.25)" }}>
                    <span className="relative shrink-0 w-14 h-10 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/landing/session-nutrition.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-headline leading-snug truncate" style={{ color: INK, fontWeight: 800 }}>Nutrition Foundations &amp; Weekly Setup</span>
                      <span className="block text-[9px] font-bold mt-0.5" style={{ color: FAINT }}>Week 1 · Mon 13:00 · Mira</span>
                    </span>
                    <span className="shrink-0 text-[8px] uppercase tracking-widest font-headline" style={{ color: CYAN, fontWeight: 800 }}>Added ✓</span>
                  </div>
                </Pop>
              </div>
            </div>

            {/* beat: the split settles to the agreed 60/40 */}
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The team · revenue share</p>
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="flex -space-x-1.5 shrink-0">
                  {[{ a: ALEX.avatar, c: ORANGE }, { a: MIRA.avatar, c: CYAN }].map(({ a, c }) => (
                    <span key={a} className="w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${c}59`, backgroundColor: "#fff" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a} alt="" className="w-full h-full object-cover" />
                    </span>
                  ))}
                </span>
                <span className="relative flex-1 flex h-2.5 rounded-full overflow-hidden">
                  <span style={{ width: phase >= 2 ? `${EX.split.owner}%` : "50%", backgroundColor: ORANGE, transition: `width 600ms ${EASE}` }} />
                  <span style={{ flex: 1, backgroundColor: CYAN }} />
                </span>
                <span className="relative w-9 text-right">
                  <span className="absolute right-0 text-[10.5px] font-black font-headline tabular-nums" style={{ color: INK, opacity: phase >= 2 ? 0 : 1, transition: "opacity 200ms ease" }}>50/50</span>
                  <span className="text-[10.5px] font-black font-headline tabular-nums" style={{ color: INK, opacity: phase >= 2 ? 1 : 0, transition: "opacity 200ms ease 300ms" }}>60/40</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the team chat */}
        <div className="rounded-3xl p-4 md:mt-6" style={{ backgroundColor: "#FAF8F3", boxShadow: CARD_POP }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline" style={{ color: FAINT, fontWeight: 800 }}>Team chat</p>
            <span className="flex -space-x-1">
              {[ALEX.avatar, MIRA.avatar].map((a) => (
                <span key={a} className="w-[16px] h-[16px] rounded-full overflow-hidden" style={{ border: "1.5px solid #FAF8F3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a} alt="" className="w-full h-full object-cover" />
                </span>
              ))}
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3 py-2 text-[11.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                Added my nutrition sessions for weeks 1–3 ✓
              </div>
            </div>
            {/* beat: Alex closes the design */}
            <Pop show={phase >= 3} from="translateY(10px)">
              <div className="flex items-start gap-1.5 justify-end">
                <div className="rounded-2xl rounded-tr-md px-3 py-2 text-[11.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(255,97,48,0.08)", color: INK }}>
                  I think we are all set — I&apos;ll lock this for review!
                </div>
                <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                </span>
              </div>
            </Pop>
            <div className="rounded-full px-3.5 py-2 text-[10.5px]" style={{ backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
              Message your team…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Frame 3 · The agreement — the hero is the handshake ════ */

function AgreementFrame({ phase }: { phase: number }) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <StepHead kicker="Step 03 · The agreement" accent={CYAN_BRIGHT} title="Lock it. Review. Agree." copy="The whole design locks as one. Your partner reviews and agrees to exactly that." />

      <div className="flex flex-col items-center">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline" style={{ color: "#4ade80", backgroundColor: "rgba(74,222,128,0.12)", fontWeight: 800 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3.5" y="11" width="17" height="10" rx="2" />
            <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
          </svg>
          Locked for review
        </span>
        <p className="text-[16px] font-headline tracking-tight mt-2.5" style={{ color: LIGHT, fontWeight: 800 }}>{EX.title}</p>
        <p className="text-[9px] uppercase tracking-[0.18em] font-headline mt-0.5 mb-5" style={{ color: "rgba(244,241,232,0.5)", fontWeight: 800 }}>The whole design</p>

        {/* aligned, uniform rows */}
        <div className="w-full max-w-md space-y-2.5">
          {[`All ${EX.sessions} sessions — as designed`, "Ownership — as assigned", `Split — ${EX.split.owner} / ${EX.split.cohost}`].map((t) => (
            <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
              <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 13)}</span>
              <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{t}</span>
            </div>
          ))}
        </div>

        {/* beat: the hero — agreed by both, recorded */}
        <Pop show={phase >= 1} from="translateY(18px) scale(0.95)" className="w-full mt-6">
          <div className="rounded-3xl px-6 py-6 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 2px rgba(255,97,48,0.35), 0 30px 70px rgba(0,0,0,0.45)" }}>
            <p className="inline-flex items-center gap-2 text-[19px] md:text-[22px] font-headline tracking-tight" style={{ color: INK, fontWeight: 800 }}>
              <span style={{ color: "#16a34a" }}>{CHECK("#16a34a", 20)}</span> Agreed by both
            </p>
            <div className="grid grid-cols-2 gap-3.5 mt-4">
              {[
                { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp },
                { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp },
              ].map(({ p, color, action, stamp }) => (
                <div key={p.name} className="rounded-2xl px-4 py-3.5 text-left" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.07)" }}>
                  <p className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
                  <p className="text-[16px] leading-none mt-1.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>{p.name}</p>
                  <p className="text-[9.5px] font-bold mt-2 flex items-center gap-1" style={{ color }}>
                    {CHECK(color, 10)} Recorded · {stamp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Pop>
      </div>
    </div>
  );
}

/* ══ Frame 4 · The publish — your click, then everything ════ */

const HANDLED = [
  { t: "Sessions", d: "all 20 scheduled, live rooms ready" },
  { t: "Experience space", d: "open, waiting for your tribe" },
  { t: "Marketing page", d: "live on your link — checkout included" },
  { t: "Contract", d: "recorded & sealed — tamper-evident", fp: true },
  { t: "Revenue split", d: "armed for every sale, as agreed" },
];

function PublishFrame({ phase, onPublish }: { phase: number; onPublish: () => void }) {
  const published = phase >= 1;
  return (
    <div className="w-full max-w-3xl mx-auto origin-top [@media(max-height:820px)]:scale-[0.9] [@media(max-height:720px)]:scale-[0.8]">
      {/* two-state head, crisp swap */}
      <div className="relative mb-9" style={{ minHeight: 120 }}>
        <div className="absolute inset-x-0 top-0" style={{ opacity: published ? 0 : 1, transition: `opacity ${CUT_MS}ms ${EASE}` }}>
          <StepHead kicker="Step 04 · The publish" accent={ORANGE} title="All agreed. One move left." />
        </div>
        <div className="absolute inset-x-0 top-0" style={{ opacity: published ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 80ms` }}>
          <StepHead kicker="Step 04 · The publish" accent={ORANGE} title="One click from agreement to promotion." copy="INFITRA takes care of everything in between." />
        </div>
      </div>

      {/* state 1 — the CTA, yours */}
      <div className="relative" style={{ minHeight: 340 }}>
        <div
          className="absolute inset-0 flex flex-col items-center justify-start"
          style={{ opacity: published ? 0 : 1, transform: published ? "translateY(-14px)" : "none", transition: `opacity ${CUT_MS}ms ${EASE}, transform ${CUT_MS}ms ${EASE}`, pointerEvents: published ? "none" : "auto" }}
        >
          <div className="flex justify-center gap-2.5 mb-7">
            {[
              { label: `Locked by ${ALEX.first}`, color: ORANGE },
              { label: `Agreed by ${MIRA.first}`, color: CYAN },
            ].map(({ label, color }) => (
              <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9.5px] uppercase tracking-widest font-headline" style={{ color, backgroundColor: "#FFFFFF", fontWeight: 800, boxShadow: CARD_POP }}>
                {CHECK(color, 10)} {label}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onPublish}
            className="px-14 py-5 rounded-full text-white text-lg font-black font-headline transition-transform hover:scale-[1.05]"
            style={{ backgroundColor: ORANGE, boxShadow: "0 14px 44px rgba(255,97,48,0.55), 0 4px 14px rgba(255,97,48,0.35)" }}
          >
            Publish now!
          </button>
          <p className="text-[12px] mt-4" style={{ color: LIGHT_MUTED }}>Your move — or keep scrolling.</p>
        </div>

        {/* state 2 — everything in between */}
        <div
          className="absolute inset-0 grid md:grid-cols-[1.15fr_1fr] gap-5 items-center text-left"
          style={{ opacity: published ? 1 : 0, transition: `opacity ${CUT_MS}ms ${EASE} 100ms`, pointerEvents: published ? "auto" : "none" }}
        >
          <Pop show={published} d={150} from="translateY(20px) scale(0.97)">
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: CARD_POP }}>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ backgroundColor: "#E9E5DC" }}>
                <span className="flex gap-1.5 shrink-0">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.16)" }} />
                  ))}
                </span>
                <span className="flex-1 flex items-center rounded-full px-3 py-1 min-w-0" style={{ backgroundColor: "#FFFFFF" }}>
                  <span className="text-[10px] font-medium truncate" style={{ color: MUTED }}>infitra.fit/experiences/your-experience</span>
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline" style={{ backgroundColor: "rgba(22,163,74,0.10)", color: "#16a34a", fontWeight: 800 }}>
                  {CHECK("#16a34a", 9)} Published
                </span>
              </div>
              <MockBuyerCard />
            </div>
          </Pop>

          <div className="flex flex-col gap-2.5">
            {HANDLED.map(({ t, d, fp }, i) => (
              <Pop key={t} show={published} d={300 + i * CASCADE_MS} from="translateX(22px)">
                <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5" style={{ backgroundColor: "#FFFFFF", boxShadow: CARD_POP }}>
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: fp ? "rgba(8,145,178,0.10)" : "rgba(22,163,74,0.08)" }}>
                    {fp ? FINGERPRINT(CYAN, 12) : CHECK("#16a34a", 10)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{t}</span>
                    <span className="block text-[10px] font-semibold mt-0.5 leading-snug" style={{ color: MUTED }}>{d}</span>
                  </span>
                </div>
              </Pop>
            ))}
          </div>
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
        <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN_BRIGHT, fontWeight: 700 }}>
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
  const [beat, setBeat] = useState(0);
  const [pinned, setPinned] = useState(true);

  const frame = BEATS[beat].f;
  const phase = BEATS[beat].p;
  const isOutro = frame === 5;

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
      const pos = clamp01(-r.top / total) * TOTAL_W;

      // discrete beat
      let bi = BEATS.length - 1;
      for (let i = 0; i < BOUNDS.length; i++) {
        if (pos >= BOUNDS[i][0] && pos < BOUNDS[i][1]) {
          bi = i;
          break;
        }
      }
      setBeat((prev) => (prev === bi ? prev : bi));

      // smooth rail fill across the step span
      const sp = clamp01((pos - STEP_SPAN[0]) / (STEP_SPAN[1] - STEP_SPAN[0]));
      if (railFillRef.current) railFillRef.current.style.height = `${(sp * 100).toFixed(1)}%`;

      // the heartbeat draws with the outro's own scroll
      const [oa, ob] = BOUNDS[BOUNDS.length - 1];
      const draw = clamp01((pos - oa) / ((ob - oa) * 0.75));
      const outroNode = frameRefs.current[5];
      outroNode?.querySelectorAll<SVGPathElement>("[data-ecg]").forEach((p) => {
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
    window.scrollTo({ top: window.scrollY + r.top + (mid / TOTAL_W) * total, behavior: "smooth" });
  }

  if (!pinned) {
    return (
      <>
        <section className="px-4 sm:px-6 py-20" style={{ backgroundColor: TEAL }}>
          <div className="max-w-5xl mx-auto text-center">
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
          {/* crisp diagonal brand accents — the dark-mode wave, no fog */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: isOutro ? 0 : 1,
              transition: `opacity 450ms ${EASE}`,
              background:
                "linear-gradient(118deg, rgba(156,240,255,0) 22%, rgba(156,240,255,0.07) 38%, rgba(156,240,255,0) 55%), linear-gradient(295deg, rgba(255,97,48,0) 60%, rgba(255,97,48,0.09) 78%, rgba(255,97,48,0) 92%), radial-gradient(120% 90% at 50% 110%, rgba(6,18,22,0.55) 0%, rgba(6,18,22,0) 55%)",
            }}
          />

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

          {/* Frames — hard cuts, one visible at a time */}
          {[0, 1, 2, 3, 4, 5].map((f) => {
            const active = frame === f;
            return (
              <div
                key={f}
                ref={(el) => {
                  frameRefs.current[f] = el;
                }}
                aria-hidden={!active}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-60 lg:pr-16"
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
