"use client";

import { useEffect, useRef, useState } from "react";
import { EX, DRAFT, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, PRODUCT_SHADOW, SectionHead } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW IT WORKS — the flow container (polish round 2).
 * One framed container you swipe INSIDE: six full-height snap frames, a
 * persistent step rail (desktop) / dots (mobile), chevron to advance.
 * Each frame = one line + one PORTED surface. A small client island only
 * for tracking the active step; all content is static markup.
 *
 * Contract step is deliberately CONCEPTUAL: locked, signed-and-recorded
 * (timestamps shown, not explained), sealed with a fingerprint — no
 * document port, no technical detail.
 */

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── Step frames' visuals — direct ports, imagery-first ────── */

function PairMock() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 max-w-lg mx-auto" aria-hidden>
      {[
        { p: ALEX, color: ORANGE, chip: "You", chipIcon: false },
        { p: MIRA, color: CYAN, chip: "Accepted", chipIcon: true },
      ].map(({ p, color, chip, chipIcon }, i) => (
        <div key={p.name} className={i === 1 ? "relative flex-1 order-3" : "relative flex-1"}>
          <div
            className="rounded-3xl px-4 py-6 text-center"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${color}30`, boxShadow: CARD_SHADOW }}
          >
            <span
              className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
              style={{ color, backgroundColor: `${color}12`, fontWeight: 800 }}
            >
              {chipIcon && CHECK(color, 10)} {chip}
            </span>
            <span className="inline-block w-[4.5rem] h-[4.5rem] rounded-full overflow-hidden" style={{ border: `2.5px solid ${color}66`, boxShadow: `0 6px 20px ${color}2e` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <p className="text-[15px] font-headline mt-2.5" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
            <p className="text-[9.5px] uppercase tracking-widest font-headline mt-0.5" style={{ color, fontWeight: 800 }}>{p.tag}</p>
          </div>
        </div>
      ))}
      <span
        className="order-2 shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </div>
  );
}

function WorkspaceMock() {
  return (
    <div className="max-w-xl w-full mx-auto rounded-3xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <p className="text-[14px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>{DRAFT.title}</p>
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
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "#F8F6F0" }}>
            <p className="text-[14px] font-headline leading-snug" style={{ color: INK, fontWeight: 700 }}>
              {DRAFT.promise}
              <span className="inline-block align-middle w-[2px] h-[1.1em] ml-0.5 animate-pulse" style={{ backgroundColor: CYAN }} />
              <span className="inline-block align-middle ml-1.5 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest text-white font-headline" style={{ backgroundColor: CYAN, fontWeight: 800 }}>
                {MIRA.first}
              </span>
            </p>
          </div>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The weekly arc</p>
          <div className="flex flex-wrap gap-1.5">
            {DRAFT.rhythm.map((t, i) => (
              <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-bold font-headline" style={{ color: INK, backgroundColor: "rgba(8,145,178,0.07)" }}>
                <span style={{ color: CYAN }}>W{i + 1}</span> {t}
              </span>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {[
            { p: ALEX, role: "Owner", color: ORANGE, topics: DRAFT.alexTopics },
            { p: MIRA, role: "Co-host", color: CYAN, topics: DRAFT.miraTopics },
          ].map(({ p, role, color, topics }) => (
            <div key={p.name} className="rounded-2xl p-3" style={{ backgroundColor: "#FAFAF7", border: `1px solid ${color}22` }}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-7 h-7 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                </span>
                <span className="text-[12px] font-headline" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                <span className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color, fontWeight: 800 }}>{role}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {topics.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderMock() {
  return (
    <div className="max-w-lg w-full mx-auto rounded-3xl p-6 text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-4 text-center" style={{ color: CYAN, fontWeight: 800 }}>
        Revenue share
      </p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-full overflow-hidden" style={{ border: `1.5px solid ${ORANGE}59` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="text-2xl font-black font-headline" style={{ color: ORANGE }}>{EX.split.owner}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-headline" style={{ color: CYAN }}>{EX.split.cohost}%</span>
          <span className="w-9 h-9 rounded-full overflow-hidden" style={{ border: `1.5px solid ${CYAN}59` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
          </span>
        </div>
      </div>
      {/* the dual-color slider — the workspace's actual control */}
      <div className="relative h-2.5 rounded-full overflow-visible mb-6">
        <div className="absolute inset-0 rounded-full overflow-hidden flex">
          <div style={{ width: `${EX.split.owner}%`, backgroundColor: ORANGE }} />
          <div style={{ width: `${EX.split.cohost}%`, backgroundColor: CYAN }} />
        </div>
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{ left: `${EX.split.owner}%`, backgroundColor: "#FFFFFF", boxShadow: "0 0 0 2px rgba(15,34,41,0.15), 0 4px 10px rgba(15,34,41,0.25)" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: `${ALEX.first} owns`, color: ORANGE, topics: DRAFT.alexTopics },
          { label: `${MIRA.first} owns`, color: CYAN, topics: DRAFT.miraTopics },
        ].map(({ label, color, topics }) => (
          <div key={label}>
            <p className="text-[9px] uppercase tracking-[0.16em] font-headline mb-1.5" style={{ color: FAINT, fontWeight: 800 }}>{label}</p>
            <div className="flex flex-wrap gap-1">
              {topics.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[9.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
          {CHECK("#16a34a", 10)} Agreed by both
        </span>
      </div>
    </div>
  );
}

function ContractSealMock() {
  return (
    <div className="max-w-md w-full mx-auto rounded-3xl p-7 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="11" width="17" height="10" rx="2" />
          <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
        </svg>
        Locked
      </span>
      <p className="text-[19px] font-headline tracking-tight mt-3" style={{ color: INK, fontWeight: 800 }}>
        Collaboration Contract
      </p>
      <p className="text-[10px] uppercase tracking-[0.18em] font-headline mt-1" style={{ color: FAINT, fontWeight: 800 }}>
        Single source of truth
      </p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        {[
          { p: ALEX, color: ORANGE, stamp: CONTRACT.lockedStamp },
          { p: MIRA, color: CYAN, stamp: CONTRACT.acceptedStamp },
        ].map(({ p, color, stamp }) => (
          <div key={p.name} className="rounded-2xl px-3.5 py-4 text-left" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
            <p className="text-[16px] leading-none" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>
              {p.name}
            </p>
            <p className="text-[9px] uppercase tracking-widest font-headline mt-2 flex items-center gap-1" style={{ color, fontWeight: 800 }}>
              {CHECK(color, 10)} Signed
            </p>
            <p className="text-[9px] font-semibold mt-0.5" style={{ color: FAINT }}>{stamp}</p>
          </div>
        ))}
      </div>

      {/* the seal — tamper-evidence as a fingerprint, not a hash */}
      <div className="mt-6 flex flex-col items-center">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ border: "1.5px dashed rgba(8,145,178,0.45)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
            <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
            <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
            <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
          </svg>
        </span>
        <p className="text-[9px] uppercase tracking-[0.18em] font-headline mt-2" style={{ color: FAINT, fontWeight: 800 }}>
          Sealed · tamper-evident
        </p>
      </div>
    </div>
  );
}

function PublishMock() {
  return (
    <div className="max-w-lg w-full mx-auto rounded-2xl overflow-hidden" style={{ boxShadow: PRODUCT_SHADOW }} aria-hidden>
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
      <MockBuyerCard compact frameless />
    </div>
  );
}

function LiveRoomMock() {
  return (
    <div className="max-w-lg w-full mx-auto rounded-3xl overflow-hidden" style={{ backgroundColor: INK, boxShadow: "0 24px 60px rgba(15,34,41,0.28)" }} aria-hidden>
      <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-headline min-w-0" style={{ fontWeight: 800 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
          <span className="truncate" style={{ color: "#FFFFFF" }}>Live — {EX.week1[0].title}</span>
        </span>
        <span className="text-[9px] uppercase tracking-widest font-headline shrink-0" style={{ color: "#9CF0FF", fontWeight: 800 }}>
          Session 1 of {EX.sessions}
        </span>
      </div>
      <div className="p-3 grid grid-cols-4 gap-2">
        {[
          { p: ALEX, color: ORANGE },
          { p: MIRA, color: CYAN },
        ].map(({ p, color }) => (
          <div key={p.name} className="relative col-span-2 aspect-[16/10] rounded-xl overflow-hidden" style={{ backgroundColor: "#16323b" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[8px] font-headline" style={{ backgroundColor: "rgba(15,34,41,0.75)", color: "#FFFFFF", fontWeight: 800 }}>
              {p.first} · <span style={{ color }}>HOST</span>
            </span>
          </div>
        ))}
        {["A", "S", "L", "J"].map((i) => (
          <div key={i} className="aspect-[16/10] rounded-xl flex items-center justify-center" style={{ backgroundColor: "#16323b" }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-headline" style={{ backgroundColor: "rgba(156,240,255,0.12)", color: "#9CF0FF", fontWeight: 800 }}>
              {i}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2.5 pb-3.5">
        {["rgba(255,255,255,0.16)", "rgba(255,255,255,0.16)", "rgba(239,68,68,0.85)"].map((c, i) => (
          <span key={i} className="w-7 h-7 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

/* ── The steps ─────────────────────────────────────────────── */

const STEPS = [
  { label: "The invitation", title: "Pick your complement.", copy: "One invitation starts a shared draft with the expert who completes what you teach.", Mock: PairMock },
  { label: "The workspace", title: "Design it together.", copy: "The promise, the weekly arc, who owns what — co-edited live.", Mock: WorkspaceMock },
  { label: "The deal", title: "Align it — visibly.", copy: "Set the split together. The workspace holds the negotiation — visible, adjustable, agreed.", Mock: SliderMock },
  { label: "The contract", title: "Locked. Recorded. Sealed.", copy: "One lock turns your design into the single source of truth — signed by both.", Mock: ContractSealMock },
  { label: "To market", title: "Publish. It's real.", copy: "One publish: your experience page with checkout, live on your link.", Mock: PublishMock },
  { label: "Go live", title: "Session one. Tribe in.", copy: "Your tribe shows up. You coach — together.", Mock: LiveRoomMock },
] as const;

export function HowItWorks() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll-position math instead of IntersectionObserver: frames are exactly
    // one clientHeight tall (snap-mandatory), so the active index is just the
    // rounded scroll ratio — deterministic in every environment.
    const onScroll = () =>
      setActive(Math.min(STEPS.length - 1, Math.max(0, Math.round(el.scrollTop / el.clientHeight))));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function jumpTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    setActive(i); // instant feedback; the scroll listener confirms on arrival
    el.scrollTo({ top: i * el.clientHeight, behavior: "smooth" });
  }

  return (
    <section className="px-4 sm:px-6 py-24">
      <div className="max-w-4xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title="From invitation to live."
          sub="Six moves — swipe through the flow."
        />

        <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: "#FDFCF9", boxShadow: PRODUCT_SHADOW }}>
          {/* Desktop rail */}
          <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-48 flex-col justify-center gap-4 pl-7 pr-2 z-10 pointer-events-none">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => jumpTo(i)}
                className="pointer-events-auto flex items-center gap-2.5 text-left transition-opacity"
                style={{ opacity: active === i ? 1 : 0.38 }}
              >
                <span
                  className="shrink-0 w-2 h-2 rounded-full transition-colors"
                  style={{ backgroundColor: active === i ? ORANGE : "rgba(15,34,41,0.25)" }}
                />
                <span className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-widest font-headline" style={{ color: active === i ? ORANGE : FAINT, fontWeight: 800 }}>
                    0{i + 1}
                  </span>
                  <span className="block text-[11.5px] font-headline leading-tight" style={{ color: INK, fontWeight: 700 }}>
                    {s.label}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Mobile dots */}
          <div className="md:hidden absolute top-4 inset-x-0 z-10 flex justify-center gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{ width: active === i ? 18 : 6, backgroundColor: active === i ? ORANGE : "rgba(15,34,41,0.18)" }}
              />
            ))}
          </div>

          {/* The frames */}
          <div
            ref={scrollerRef}
            className="overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ height: "min(max(72vh, 560px), 780px)" }}
          >
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                data-frame={i}
                className="h-full snap-start snap-always flex flex-col items-center justify-center gap-6 px-5 pt-10 pb-12 md:pl-48 md:pr-12 md:pt-6 text-center"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-2" style={{ color: CYAN, fontWeight: 700 }}>
                    Step 0{i + 1} · {s.label}
                  </p>
                  <h3 className="text-xl md:text-2xl font-headline tracking-tight mb-2" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {s.title}
                  </h3>
                  <p className="text-[14px] md:text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: MUTED }}>
                    {s.copy}
                  </p>
                </div>
                <div className="w-full">
                  <s.Mock />
                </div>
              </div>
            ))}
          </div>

          {/* Advance chevron */}
          {active < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => jumpTo(active + 1)}
              aria-label="Next step"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1px rgba(15,34,41,0.08), 0 6px 18px rgba(15,34,41,0.14)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
