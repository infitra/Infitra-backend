"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, PRODUCT_SHADOW, SectionHead } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW TO COLLABORATE ON INFITRA — the pinned chapter (pliability-style).
 *
 * A tall scroll RUNWAY with a full-viewport sticky STAGE pinned inside it:
 * the page scrolls natively (no nested scrollers, no wheel capture), the
 * stage stays put, and scroll progress switches the step panels in place
 * with eased transitions. Full-bleed per-step background washes make every
 * switch read as a page change. The rail carries a progress line that fills
 * with scroll; clicking a step scrolls the page to its runway segment.
 *
 * Feel-tuning constants below. Fallback: reduced-motion or short viewports
 * get a plain stacked flow.
 */

/* ── Feel constants — tune these two on deploy ─────────────── */
const RUNWAY_VH_PER_STEP = 115; // scroll distance per step (vh)
const TRANSITION_MS = 450; // panel switch duration
const EASE = "cubic-bezier(.22,.61,.36,1)";
/** Full-bleed stage wash per step: invitation cream → workspace warm white →
 *  agreement cool white → publish soft orange. */
const STAGE_BG = ["#F5F1E8", "#FAF8F2", "#F3F5F4", "#FAF0E8"];

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const FINGERPRINT = (color: string, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" aria-hidden>
    <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
    <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
    <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
    <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
  </svg>
);

/* ── 01 · The invitation ───────────────────────────────────── */
function PairMock() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-xl mx-auto" aria-hidden>
      {[
        { p: ALEX, color: ORANGE, chip: "You", chipIcon: false, order: "order-1" },
        { p: MIRA, color: CYAN, chip: "Accepted", chipIcon: true, order: "order-3" },
      ].map(({ p, color, chip, chipIcon, order }) => (
        <div key={p.name} className={`relative flex-1 ${order}`}>
          <div className="rounded-3xl px-4 py-8 text-center" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${color}30`, boxShadow: CARD_SHADOW }}>
            <span
              className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] uppercase tracking-widest font-headline"
              style={{ color, backgroundColor: `${color}12`, fontWeight: 800 }}
            >
              {chipIcon && CHECK(color, 10)} {chip}
            </span>
            <span className="inline-block w-24 h-24 rounded-full overflow-hidden" style={{ border: `3px solid ${color}66`, boxShadow: `0 8px 24px ${color}2e` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <p className="text-[16px] font-headline mt-3.5" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
            <p className="text-[10.5px] uppercase tracking-widest font-headline mt-1" style={{ color, fontWeight: 800 }}>{p.tag}</p>
          </div>
        </div>
      ))}
      <span className="order-2 shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </div>
  );
}

/* ── 02 · The workspace — structured frame + team chat beside ── */
function WorkspaceMock() {
  return (
    <div className="max-w-3xl w-full mx-auto rounded-3xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-[15px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{EX.title}</p>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, backgroundColor: "rgba(15,34,41,0.05)", fontWeight: 800 }}>
            Draft
          </span>
        </div>
        <div className="flex -space-x-1.5 shrink-0">
          {[ALEX.avatar, MIRA.avatar].map((a) => (
            <span key={a} className="relative w-7 h-7 rounded-full overflow-hidden" style={{ border: "2px solid #FFFFFF" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a} alt="" className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e", border: "1.5px solid #FFF" }} />
            </span>
          ))}
        </div>
      </div>

      {/* structure + chat, side by side */}
      <div className="grid md:grid-cols-[1.4fr_1fr]">
        <div className="p-5 md:p-6 space-y-5 min-w-0">
          {/* the promise */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
            <div className="rounded-2xl px-4 py-3.5 text-[14.5px] font-headline leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK, fontWeight: 700 }}>
              {EX.promise}
            </div>
          </div>

          {/* your sessions, with their images */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>The sessions</p>
            <div className="space-y-2">
              {[
                { title: "Meet your Experts", meta: "Week 1 · Sun 13:00 · 45 min · Alex & Mira", img: "/landing/session-meet.jpg" },
                { title: "Nutrition Foundations & Weekly Setup", meta: "Week 1 · Mon 13:00 · 45 min · Mira", img: "/landing/session-nutrition.jpg" },
              ].map((s) => (
                <div key={s.title} className="flex items-center gap-3 rounded-xl p-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                  <span className="relative shrink-0 w-16 h-11 rounded-lg overflow-hidden" style={{ backgroundColor: INK }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-headline leading-snug truncate" style={{ color: INK, fontWeight: 800 }}>{s.title}</span>
                    <span className="block text-[10px] font-bold mt-0.5" style={{ color: FAINT }}>{s.meta}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5" style={{ border: "1.5px dashed rgba(8,145,178,0.35)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[11.5px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
              </div>
            </div>
          </div>

          {/* who owns what + the split as a design parameter */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-headline mb-2" style={{ color: CYAN, fontWeight: 800 }}>The team · who owns what</p>
            <div className="space-y-2">
              {[
                { p: ALEX, role: "Owner", color: ORANGE },
                { p: MIRA, role: "Co-host", color: CYAN },
              ].map(({ p, role, color }) => (
                <div key={p.name} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FAFAF7", border: `1px solid ${color}22` }}>
                  <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[12.5px] font-headline shrink-0" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                  <span className="text-[8.5px] uppercase tracking-widest font-headline shrink-0" style={{ color, fontWeight: 800 }}>{role}</span>
                  <span className="flex flex-wrap gap-1.5 justify-end flex-1 min-w-0">
                    {p.topics.slice(0, 2).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                        {t}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="text-[8.5px] uppercase tracking-widest font-headline shrink-0" style={{ color: FAINT, fontWeight: 800 }}>Split</span>
                <span className="flex-1 flex h-2.5 rounded-full overflow-hidden">
                  <span style={{ width: `${EX.split.owner}%`, backgroundColor: ORANGE }} />
                  <span style={{ width: `${EX.split.cohost}%`, backgroundColor: CYAN }} />
                </span>
                <span className="text-[11px] font-black font-headline shrink-0" style={{ color: INK }}>
                  {EX.split.owner} / {EX.split.cohost}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the team chat — a real panel beside the work */}
        <div className="p-5 md:p-6 flex flex-col" style={{ backgroundColor: "#FAF8F3", borderLeft: "1px solid rgba(15,34,41,0.05)" }}>
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
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[12.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                Added my nutrition sessions for weeks 1–3 ✓
              </div>
            </div>
            <div className="flex items-start gap-2 justify-end">
              <div className="rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[12.5px] font-medium leading-snug" style={{ backgroundColor: "rgba(255,97,48,0.08)", color: INK }}>
                Looks strong. I&apos;ll lock the design tonight?
              </div>
              <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-[12.5px] font-medium" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                Do it 🚀
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-full px-4 py-2.5 text-[11.5px]" style={{ backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
            Message your team…
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 03 · The agreement — the whole design, locked & agreed ── */
function AgreementMock() {
  return (
    <div className="max-w-lg w-full mx-auto rounded-3xl p-7 sm:p-8 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="11" width="17" height="10" rx="2" />
          <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
        </svg>
        Locked as one
      </span>
      <p className="text-[19px] font-headline tracking-tight mt-3" style={{ color: INK, fontWeight: 800 }}>
        {EX.title}
      </p>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mt-1 mb-6" style={{ color: FAINT, fontWeight: 800 }}>
        The whole design
      </p>

      <div className="space-y-2 text-left mb-7">
        {[
          `All ${EX.sessions} sessions — as designed`,
          "Ownership — as assigned",
          `Split — ${EX.split.owner} / ${EX.split.cohost}`,
        ].map((t) => (
          <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
            <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 13)}</span>
            <span className="text-[13.5px] font-bold font-headline" style={{ color: INK }}>{t}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {[
          { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp },
          { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp },
        ].map(({ p, color, action, stamp }) => (
          <div key={p.name} className="rounded-2xl px-4 py-4 text-left" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
            <p className="text-[9px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
            <p className="text-[16px] leading-none mt-1.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>
              {p.name}
            </p>
            <p className="text-[9px] font-semibold mt-2 flex items-center gap-1" style={{ color }}>
              {CHECK(color, 10)} Recorded · {stamp}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 04 · The publish — one click, everything handled ──────── */
const HANDLED = [
  { t: "Marketing page", d: "live on your link — ready to promote", fp: false },
  { t: "Checkout", d: "Stripe payments, in CHF", fp: false },
  { t: "Contract", d: "recorded & sealed automatically — tamper-evident", fp: true },
  { t: "Revenue split", d: "armed for every sale, exactly as agreed", fp: false },
  { t: "Sessions", d: "all 20 scheduled, live rooms ready", fp: false },
  { t: "Tribe space", d: "open, waiting for members", fp: false },
] as const;

function PublishMock() {
  return (
    <div className="max-w-4xl w-full mx-auto grid md:grid-cols-[1.15fr_1fr] gap-6 items-center text-left" aria-hidden>
      {/* the marketing page, live */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: PRODUCT_SHADOW }}>
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: "#E9E5DC" }}>
          <span className="flex gap-1.5 shrink-0">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.16)" }} />
            ))}
          </span>
          <span className="flex-1 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 min-w-0" style={{ backgroundColor: "#FFFFFF" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
              <rect x="3.5" y="11" width="17" height="10" rx="2" />
              <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
            </svg>
            <span className="text-[11px] font-medium truncate" style={{ color: MUTED }}>
              infitra.fit/experiences/your-experience
            </span>
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ backgroundColor: "rgba(22,163,74,0.10)", color: "#16a34a", fontWeight: 800 }}>
            {CHECK("#16a34a", 10)} Published
          </span>
        </div>
        <MockBuyerCard />
      </div>

      {/* handled in the same click */}
      <div className="rounded-3xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.88)", boxShadow: CARD_SHADOW }}>
        <p className="text-[10px] uppercase tracking-[0.2em] font-headline mb-4" style={{ color: ORANGE, fontWeight: 800 }}>
          Handled in the same click
        </p>
        <div className="space-y-3">
          {HANDLED.map(({ t, d, fp }) => (
            <div key={t} className="flex items-start gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-[1px]" style={{ backgroundColor: fp ? "rgba(8,145,178,0.10)" : "rgba(22,163,74,0.08)" }}>
                {fp ? FINGERPRINT(CYAN, 14) : CHECK("#16a34a", 12)}
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>{t}</span>
                <span className="block text-[11px] font-semibold mt-0.5" style={{ color: MUTED }}>{d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── The steps ─────────────────────────────────────────────── */

const STEPS = [
  {
    label: "The invitation",
    title: "Pick your complement.",
    copy: "One invitation starts a shared draft with the expert who completes what you teach.",
    Mock: PairMock,
  },
  {
    label: "The workspace",
    title: "Design it together.",
    copy: "A pre-structured experience to create inside — your sessions, your parameters, who owns what — with the team chat right beside it.",
    Mock: WorkspaceMock,
  },
  {
    label: "The agreement",
    title: "Lock it. Agree. Recorded.",
    copy: "The whole design locks as one — sessions, ownership, split. Your partner reviews and agrees. Every step recorded.",
    Mock: AgreementMock,
  },
  {
    label: "The publish",
    title: "From publishing to promoting in one click.",
    copy: "One publish and it's out in the world — everything below handled in the same click.",
    Mock: PublishMock,
  },
] as const;

/** One step's text block + mock — shared by the pinned stage and the
 *  stacked fallback. `fit` scales tall mocks down on short viewports so a
 *  panel always fits the 100vh stage. */
function StepContent({ i, fit }: { i: number; fit?: boolean }) {
  const s = STEPS[i];
  return (
    <>
      <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-3" style={{ color: CYAN, fontWeight: 700 }}>
        Step 0{i + 1} · {s.label}
      </p>
      <h3
        className="text-3xl md:text-4xl font-headline tracking-tight mb-3.5 max-w-2xl mx-auto"
        style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {s.title}
      </h3>
      <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-8 md:mb-10" style={{ color: MUTED }}>
        {s.copy}
      </p>
      <div
        className={
          fit
            ? "w-full origin-top [@media(max-height:900px)]:scale-[0.92] [@media(max-height:800px)]:scale-[0.82] [@media(max-height:700px)]:scale-[0.72]"
            : "w-full"
        }
      >
        <s.Mock />
      </div>
    </>
  );
}

export function HowItWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerHeight < 600) {
      const raf0 = requestAnimationFrame(() => setPinned(false));
      return () => cancelAnimationFrame(raf0);
    }
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapperRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        if (total <= 0) return;
        const p = Math.min(0.9999, Math.max(0, -r.top / total));
        setProgress(p);
        setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
      });
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
    window.scrollTo({ top: window.scrollY + r.top + ((i + 0.5) / STEPS.length) * total, behavior: "smooth" });
    setActive(i);
  }

  return (
    <section>
      {/* Chapter head — normal flow */}
      <div className="px-6 pt-24 pb-2">
        <SectionHead eyebrow="How it works" title="How to collaborate on INFITRA." sub="Four moves. Everything else is handled." />
      </div>

      {pinned ? (
        /* ── The runway + pinned stage ── */
        <div ref={wrapperRef} className="relative" style={{ height: `${STEPS.length * RUNWAY_VH_PER_STEP}vh` }}>
          <div
            className="sticky top-0 w-full overflow-hidden h-screen"
            style={{ height: "100dvh", backgroundColor: STAGE_BG[active], transition: `background-color 650ms ${EASE}` }}
          >
            {/* Rail — desktop */}
            <div className="hidden lg:flex absolute left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 items-stretch gap-5">
              <div className="relative w-px rounded-full" style={{ backgroundColor: "rgba(15,34,41,0.12)" }}>
                <div
                  className="absolute top-0 left-0 w-px rounded-full"
                  style={{ height: `${progress * 100}%`, backgroundColor: ORANGE, transition: "height 100ms linear" }}
                />
              </div>
              <div className="flex flex-col justify-between gap-8 py-0.5">
                {STEPS.map((s, i) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => jumpTo(i)}
                    className="flex items-center gap-3 text-left transition-opacity duration-300"
                    style={{ opacity: active === i ? 1 : 0.38 }}
                  >
                    <span className="shrink-0 w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: active === i ? ORANGE : "rgba(15,34,41,0.25)" }} />
                    <span className="min-w-0">
                      <span className="block text-[9.5px] uppercase tracking-widest font-headline" style={{ color: active === i ? ORANGE : FAINT, fontWeight: 800 }}>
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
            <div className="lg:hidden absolute top-5 inset-x-0 z-20 flex justify-center gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: active === i ? 18 : 6, backgroundColor: active === i ? ORANGE : "rgba(15,34,41,0.18)" }}
                />
              ))}
            </div>

            {/* Panels — switch in place */}
            {STEPS.map((s, i) => {
              const state = i === active ? "in" : i < active ? "above" : "below";
              return (
                <div
                  key={s.label}
                  aria-hidden={i !== active}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 sm:px-8 lg:pl-64 lg:pr-16 pt-10 pb-6 lg:pt-4"
                  style={{
                    opacity: state === "in" ? 1 : 0,
                    transform: state === "in" ? "none" : state === "above" ? "translateY(-30px)" : "translateY(30px)",
                    transition: `opacity ${TRANSITION_MS}ms ${EASE}, transform ${TRANSITION_MS}ms ${EASE}`,
                    pointerEvents: state === "in" ? "auto" : "none",
                  }}
                >
                  <div className="w-full max-w-5xl mx-auto">
                    <StepContent i={i} fit />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Fallback: plain stacked flow (reduced motion / short viewports) ── */
        <div className="px-4 sm:px-6 pb-10">
          <div className="max-w-6xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.label}>
                {i > 0 && <div className="h-px max-w-[240px] mx-auto" style={{ backgroundColor: "rgba(15,34,41,0.08)" }} aria-hidden />}
                <div className="py-14 md:py-20 text-center">
                  <StepContent i={i} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
