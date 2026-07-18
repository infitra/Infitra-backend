"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, SectionHead } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW TO COLLABORATE ON INFITRA — the performed walkthrough.
 *
 * A pinned, scrubbed chapter the visitor EXPERIENCES: each step performs its
 * own easy action when it becomes active (the invite gets accepted, a session
 * slides in as it's added, the split nudges to 60/40, the agreement checks
 * itself and the signatures land) — and the publish is the visitor's OWN
 * click: an "All set." state with a real Publish button; pressing it (or
 * scrolling on — auto-publish fallback) cascades everything the platform
 * handles in that same click. The outro is a full-bleed heartbeat the scroll
 * itself draws — "Published. Now it comes alive." — handing off to the
 * experience act.
 *
 * Brand light: two soft cyan/orange glows drift and re-weight per step over
 * a near-cream stage; dominant elements sit in a white spotlight. Vignettes
 * are structured grids with offsets (alignment by construction), fragments
 * drift by depth with intra-step scroll.
 */

/* ── Feel constants — tune on deploy ───────────────────────── */
const SEG_VH = 115;
const INTRO_U = 0.7;
const OUTRO_U = 0.9; // a little longer — the heartbeat draw deserves dwell
const BAND = 0.16;
const SHIFT_PX = 38;
const ENTER_MS = 650; // choreography arrival duration
const AUTOPUBLISH_MS = 2200; // scrollers who don't click still get the moment
const CASCADE_MS = 140; // stagger between handled chips
const EASE_OUT = "cubic-bezier(.22,.61,.36,1)";

const WASHES = ["#F2EFE8", "#F4F0E7", "#F6F3EB", "#F3F1EA", "#F7F1E9", "#F2EFE8"];
/** Per-frame glow weights: [x%, y%, opacity] for the cyan and orange lights. */
const GLOWS: { c: [number, number, number]; o: [number, number, number] }[] = [
  { c: [25, 30, 0.5], o: [78, 72, 0.35] }, // intro
  { c: [74, 24, 0.55], o: [16, 82, 0.28] }, // invitation
  { c: [16, 30, 0.5], o: [84, 64, 0.45] }, // workspace
  { c: [70, 22, 0.5], o: [26, 84, 0.3] }, // agreement
  { c: [18, 76, 0.32], o: [72, 34, 0.6] }, // publish
  { c: [32, 52, 0.45], o: [68, 52, 0.45] }, // outro
];
const ACCENTS = [CYAN, ORANGE, CYAN, ORANGE];

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

/* ── Choreography helpers ──────────────────────────────────── */

/** Arrives when its step activates: opacity+transform with a delay chain.
 *  Inner layers keep parallax ([data-fdepth]) and static rotation separate
 *  so the three transforms never fight. */
function Frag({
  on,
  d = 0,
  from = "translateY(18px)",
  depth = 0,
  rot = 0,
  className,
  children,
}: {
  on: boolean;
  d?: number;
  from?: string;
  depth?: number;
  rot?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : from,
        transition: `opacity ${ENTER_MS}ms ${EASE_OUT} ${d}ms, transform ${ENTER_MS}ms ${EASE_OUT} ${d}ms`,
      }}
    >
      <div data-fdepth={depth || undefined} style={depth ? { willChange: "transform" } : undefined}>
        <div style={rot ? { transform: `rotate(${rot}deg)` } : undefined}>{children}</div>
      </div>
    </div>
  );
}

/** Soft white light behind a vignette's dominant element. */
function Spotlight() {
  return (
    <div
      aria-hidden
      className="absolute -inset-10 pointer-events-none"
      style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 62%)" }}
    />
  );
}

/* ── Shared cards ──────────────────────────────────────────── */

function PortraitCard({ p, color, chip, chipIcon }: { p: { name: string; tag: string; avatar: string }; color: string; chip: string; chipIcon: boolean }) {
  return (
    <div className="relative rounded-3xl px-4 py-6 text-center w-44" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${color}30`, boxShadow: "0 0 0 1px rgba(15,34,41,0.04), 0 18px 44px rgba(15,34,41,0.13)" }}>
      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-headline" style={{ color, backgroundColor: `${color}12`, fontWeight: 800 }}>
        {chipIcon && CHECK(color, 9)} {chip}
      </span>
      <span className="inline-block w-20 h-20 rounded-full overflow-hidden mt-1" style={{ border: `2.5px solid ${color}66`, boxShadow: `0 8px 24px ${color}2e` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.avatar} alt="" className="w-full h-full object-cover" />
      </span>
      <p className="text-[14px] font-headline mt-2.5" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
      <p className="text-[9px] uppercase tracking-widest font-headline mt-0.5" style={{ color, fontWeight: 800 }}>{p.tag}</p>
    </div>
  );
}

/* ══ Step 1 · The invitation — the invite gets accepted ═════ */

function InvitationVignette({ on }: { on: boolean; instant?: boolean }) {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* the mechanic: one invitation… */}
      <Frag on={on} d={250} from="translateY(-16px)" depth={26} className="flex justify-center mb-7">
        <div className="relative flex items-center gap-2.5 rounded-2xl px-4 py-3 rotate-[0.8deg]" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.14)" }}>
          <span className="shrink-0 w-9 h-9 rounded-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-[12.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
              Alex invited you to co-create
            </span>
            {/* …and it flips to accepted, performed */}
            <span className="relative block h-[18px] mt-1">
              <span
                className="absolute left-0 top-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                style={{ color: ORANGE, backgroundColor: "rgba(255,97,48,0.10)", fontWeight: 800, opacity: on ? 0 : 1, transition: `opacity 350ms ease ${on ? 1300 : 0}ms` }}
              >
                Invitation
              </span>
              <span
                className="absolute left-0 top-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800, opacity: on ? 1 : 0, transition: `opacity 350ms ease ${on ? 1400 : 0}ms` }}
              >
                {CHECK(CYAN, 9)} Accepted
              </span>
            </span>
          </span>
        </div>
      </Frag>

      {/* the pair */}
      <div className="relative flex items-center justify-center gap-4 sm:gap-7">
        <Spotlight />
        <Frag on={on} d={100} depth={10} rot={-2} className="relative">
          <PortraitCard p={ALEX} color={ORANGE} chip="You" chipIcon={false} />
        </Frag>
        <Frag on={on} d={400} from="scale(0.6)" depth={4} className="relative shrink-0">
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </Frag>
        <Frag on={on} d={220} depth={18} rot={2} className="relative">
          <PortraitCard p={MIRA} color={CYAN} chip="Accepted" chipIcon />
        </Frag>
      </div>
    </div>
  );
}

/* ══ Step 2 · The workspace — the actions, performed ════════ */

function WorkspaceVignette({ on }: { on: boolean; instant?: boolean }) {
  return (
    <div className="relative w-full max-w-3xl mx-auto origin-top [@media(max-height:820px)]:scale-[0.88] [@media(max-height:720px)]:scale-[0.78]">
      <Spotlight />
      <div className="relative grid md:grid-cols-[1.55fr_1fr] gap-4 items-start text-left">
        {/* the workspace plate — dominant */}
        <Frag on={on} d={0} depth={6} rot={-0.4}>
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 30px 80px rgba(15,34,41,0.14)" }}>
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
              {/* the promise */}
              <Frag on={on} d={200}>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
                  <div className="rounded-2xl px-4 py-3 text-[13.5px] font-headline leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK, fontWeight: 700 }}>
                    {EX.promise}
                  </div>
                </div>
              </Frag>

              {/* the sessions — one already there, one ADDED before your eyes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] uppercase tracking-[0.18em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>The sessions</p>
                  <Frag on={on} d={700} from="scale(0.85)">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ border: "1.5px dashed rgba(8,145,178,0.40)" }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="text-[9px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
                    </span>
                  </Frag>
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
                  {/* the just-added one */}
                  <Frag on={on} d={950} from="translateX(-26px) scale(0.97)">
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
                  </Frag>
                </div>
              </div>

              {/* the split — nudging itself to the agreed 60/40 */}
              <Frag on={on} d={500}>
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
                      <span style={{ width: on ? `${EX.split.owner}%` : "50%", backgroundColor: ORANGE, transition: `width 800ms ${EASE_OUT} 1400ms` }} />
                      <span style={{ flex: 1, backgroundColor: CYAN }} />
                    </span>
                    <span className="relative w-8 text-right">
                      <span className="text-[10.5px] font-black font-headline tabular-nums" style={{ color: INK, opacity: on ? 0 : 1, transition: "opacity 300ms ease 1400ms", position: "absolute", right: 0 }}>50/50</span>
                      <span className="text-[10.5px] font-black font-headline tabular-nums" style={{ color: INK, opacity: on ? 1 : 0, transition: "opacity 300ms ease 1700ms" }}>60/40</span>
                    </span>
                  </div>
                </div>
              </Frag>
            </div>
          </div>
        </Frag>

        {/* the team chat — beside the work, replying live */}
        <Frag on={on} d={350} depth={22} rot={0.7} className="md:-ml-5 md:mt-8">
          <div className="rounded-3xl p-4" style={{ backgroundColor: "#FAF8F3", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 22px 54px rgba(15,34,41,0.12)" }}>
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
              <Frag on={on} d={1700} from="translateY(10px) scale(0.96)">
                <div className="flex items-start gap-1.5 justify-end">
                  <div className="rounded-2xl rounded-tr-md px-3 py-2 text-[11.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(255,97,48,0.08)", color: INK }}>
                    Looks strong — locking tonight 🚀
                  </div>
                  <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                </div>
              </Frag>
              <div className="rounded-full px-3.5 py-2 text-[10.5px]" style={{ backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
                Message your team…
              </div>
            </div>
          </div>
        </Frag>
      </div>
    </div>
  );
}

/* ══ Step 3 · The agreement — checks itself, stamps land ════ */

function AgreementVignette({ on }: { on: boolean; instant?: boolean }) {
  const rows = [
    { t: `All ${EX.sessions} sessions — as designed`, d: 350, off: "-translate-x-3", rot: -0.6 },
    { t: "Ownership — as assigned", d: 600, off: "translate-x-4", rot: 0.6 },
    { t: `Split — ${EX.split.owner} / ${EX.split.cohost}`, d: 850, off: "-translate-x-2", rot: -0.4 },
  ];
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <Spotlight />
      <div className="relative flex flex-col items-center">
        <Frag on={on} d={100} from="scale(0.8)" depth={6}>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.09)", fontWeight: 800, boxShadow: "0 8px 24px rgba(15,34,41,0.10)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3.5" y="11" width="17" height="10" rx="2" />
              <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
            </svg>
            Locked as one
          </span>
        </Frag>
        <Frag on={on} d={200} depth={10} className="mt-3 mb-6 text-center">
          <p className="text-[17px] font-headline tracking-tight" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline mt-0.5" style={{ color: FAINT, fontWeight: 800 }}>The whole design</p>
        </Frag>

        <div className="w-full max-w-md space-y-2.5">
          {rows.map(({ t, d, off, rot }) => (
            <Frag key={t} on={on} d={d} depth={14 + d / 60} rot={rot} className={off}>
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.11)" }}>
                <span className="shrink-0 flex" style={{ color: CYAN, transform: on ? "scale(1)" : "scale(0)", transition: `transform 380ms ${EASE_OUT} ${d + 320}ms` }}>
                  {CHECK(CYAN, 13)}
                </span>
                <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{t}</span>
              </div>
            </Frag>
          ))}
        </div>

        <div className="flex gap-5 mt-7">
          {[
            { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp, d: 1350, rot: -3.5 },
            { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp, d: 1650, rot: 2.5 },
          ].map(({ p, color, action, stamp, d, rot }) => (
            <Frag key={p.name} on={on} d={d} from="translateY(-22px) scale(1.08) rotate(-7deg)" depth={26} rot={rot}>
              <div className="rounded-2xl px-4 py-3 text-left w-52" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(15,34,41,0.08), 0 18px 44px rgba(15,34,41,0.16)" }}>
                <p className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
                <p className="text-[15px] leading-none mt-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>{p.name}</p>
                <p className="text-[8.5px] font-semibold mt-1.5 flex items-center gap-1" style={{ color }}>
                  {CHECK(color, 9)} Recorded · {stamp}
                </p>
              </div>
            </Frag>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══ Step 4 · The publish — YOUR click, everything handled ══ */

const HANDLED = [
  { t: "Marketing page", d: "live on your link — ready to promote" },
  { t: "Checkout", d: "Stripe payments, in CHF" },
  { t: "Contract", d: "recorded & sealed — tamper-evident", fp: true },
  { t: "Revenue split", d: "armed for every sale, as agreed" },
  { t: "Sessions", d: "all 20 scheduled, rooms ready" },
  { t: "Tribe space", d: "open, waiting for members" },
];

function PublishVignette({ on, instant = false }: { on: boolean; instant?: boolean }) {
  const [published, setPublished] = useState(instant);

  useEffect(() => {
    if (!on || published) return;
    const t = setTimeout(() => setPublished(true), AUTOPUBLISH_MS);
    return () => clearTimeout(t);
  }, [on, published]);

  return (
    <div className="relative w-full max-w-3xl mx-auto min-h-[430px] origin-top [@media(max-height:820px)]:scale-[0.88] [@media(max-height:720px)]:scale-[0.78]">
      <Spotlight />

      {/* READY — all set, one click left (the visitor's click) */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ opacity: published ? 0 : 1, transform: published ? "translateY(-18px)" : "none", transition: `opacity 450ms ${EASE_OUT}, transform 450ms ${EASE_OUT}`, pointerEvents: published ? "none" : "auto" }}
      >
        <Frag on={on} d={100}>
          <div className="rounded-3xl px-8 py-7 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.05), 0 30px 80px rgba(15,34,41,0.15)" }}>
            <p className="text-[10px] uppercase tracking-[0.2em] font-headline" style={{ color: "#16a34a", fontWeight: 800 }}>All set</p>
            <p className="text-[19px] font-headline tracking-tight mt-1.5" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
            <div className="flex justify-center gap-2 mt-3.5">
              {[
                { label: `Locked by ${ALEX.first}`, color: ORANGE },
                { label: `Agreed by ${MIRA.first}`, color: CYAN },
              ].map(({ label, color }) => (
                <span key={label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color, backgroundColor: `${color}10`, fontWeight: 800 }}>
                  {CHECK(color, 9)} {label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPublished(true)}
              className="mt-6 px-11 py-4 rounded-full text-white text-[15px] font-black font-headline transition-transform hover:scale-[1.04]"
              style={{ backgroundColor: ORANGE, boxShadow: "0 10px 32px rgba(255,97,48,0.45), 0 3px 10px rgba(255,97,48,0.30)" }}
            >
              Publish experience →
            </button>
            <p className="text-[11px] mt-3" style={{ color: FAINT }}>One click. Everything else is handled.</p>
          </div>
        </Frag>
      </div>

      {/* PUBLISHED — the same click did all of this */}
      <div
        className="absolute inset-0 grid md:grid-cols-[1.2fr_1fr] gap-5 items-center"
        style={{ opacity: published ? 1 : 0, transition: `opacity 500ms ${EASE_OUT} 150ms`, pointerEvents: published ? "auto" : "none" }}
      >
        <Frag on={published} d={200} from="translateY(24px) scale(0.97)" depth={8} rot={-1}>
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.07), 0 30px 80px rgba(15,34,41,0.18)" }}>
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
        </Frag>

        <div className="flex flex-col gap-2.5">
          {HANDLED.map(({ t, d, fp }, i) => (
            <Frag key={t} on={published} d={350 + i * CASCADE_MS} from="translateX(26px)" depth={16 + i * 4} className={i % 2 ? "translate-x-2" : "-translate-x-1"}>
              <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 14px 36px rgba(15,34,41,0.12)" }}>
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: fp ? "rgba(8,145,178,0.10)" : "rgba(22,163,74,0.08)" }}>
                  {fp ? FINGERPRINT(CYAN, 12) : CHECK("#16a34a", 10)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{t}</span>
                  <span className="block text-[9.5px] font-semibold mt-0.5 leading-snug" style={{ color: MUTED }}>{d}</span>
                </span>
              </div>
            </Frag>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Frames plan ───────────────────────────────────────────── */

type StepDef = { label: string; title: string; copy: string; Vig: (p: { on: boolean; instant?: boolean }) => React.ReactNode };
const STEPS: StepDef[] = [
  { label: "The invitation", title: "Pick your complement.", copy: "One invitation starts a shared draft with the expert who completes what you teach.", Vig: InvitationVignette },
  { label: "The workspace", title: "Design it together.", copy: "A pre-structured experience to create inside — add a session, set the split, talk it through, right there.", Vig: WorkspaceVignette },
  { label: "The agreement", title: "Lock it. Agree. Recorded.", copy: "The whole design locks as one. Your partner agrees to exactly that — every step recorded.", Vig: AgreementVignette },
  { label: "The publish", title: "From publishing to promoting in one click.", copy: "Everything's agreed. The last move is yours.", Vig: PublishVignette },
];

const UNITS = [INTRO_U, 1, 1, 1, 1, OUTRO_U];
const U_TOTAL = UNITS.reduce((a, b) => a + b, 0);
const BOUNDS: [number, number][] = (() => {
  const out: [number, number][] = [];
  let acc = 0;
  for (const u of UNITS) {
    out.push([acc, acc + u]);
    acc += u;
  }
  return out;
})();

function IntroFrame() {
  return (
    <div>
      <SectionHead eyebrow="How it works" title="How to collaborate on INFITRA." sub="Four moves. Everything else is handled." />
      <div className="flex justify-center -mt-6" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

/** The heartbeat — drawn by the visitor's scroll, full-bleed. */
function OutroFrame({ instant = false }: { instant?: boolean }) {
  return (
    <div className="w-full">
      <p className="text-3xl md:text-5xl font-headline tracking-tight leading-[1.12] text-center" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Published.
        <br />
        <span style={{ color: ORANGE }}>Now it comes alive.</span>
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
          {/* soft under-glow */}
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

function StepHead({ i }: { i: number }) {
  const s = STEPS[i];
  return (
    <div className="mb-8">
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: ACCENTS[i], fontWeight: 800 }}>
        Step 0{i + 1} · {s.label}
      </p>
      <h3 className="text-2xl md:text-4xl font-headline tracking-tight mb-3 max-w-2xl mx-auto" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {s.title}
      </h3>
      <p className="text-[15px] md:text-lg leading-relaxed max-w-xl mx-auto" style={{ color: MUTED }}>
        {s.copy}
      </p>
    </div>
  );
}

/* ── The chapter ───────────────────────────────────────────── */

export function HowItWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(-1); // -1 intro · 0..3 · 4 outro
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerHeight < 600) {
      const raf0 = requestAnimationFrame(() => setPinned(false));
      return () => cancelAnimationFrame(raf0);
    }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = wrapperRef.current;
      const stage = stageRef.current;
      if (!el || !stage) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const pos = clamp01(-r.top / total) * U_TOTAL;

      let washIdx = UNITS.length - 1;
      for (let i = 0; i < BOUNDS.length; i++) {
        const [a, b] = BOUNDS[i];
        if (pos >= a && pos < b) washIdx = i;
        const node = frameRefs.current[i];
        if (!node) continue;
        const inV = i === 0 ? 1 : clamp01((pos - (a - BAND)) / (2 * BAND));
        const outV = i === BOUNDS.length - 1 ? 1 : clamp01((b + BAND - pos) / (2 * BAND));
        const v = Math.min(inV, outV);
        const dir = pos < (a + b) / 2 ? 1 : -1;
        node.style.opacity = v.toFixed(3);
        node.style.transform = `translateY(${((1 - v) * SHIFT_PX * dir).toFixed(1)}px)`;
        node.style.pointerEvents = v > 0.55 ? "auto" : "none";
        node.setAttribute("aria-hidden", v < 0.5 ? "true" : "false");
        const local = clamp01((pos - a) / (b - a));
        node.querySelectorAll<HTMLElement>("[data-fdepth]").forEach((fr) => {
          const d = Number(fr.dataset.fdepth || 0);
          if (d) fr.style.transform = `translateY(${((local - 0.5) * d).toFixed(1)}px)`;
        });
        // the heartbeat draws with the outro's own scroll
        if (i === BOUNDS.length - 1) {
          const draw = clamp01(local / 0.8);
          node.querySelectorAll<SVGPathElement>("[data-ecg]").forEach((p) => {
            p.style.strokeDashoffset = String(1 - draw);
          });
        }
      }

      stage.style.backgroundColor = WASHES[washIdx];
      const sp = clamp01((pos - INTRO_U) / STEPS.length);
      if (railFillRef.current) railFillRef.current.style.height = `${(sp * 100).toFixed(1)}%`;
      const stepIdx = pos < INTRO_U ? -1 : pos >= INTRO_U + STEPS.length ? 4 : Math.floor(pos - INTRO_U);
      setActiveStep((prev) => (prev === stepIdx ? prev : stepIdx));
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

  function jumpTo(i: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + r.top + ((INTRO_U + i + 0.5) / U_TOTAL) * total, behavior: "smooth" });
  }

  const glow = GLOWS[activeStep + 1] ?? GLOWS[0];

  if (!pinned) {
    return (
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <SectionHead eyebrow="How it works" title="How to collaborate on INFITRA." sub="Four moves. Everything else is handled." />
          {STEPS.map((s, i) => (
            <div key={s.label} className="py-12">
              <StepHead i={i} />
              <s.Vig on instant />
            </div>
          ))}
          <div className="py-12">
            <OutroFrame instant />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div ref={wrapperRef} className="relative" style={{ height: `${U_TOTAL * SEG_VH}vh` }}>
        <div
          ref={stageRef}
          className="sticky top-0 w-full overflow-hidden h-screen"
          style={{ height: "100dvh", backgroundColor: WASHES[0], transition: "background-color 700ms ease" }}
        >
          {/* ── the brand light — two glows re-weighting per step ── */}
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "72vmin",
              height: "72vmin",
              left: `${glow.c[0]}%`,
              top: `${glow.c[1]}%`,
              opacity: glow.c[2],
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, rgba(156,240,255,0.55) 0%, rgba(8,145,178,0.18) 38%, rgba(8,145,178,0) 68%)",
              transition: "left 900ms ease, top 900ms ease, opacity 900ms ease",
            }}
          />
          <div
            aria-hidden
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "68vmin",
              height: "68vmin",
              left: `${glow.o[0]}%`,
              top: `${glow.o[1]}%`,
              opacity: glow.o[2],
              transform: "translate(-50%,-50%)",
              background: "radial-gradient(circle, rgba(255,175,140,0.5) 0%, rgba(255,97,48,0.16) 40%, rgba(255,97,48,0) 68%)",
              transition: "left 900ms ease, top 900ms ease, opacity 900ms ease",
            }}
          />

          {/* Rail — desktop */}
          <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-5" style={{ opacity: activeStep >= 0 && activeStep <= 3 ? 1 : 0.25, transition: "opacity 500ms ease" }}>
            <div className="relative w-px rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.12)" }}>
              <div ref={railFillRef} className="absolute top-0 left-0 w-px rounded-full" style={{ height: "0%", backgroundColor: ORANGE }} />
            </div>
            <div className="flex flex-col justify-between gap-8 py-0.5">
              {STEPS.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => jumpTo(i)}
                  className="flex items-center gap-3 text-left transition-opacity duration-300"
                  style={{ opacity: activeStep === i ? 1 : 0.38 }}
                >
                  <span className="shrink-0 w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: activeStep === i ? ORANGE : "rgba(15,34,41,0.25)" }} />
                  <span className="min-w-0">
                    <span className="block text-[9.5px] uppercase tracking-widest font-headline" style={{ color: activeStep === i ? ACCENTS[i] : FAINT, fontWeight: 800 }}>
                      0{i + 1}
                    </span>
                    <span className="block text-[13px] font-headline leading-tight whitespace-nowrap" style={{ color: INK, fontWeight: 700 }}>
                      {s.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Progress dots — mobile */}
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: activeStep >= 0 && activeStep <= 3 ? 1 : 0, transition: "opacity 400ms ease" }}>
            {STEPS.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: activeStep === i ? 18 : 6, backgroundColor: activeStep === i ? ORANGE : "rgba(15,34,41,0.18)" }} />
            ))}
          </div>

          {/* Frames: intro · steps · outro */}
          {[-1, 0, 1, 2, 3, 4].map((f, idx) => (
            <div
              key={idx}
              ref={(el) => {
                frameRefs.current[idx] = el;
              }}
              aria-hidden={idx !== 0}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-60 lg:pr-16"
              style={{ opacity: idx === 0 ? 1 : 0, pointerEvents: idx === 0 ? "auto" : "none", willChange: "opacity, transform" }}
            >
              <div className="w-full max-w-5xl mx-auto">
                {f === -1 && <IntroFrame />}
                {f >= 0 && f <= 3 && (
                  <>
                    <StepHead i={f} />
                    {(() => {
                      const V = STEPS[f].Vig;
                      return <V on={activeStep === f} />;
                    })()}
                  </>
                )}
                {f === 4 && <OutroFrame />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
