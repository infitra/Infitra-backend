"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, SectionHead } from "./ui";
import { Frag, Plate, Skel } from "./vignette";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW TO COLLABORATE ON INFITRA — the scrubbed pinned chapter.
 *
 * One tall runway, one full-viewport sticky stage. SIX frames live inside
 * the sequence — intro (the chapter title itself), four steps, outro
 * ("Published. Now it comes alive." handing off to the next act) — and all
 * motion is a PURE FUNCTION of scroll: frames crossfade in bands around
 * their boundaries, fragments drift by depth with intra-frame progress.
 * Reversible, native scroll only, zero dependencies.
 *
 * Steps are VIGNETTES, not screenshots: real UI atoms at landing scale,
 * layered over abstracted plates (the vignette language in ./vignette).
 */

/* ── Feel constants — tune on deploy ───────────────────────── */
const SEG_VH = 115; // runway per unit (one step = 1 unit)
const INTRO_U = 0.7; // intro frame's units
const OUTRO_U = 0.7; // outro frame's units
const BAND = 0.16; // crossfade half-band around boundaries (units)
const SHIFT_PX = 38; // max translate during a crossfade
/** Stage washes: intro/outro match the page cream so pin entry/exit are
 *  seamless; steps shift subtly. */
const WASHES = ["#F2EFE8", "#F5F1E8", "#FAF8F2", "#F3F5F4", "#FAF0E8", "#F2EFE8"];

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

/* ── Shared fragment cards ─────────────────────────────────── */

function PortraitCard({
  p,
  color,
  chip,
  chipIcon,
}: {
  p: { name: string; tag: string; avatar: string };
  color: string;
  chip: string;
  chipIcon: boolean;
}) {
  return (
    <div className="relative rounded-3xl px-4 py-6 text-center w-44" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${color}30`, boxShadow: "0 0 0 1px rgba(15,34,41,0.04), 0 18px 44px rgba(15,34,41,0.13)" }}>
      <span
        className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] uppercase tracking-widest font-headline"
        style={{ color, backgroundColor: `${color}12`, fontWeight: 800 }}
      >
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

function SessionCardFrag({ w = "w-[21rem]" }: { w?: string }) {
  return (
    <div className={`${w} max-w-full rounded-2xl overflow-hidden text-left`} style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.13)" }}>
      <div className="relative aspect-[16/7]" style={{ backgroundColor: INK }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/session-meet.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="px-3.5 py-2.5">
        <p className="text-[12.5px] font-headline leading-snug" style={{ color: INK, fontWeight: 800 }}>Meet your Experts</p>
        <p className="text-[9.5px] font-bold mt-0.5" style={{ color: FAINT }}>Week 1 · Sun 13:00 · 45 min · Alex &amp; Mira</p>
      </div>
    </div>
  );
}

function ChatClusterFrag() {
  return (
    <div className="w-[15.5rem] max-w-full space-y-2 text-left">
      <div className="flex items-start gap-1.5">
        <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5" style={{ boxShadow: "0 2px 8px rgba(15,34,41,0.18)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
        </span>
        <div className="rounded-2xl rounded-tl-md px-3 py-2 text-[11.5px] font-medium leading-snug" style={{ backgroundColor: "#FFFFFF", color: INK, boxShadow: "0 0 0 1px rgba(8,145,178,0.18), 0 12px 30px rgba(15,34,41,0.12)" }}>
          Added my nutrition sessions for weeks 1–3 ✓
        </div>
      </div>
      <div className="flex items-start gap-1.5 justify-end">
        <div className="rounded-2xl rounded-tr-md px-3 py-2 text-[11.5px] font-medium leading-snug" style={{ backgroundColor: "#FFFFFF", color: INK, boxShadow: "0 0 0 1px rgba(255,97,48,0.20), 0 12px 30px rgba(15,34,41,0.12)" }}>
          Looks strong — locking tonight 🚀
        </div>
        <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5" style={{ boxShadow: "0 2px 8px rgba(15,34,41,0.18)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
        </span>
      </div>
    </div>
  );
}

function HandledChip({ t, d, fp }: { t: string; d: string; fp?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl px-3 py-2.5 w-48 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 14px 36px rgba(15,34,41,0.13)" }}>
      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: fp ? "rgba(8,145,178,0.10)" : "rgba(22,163,74,0.08)" }}>
        {fp ? FINGERPRINT(CYAN, 12) : CHECK("#16a34a", 10)}
      </span>
      <span className="min-w-0">
        <span className="block text-[11.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{t}</span>
        <span className="block text-[9.5px] font-semibold mt-0.5 leading-snug" style={{ color: MUTED }}>{d}</span>
      </span>
    </div>
  );
}

/* ── Step vignettes (collage on sm+, stacked simple on mobile) ── */

function InvitationVignette() {
  return (
    <>
      {/* collage */}
      <div className="hidden sm:block relative w-full max-w-2xl mx-auto h-[400px] origin-top [@media(max-height:800px)]:scale-[0.85] [@media(max-height:700px)]:scale-[0.74]">
        <Frag depth={12} className="left-[26%] top-[54%] -translate-x-1/2 -translate-y-1/2" style={{ transform: "translate(-50%,-50%) rotate(-2deg)" }}>
          <PortraitCard p={ALEX} color={ORANGE} chip="You" chipIcon={false} />
        </Frag>
        <Frag depth={22} className="left-[74%] top-[58%]" style={{ transform: "translate(-50%,-50%) rotate(2deg)" }}>
          <PortraitCard p={MIRA} color={CYAN} chip="Accepted" chipIcon />
        </Frag>
        <Frag depth={4} className="left-1/2 top-[56%]" style={{ transform: "translate(-50%,-50%)" }}>
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)", backdropFilter: "blur(4px)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </Frag>
        {/* the mechanic, isolated: the invitation itself */}
        <Frag depth={34} className="left-[64%] top-[8%]" style={{ transform: "translate(-50%,0) rotate(1.5deg)" }}>
          <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 w-[17rem]" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.15)" }}>
            <span className="shrink-0 w-8 h-8 rounded-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-[11.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
                Alex invited you to co-create
              </span>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: CYAN, backgroundColor: "rgba(8,145,178,0.10)", fontWeight: 800 }}>
                {CHECK(CYAN, 9)} Accepted
              </span>
            </span>
          </div>
        </Frag>
      </div>
      {/* mobile stacked */}
      <div className="sm:hidden flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <PortraitCard p={ALEX} color={ORANGE} chip="You" chipIcon={false} />
          <PortraitCard p={MIRA} color={CYAN} chip="Accepted" chipIcon />
        </div>
      </div>
    </>
  );
}

function WorkspaceVignette() {
  return (
    <>
      <div className="hidden sm:block relative w-full max-w-3xl mx-auto h-[460px] origin-top [@media(max-height:820px)]:scale-[0.85] [@media(max-height:720px)]:scale-[0.74]">
        {/* the abstracted workspace */}
        <Plate className="left-[4%] right-[10%] top-[4%] bottom-[10%]">
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
          <div className="px-5 pt-4 space-y-3">
            <Skel w="34%" />
            <Skel w="58%" />
            <Skel w="46%" />
          </div>
        </Plate>

        {/* the real atoms, enlarged */}
        <Frag depth={10} className="left-[31%] top-[24%] w-[min(23rem,56%)]" style={{ transform: "translate(-50%,0) rotate(-0.8deg)" }}>
          <div className="rounded-2xl px-4 py-3.5 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.12)" }}>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
            <p className="text-[13.5px] font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>{EX.promise}</p>
          </div>
        </Frag>
        <Frag depth={22} className="left-[31%] top-[52%]" style={{ transform: "translate(-50%,0)" }}>
          <SessionCardFrag />
        </Frag>
        <Frag depth={30} className="left-[28%] top-[86%]" style={{ transform: "translate(-50%,0) rotate(-1deg)" }}>
          <div className="flex items-center gap-1.5 rounded-full px-4 py-2" style={{ border: "1.5px dashed rgba(8,145,178,0.40)", backgroundColor: "rgba(255,255,255,0.85)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[10.5px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
          </div>
        </Frag>
        <Frag depth={16} className="left-[78%] top-[26%] w-[min(15.5rem,38%)]" style={{ transform: "translate(-50%,0) rotate(1.2deg)" }}>
          <div className="rounded-2xl p-3 space-y-2 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 18px 44px rgba(15,34,41,0.12)" }}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Who owns what</p>
            {[
              { p: ALEX, color: ORANGE, role: "Owner" },
              { p: MIRA, color: CYAN, role: "Co-host" },
            ].map(({ p, color, role }) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <span className="text-[11px] font-headline" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                <span className="text-[8px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 800 }}>{role}</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                  {p.topics[0]}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[8px] uppercase tracking-widest font-headline shrink-0" style={{ color: FAINT, fontWeight: 800 }}>Split</span>
              <span className="flex-1 flex h-2 rounded-full overflow-hidden">
                <span style={{ width: `${EX.split.owner}%`, backgroundColor: ORANGE }} />
                <span style={{ width: `${EX.split.cohost}%`, backgroundColor: CYAN }} />
              </span>
              <span className="text-[9.5px] font-black font-headline shrink-0" style={{ color: INK }}>{EX.split.owner}/{EX.split.cohost}</span>
            </div>
          </div>
        </Frag>
        <Frag depth={34} className="left-[80%] top-[66%]" style={{ transform: "translate(-50%,0) rotate(-1deg)" }}>
          <ChatClusterFrag />
        </Frag>
      </div>
      {/* mobile stacked */}
      <div className="sm:hidden flex flex-col items-center gap-3">
        <div className="rounded-2xl px-4 py-3 text-left w-full" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 12px 30px rgba(15,34,41,0.10)" }}>
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
          <p className="text-[13px] font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>{EX.promise}</p>
        </div>
        <SessionCardFrag w="w-full" />
        <ChatClusterFrag />
      </div>
    </>
  );
}

function AgreementVignette() {
  const rows = [
    { t: `All ${EX.sessions} sessions — as designed`, x: "46%", y: "34%", d: 14, r: -0.6 },
    { t: "Ownership — as assigned", x: "53%", y: "50%", d: 20, r: 0.6 },
    { t: `Split — ${EX.split.owner} / ${EX.split.cohost}`, x: "48%", y: "66%", d: 26, r: -1 },
  ];
  return (
    <>
      <div className="hidden sm:block relative w-full max-w-2xl mx-auto h-[430px] origin-top [@media(max-height:800px)]:scale-[0.85] [@media(max-height:700px)]:scale-[0.74]">
        <Frag depth={6} className="left-1/2 top-[2%]" style={{ transform: "translate(-50%,0)" }}>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.09)", fontWeight: 800, boxShadow: "0 8px 24px rgba(15,34,41,0.10)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3.5" y="11" width="17" height="10" rx="2" />
              <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
            </svg>
            Locked as one
          </span>
        </Frag>
        <Frag depth={10} className="left-1/2 top-[12%] w-full" style={{ transform: "translate(-50%,0)" }}>
          <p className="text-[16px] font-headline tracking-tight" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline mt-0.5" style={{ color: FAINT, fontWeight: 800 }}>The whole design</p>
        </Frag>
        {rows.map(({ t, x, y, d, r }) => (
          <Frag key={t} depth={d} className={`w-[min(21rem,74%)]`} style={{ left: x, top: y, transform: `translate(-50%,0) rotate(${r}deg)` }}>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06), 0 16px 40px rgba(15,34,41,0.12)" }}>
              <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 13)}</span>
              <span className="text-[13px] font-bold font-headline" style={{ color: INK }}>{t}</span>
            </div>
          </Frag>
        ))}
        {[
          { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp, x: "29%", y: "82%", d: 30, r: -4 },
          { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp, x: "71%", y: "85%", d: 36, r: 3 },
        ].map(({ p, color, action, stamp, x, y, d, r }) => (
          <Frag key={p.name} depth={d} style={{ left: x, top: y, transform: `translate(-50%,0) rotate(${r}deg)` }}>
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
      {/* mobile stacked */}
      <div className="sm:hidden flex flex-col items-center gap-2.5 w-full">
        {rows.map(({ t }) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 w-full" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.06)" }}>
            <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 12)}</span>
            <span className="text-[12px] font-bold font-headline text-left" style={{ color: INK }}>{t}</span>
          </div>
        ))}
        <div className="flex gap-2.5 mt-1">
          {[
            { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp },
            { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp },
          ].map(({ p, color, action, stamp }) => (
            <div key={p.name} className="rounded-2xl px-3 py-2.5 text-left flex-1" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
              <p className="text-[8px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
              <p className="text-[13px] leading-none mt-1" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: INK }}>{p.name}</p>
              <p className="text-[8px] font-semibold mt-1" style={{ color }}>Recorded · {stamp}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PublishVignette() {
  const chips = [
    { t: "Marketing page", d: "live on your link — ready to promote", x: "76%", y: "6%", dep: 20, r: 1.5 },
    { t: "Checkout", d: "Stripe payments, in CHF", x: "86%", y: "30%", dep: 28, r: -1 },
    { t: "Contract", d: "recorded & sealed — tamper-evident", x: "81%", y: "54%", dep: 34, r: 1, fp: true },
    { t: "Revenue split", d: "armed for every sale, as agreed", x: "74%", y: "78%", dep: 40, r: -1.5 },
    { t: "Sessions", d: "all 20 scheduled, rooms ready", x: "22%", y: "5%", dep: 24, r: -2 },
    { t: "Tribe space", d: "open, waiting for members", x: "18%", y: "82%", dep: 30, r: 1 },
  ] as const;
  return (
    <>
      <div className="hidden sm:block relative w-full max-w-3xl mx-auto h-[470px] origin-top [@media(max-height:840px)]:scale-[0.85] [@media(max-height:730px)]:scale-[0.74]">
        <Frag depth={8} className="left-[42%] top-1/2 w-[min(23rem,56%)]" style={{ transform: "translate(-50%,-50%) rotate(-1.2deg)" }}>
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.07), 0 30px 80px rgba(15,34,41,0.18)" }}>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5" style={{ backgroundColor: "#E9E5DC" }}>
              <span className="flex gap-1.5 shrink-0">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.16)" }} />
                ))}
              </span>
              <span className="flex-1 flex items-center gap-1.5 rounded-full px-3 py-1 min-w-0" style={{ backgroundColor: "#FFFFFF" }}>
                <span className="text-[10px] font-medium truncate" style={{ color: MUTED }}>infitra.fit/experiences/your-experience</span>
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline" style={{ backgroundColor: "rgba(22,163,74,0.10)", color: "#16a34a", fontWeight: 800 }}>
                {CHECK("#16a34a", 9)} Published
              </span>
            </div>
            <MockBuyerCard />
          </div>
        </Frag>
        {chips.map((c) => (
          <Frag key={c.t} depth={c.dep} style={{ left: c.x, top: c.y, transform: `translate(-50%,0) rotate(${c.r}deg)` }}>
            <HandledChip t={c.t} d={c.d} fp={"fp" in c && c.fp} />
          </Frag>
        ))}
      </div>
      {/* mobile stacked */}
      <div className="sm:hidden flex flex-col items-center gap-3 w-full">
        <div className="rounded-2xl overflow-hidden w-full" style={{ boxShadow: "0 0 0 1px rgba(15,34,41,0.07), 0 20px 50px rgba(15,34,41,0.15)" }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: "#E9E5DC" }}>
            <span className="flex-1 rounded-full px-3 py-1 text-[10px] font-medium truncate" style={{ backgroundColor: "#FFFFFF", color: MUTED }}>
              infitra.fit/experiences/your-experience
            </span>
          </div>
          <MockBuyerCard />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {chips.slice(0, 4).map((c) => (
            <HandledChip key={c.t} t={c.t} d={c.d} fp={"fp" in c && c.fp} />
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Frame plan ────────────────────────────────────────────── */

type StepDef = { label: string; title: string; copy: string; Vig: () => React.ReactNode };
const STEPS: StepDef[] = [
  {
    label: "The invitation",
    title: "Pick your complement.",
    copy: "One invitation starts a shared draft with the expert who completes what you teach.",
    Vig: InvitationVignette,
  },
  {
    label: "The workspace",
    title: "Design it together.",
    copy: "A pre-structured experience to create inside — your sessions, your parameters, who owns what — with the team chat right beside it.",
    Vig: WorkspaceVignette,
  },
  {
    label: "The agreement",
    title: "Lock it. Agree. Recorded.",
    copy: "The whole design locks as one — sessions, ownership, split. Your partner reviews and agrees. Every step recorded.",
    Vig: AgreementVignette,
  },
  {
    label: "The publish",
    title: "From publishing to promoting in one click.",
    copy: "One publish and it's out in the world — everything around it handled in the same click.",
    Vig: PublishVignette,
  },
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

function OutroFrame() {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-5xl font-headline tracking-tight leading-[1.12]" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Published.
        <br />
        <span style={{ color: ORANGE }}>Now it comes alive.</span>
      </p>
      <div className="mt-10 flex items-center justify-center" aria-hidden>
        <svg viewBox="0 0 600 80" className="w-full max-w-xl h-10 md:h-14" fill="none">
          <path d="M 0 40 L 600 40" stroke="rgba(15,34,41,0.10)" strokeWidth={1} strokeDasharray="2 4" />
          <path
            d="M 0 40 L 140 40 L 160 40 L 175 10 L 195 70 L 210 40 L 390 40 L 405 10 L 425 70 L 440 40 L 600 40"
            stroke={CYAN}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="185" cy="40" r="5" fill={CYAN}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="415" cy="40" r="5" fill={CYAN}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin="1.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </div>
  );
}

function StepHead({ i }: { i: number }) {
  const s = STEPS[i];
  return (
    <div className="mb-8">
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
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
  const [activeStep, setActiveStep] = useState(-1); // -1 intro · 0..3 steps · 4 outro
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
        // fragment drift by intra-frame progress
        const local = clamp01((pos - a) / (b - a));
        node.querySelectorAll<HTMLElement>("[data-fdepth]").forEach((fr) => {
          const d = Number(fr.dataset.fdepth || 0);
          if (d) fr.style.transform = `translateY(${((local - 0.5) * d).toFixed(1)}px)`;
        });
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

  /** Native page-scroll to the middle of step i's runway segment. */
  function jumpTo(i: number) {
    const el = wrapperRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    window.scrollTo({ top: window.scrollY + r.top + ((INTRO_U + i + 0.5) / U_TOTAL) * total, behavior: "smooth" });
  }

  if (!pinned) {
    /* Fallback: stacked flow, static vignettes */
    return (
      <section className="px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <SectionHead eyebrow="How it works" title="How to collaborate on INFITRA." sub="Four moves. Everything else is handled." />
          {STEPS.map((s, i) => (
            <div key={s.label} className="py-12">
              <StepHead i={i} />
              <s.Vig />
            </div>
          ))}
          <div className="py-12">
            <OutroFrame />
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
          style={{ height: "100dvh", backgroundColor: WASHES[0], transition: "background-color 600ms ease" }}
        >
          {/* Rail — desktop, steps only */}
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
                    <span className="block text-[9.5px] uppercase tracking-widest font-headline" style={{ color: activeStep === i ? ORANGE : FAINT, fontWeight: 800 }}>
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
          <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden style={{ opacity: activeStep >= 0 && activeStep <= 3 ? 1 : 0 , transition: "opacity 400ms ease" }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: activeStep === i ? 18 : 6, backgroundColor: activeStep === i ? ORANGE : "rgba(15,34,41,0.18)" }}
              />
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
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-60 lg:pr-16"
              style={{ opacity: idx === 0 ? 1 : 0, pointerEvents: idx === 0 ? "auto" : "none", willChange: "opacity, transform" }}
            >
              <div className="w-full max-w-5xl mx-auto">
                {f === -1 && <IntroFrame />}
                {f >= 0 && f <= 3 && (
                  <>
                    <StepHead i={f} />
                    {(() => {
                      const V = STEPS[f].Vig;
                      return <V />;
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
