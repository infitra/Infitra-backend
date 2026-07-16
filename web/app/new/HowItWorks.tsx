"use client";

import { useEffect, useRef, useState } from "react";
import { EX, CONTRACT, ALEX, MIRA } from "./content";
import { INK, ORANGE, CYAN, MUTED, FAINT, CARD_SHADOW, PRODUCT_SHADOW, SectionHead } from "./ui";
import { MockBuyerCard } from "./MockBuyerCard";

/**
 * M3 · HOW IT WORKS — the creator's build story, ending at publish.
 * One framed container you swipe INSIDE: four full-height snap PAGES with
 * visible gutters (clean cuts), a step rail (desktop) / dots (mobile), and
 * an advance chevron. The flagship "6-Week Sustainable Fitness Reset"
 * threads every step — the same experience the visitor just browsed above.
 *
 *   01 invitation → 02 workspace (structured frame + team chat beside) →
 *   03 agreement (the whole design locks; partner agrees; recorded) →
 *   04 publish (marketing page live + contract recorded automatically).
 *
 * "Go live" is deliberately NOT here — that's where the experience's own
 * story begins (the next section).
 */

const CHECK = (color: string, size = 12) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ── 01 · The invitation ───────────────────────────────────── */
function PairMock() {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 max-w-lg mx-auto" aria-hidden>
      {[
        { p: ALEX, color: ORANGE, chip: "You", chipIcon: false, order: "order-1" },
        { p: MIRA, color: CYAN, chip: "Accepted", chipIcon: true, order: "order-3" },
      ].map(({ p, color, chip, chipIcon, order }) => (
        <div key={p.name} className={`relative flex-1 ${order}`}>
          <div className="rounded-3xl px-4 py-7 text-center" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${color}30`, boxShadow: CARD_SHADOW }}>
            <span
              className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline"
              style={{ color, backgroundColor: `${color}12`, fontWeight: 800 }}
            >
              {chipIcon && CHECK(color, 10)} {chip}
            </span>
            <span className="inline-block w-20 h-20 rounded-full overflow-hidden" style={{ border: `2.5px solid ${color}66`, boxShadow: `0 6px 20px ${color}2e` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar} alt="" className="w-full h-full object-cover" />
            </span>
            <p className="text-[15px] font-headline mt-3" style={{ color: INK, fontWeight: 800 }}>{p.name}</p>
            <p className="text-[10px] uppercase tracking-widest font-headline mt-0.5" style={{ color, fontWeight: 800 }}>{p.tag}</p>
          </div>
        </div>
      ))}
      <span className="order-2 shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.12)", border: "1px solid rgba(8,145,178,0.30)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </div>
  );
}

/* ── 02 · The workspace — structured frame + team chat beside ── */
function WorkspaceMock() {
  return (
    <div className="max-w-2xl w-full mx-auto rounded-3xl overflow-hidden text-left" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(15,34,41,0.07)" }}>
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

      {/* structure + chat, side by side */}
      <div className="grid md:grid-cols-[1.35fr_1fr]">
        <div className="p-4 sm:p-5 space-y-4 min-w-0">
          {/* the promise */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The promise</p>
            <div className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-headline leading-snug" style={{ backgroundColor: "#F8F6F0", color: INK, fontWeight: 700 }}>
              {EX.promise}
            </div>
          </div>
          {/* your sessions + parameters */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The sessions</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>Meet your Experts</span>
                  <span className="block text-[9px] font-bold" style={{ color: FAINT }}>Week 1 · Sun 13:00 · 45 min · Alex & Mira</span>
                </span>
                <span className="shrink-0 text-[9px] font-black font-headline" style={{ color: FAINT }}>W1</span>
              </div>
              <div className="hidden md:flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-headline truncate" style={{ color: INK, fontWeight: 800 }}>Nutrition Foundations & Weekly Setup</span>
                  <span className="block text-[9px] font-bold" style={{ color: FAINT }}>Week 1 · Mon 13:00 · 45 min · Mira</span>
                </span>
                <span className="shrink-0 text-[9px] font-black font-headline" style={{ color: FAINT }}>W1</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2" style={{ border: "1.5px dashed rgba(8,145,178,0.35)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[10.5px] font-headline" style={{ color: CYAN, fontWeight: 800 }}>Add session</span>
              </div>
            </div>
          </div>
          {/* who owns what + the split as a design parameter */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-1.5" style={{ color: CYAN, fontWeight: 800 }}>The team · who owns what</p>
            <div className="space-y-1.5">
              {[
                { p: ALEX, role: "Owner", color: ORANGE },
                { p: MIRA, role: "Co-host", color: CYAN },
              ].map(({ p, role, color }) => (
                <div key={p.name} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "#FAFAF7", border: `1px solid ${color}22` }}>
                  <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden" style={{ border: `1.5px solid ${color}59` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[11px] font-headline shrink-0" style={{ color: INK, fontWeight: 800 }}>{p.first}</span>
                  <span className="text-[8px] uppercase tracking-widest font-headline shrink-0" style={{ color, fontWeight: 800 }}>{role}</span>
                  <span className="flex flex-wrap gap-1 justify-end flex-1 min-w-0">
                    {p.topics.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-headline" style={{ color, backgroundColor: `${color}12` }}>
                        {t}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
                <span className="text-[8px] uppercase tracking-widest font-headline shrink-0" style={{ color: FAINT, fontWeight: 800 }}>Split</span>
                <span className="flex-1 flex h-2 rounded-full overflow-hidden">
                  <span style={{ width: `${EX.split.owner}%`, backgroundColor: ORANGE }} />
                  <span style={{ width: `${EX.split.cohost}%`, backgroundColor: CYAN }} />
                </span>
                <span className="text-[9.5px] font-black font-headline shrink-0" style={{ color: INK }}>
                  {EX.split.owner} / {EX.split.cohost}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* the team chat — a real panel beside the work */}
        <div className="p-4 sm:p-5 md:pl-4" style={{ backgroundColor: "#FAF8F3", borderLeft: "1px solid rgba(15,34,41,0.05)" }}>
          <p className="text-[9px] uppercase tracking-[0.18em] font-headline mb-2.5" style={{ color: FAINT, fontWeight: 800 }}>Team chat</p>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3 py-2 text-[11.5px] font-medium" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                Added my nutrition sessions for weeks 1–3 ✓
              </div>
            </div>
            <div className="flex items-start gap-2 justify-end">
              <div className="rounded-2xl rounded-tr-md px-3 py-2 text-[11.5px] font-medium" style={{ backgroundColor: "rgba(255,97,48,0.08)", color: INK }}>
                Looks strong. I&apos;ll lock the design tonight?
              </div>
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ALEX.avatar} alt="" className="w-full h-full object-cover" />
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full overflow-hidden mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MIRA.avatar} alt="" className="w-full h-full object-cover" />
              </span>
              <div className="rounded-2xl rounded-tl-md px-3 py-2 text-[11.5px] font-medium" style={{ backgroundColor: "rgba(8,145,178,0.08)", color: INK }}>
                Do it 🚀
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-full px-3.5 py-2 text-[10.5px]" style={{ backgroundColor: "#FFFFFF", color: FAINT, boxShadow: "0 0 0 1px rgba(15,34,41,0.07)" }}>
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
    <div className="max-w-md w-full mx-auto rounded-3xl p-6 sm:p-7 text-center" style={{ backgroundColor: "#FFFFFF", boxShadow: PRODUCT_SHADOW }} aria-hidden>
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-headline" style={{ color: "#16a34a", backgroundColor: "rgba(22,163,74,0.08)", fontWeight: 800 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="11" width="17" height="10" rx="2" />
          <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
        </svg>
        Locked as one
      </span>
      <p className="text-[17px] font-headline tracking-tight mt-2.5" style={{ color: INK, fontWeight: 800 }}>
        {EX.title}
      </p>
      <p className="text-[9.5px] uppercase tracking-[0.18em] font-headline mt-0.5 mb-5" style={{ color: FAINT, fontWeight: 800 }}>
        The whole design
      </p>

      <div className="space-y-1.5 text-left mb-6">
        {[
          `All ${EX.sessions} sessions — as designed`,
          "Ownership — as assigned",
          `Split — ${EX.split.owner} / ${EX.split.cohost}`,
        ].map((t) => (
          <div key={t} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
            <span className="shrink-0" style={{ color: CYAN }}>{CHECK(CYAN, 12)}</span>
            <span className="text-[12px] font-bold font-headline" style={{ color: INK }}>{t}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { p: ALEX, color: ORANGE, action: "Locked by", stamp: CONTRACT.lockedStamp },
          { p: MIRA, color: CYAN, action: "Agreed by", stamp: CONTRACT.agreedStamp },
        ].map(({ p, color, action, stamp }) => (
          <div key={p.name} className="rounded-2xl px-3.5 py-3.5 text-left" style={{ backgroundColor: "#FAFAF7", border: "1px solid rgba(15,34,41,0.06)" }}>
            <p className="text-[8.5px] uppercase tracking-widest font-headline" style={{ color: FAINT, fontWeight: 800 }}>{action}</p>
            <p className="text-[15px] leading-none mt-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", color: INK }}>
              {p.name}
            </p>
            <p className="text-[8.5px] font-semibold mt-1.5 flex items-center gap-1" style={{ color }}>
              {CHECK(color, 9)} Recorded · {stamp}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 04 · The publish — page live + contract recorded, one act ── */
function PublishMock() {
  return (
    <div className="relative max-w-lg w-full mx-auto pb-10" aria-hidden>
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

      {/* the contract, recorded automatically — sealed at the corner */}
      <div
        className="absolute -bottom-0 right-3 sm:-right-4 flex items-center gap-2.5 rounded-2xl px-4 py-3 rotate-[0.6deg]"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 0 0 1.5px rgba(8,145,178,0.28), 0 16px 40px rgba(15,34,41,0.18)" }}
      >
        <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1.5px dashed rgba(8,145,178,0.45)" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M7.5 19.5c1.4-2.3 2-4.8 2-7.5a2.5 2.5 0 0 1 5 0c0 2.4-.4 4.8-1.2 7" />
            <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5 0 1.7-.2 3.4-.6 5" />
            <path d="M4.5 12a7.5 7.5 0 0 1 3.7-6.5" />
            <path d="M4.9 15.5c.4-1.1.6-2.3.6-3.5" />
          </svg>
        </span>
        <span className="text-left">
          <span className="block text-[11px] font-headline leading-tight" style={{ color: INK, fontWeight: 800 }}>
            Contract · recorded automatically
          </span>
          <span className="block text-[8.5px] uppercase tracking-widest font-headline mt-0.5" style={{ color: FAINT, fontWeight: 800 }}>
            Sealed · tamper-evident
          </span>
        </span>
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
    title: "One publish. It's all real.",
    copy: "Your experience goes live exactly as agreed — the marketing page with checkout, and the contract recorded automatically.",
    Mock: PublishMock,
  },
] as const;

export function HowItWorks() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Scroll-position math: frames are exactly one clientHeight tall
    // (snap-mandatory), so the active index is the rounded scroll ratio.
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
      <div className="max-w-5xl mx-auto">
        <SectionHead
          eyebrow="How it works"
          title="From invitation to published."
          sub="Four moves — swipe through the flow. Then it runs."
        />

        <div className="relative rounded-3xl overflow-hidden" style={{ backgroundColor: "#EFEBE2", boxShadow: PRODUCT_SHADOW }}>
          {/* Desktop rail */}
          <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-44 flex-col justify-center gap-5 pl-7 pr-2 z-10 pointer-events-none">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => jumpTo(i)}
                className="pointer-events-auto flex items-center gap-2.5 text-left transition-opacity"
                style={{ opacity: active === i ? 1 : 0.4 }}
              >
                <span className="shrink-0 w-2 h-2 rounded-full transition-colors" style={{ backgroundColor: active === i ? ORANGE : "rgba(15,34,41,0.25)" }} />
                <span className="min-w-0">
                  <span className="block text-[9px] uppercase tracking-widest font-headline" style={{ color: active === i ? ORANGE : FAINT, fontWeight: 800 }}>
                    0{i + 1}
                  </span>
                  <span className="block text-[12px] font-headline leading-tight" style={{ color: INK, fontWeight: 700 }}>
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

          {/* The pages */}
          <div
            ref={scrollerRef}
            className="overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ height: "clamp(620px, 80vh, 860px)" }}
          >
            {STEPS.map((s, i) => (
              <div key={s.label} data-frame={i} className="h-full snap-start snap-always p-2.5 sm:p-3">
                {/* each step = its own PAGE, visible gutters = clean cuts */}
                <div
                  className="h-full rounded-[1.4rem] flex flex-col items-center justify-center gap-6 sm:gap-7 px-4 sm:px-8 pt-10 pb-10 md:pl-48 md:pr-12 md:pt-8 text-center overflow-hidden"
                  style={{ backgroundColor: "#FDFCF9", boxShadow: "0 0 0 1px rgba(15,34,41,0.05)" }}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-headline mb-2.5" style={{ color: CYAN, fontWeight: 700 }}>
                      Step 0{i + 1} · {s.label}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-headline tracking-tight mb-2.5" style={{ color: INK, fontWeight: 700, letterSpacing: "-0.02em" }}>
                      {s.title}
                    </h3>
                    <p className="text-[15px] md:text-base leading-relaxed max-w-lg mx-auto" style={{ color: MUTED }}>
                      {s.copy}
                    </p>
                  </div>
                  <div className="w-full">
                    <s.Mock />
                  </div>
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
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
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
