import Link from "next/link";
import { WaveFlowingBackground } from "./components/WaveFlowingBackground";

/**
 * INFITRA — pilot landing page (visual-first, low cognitive load).
 *
 * Structure:
 *   1. Hero — clear upgrade, headline-dominant
 *   2. Visual diagram — "2 experts → 1 program"
 *   3. Where it comes alive — typographic bridge, heartbeat ECG metaphor
 *   4. What you can build — production-style challenge preview (real images)
 *   5. Final CTA — "Be one of the first 5 pairs"
 *   6. Collapsible depth — "See why this matters" (broken/fixed + pains)
 *   + Footer
 *
 * Single CTA at the bottom of the visual arc — no mid-page CTA before
 * the collapsible. Believers convert at the CTA. Skeptics scroll one
 * more notch and open "See why this matters." The page is scannable in
 * 30 seconds; the full argument is one click away.
 *
 * Cream + WaveFlowingBackground throughout — same shell as the rest
 * of the production app.
 */
export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* ── NAV ──────────────────────────────────────── */}
        <nav className="fixed top-0 w-full z-40">
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(242, 239, 232, 0.55)",
              backdropFilter: "blur(20px) saturate(1.2)",
              WebkitBackdropFilter: "blur(20px) saturate(1.2)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/logo-mark.png"
                alt="INFITRA"
                width={34}
                height={34}
                className="block rounded-lg"
              />
              <span
                className="text-[22px] tracking-tight font-headline leading-none"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </Link>
            <Link
              href="/apply"
              className="px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              Apply
            </Link>
          </div>
        </nav>

        <main>
          {/* ── [1] HERO — headline-dominant ───────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
            <div className="relative max-w-4xl mx-auto w-full flex flex-col items-center">
              {/* DESCRIPTIVE LABEL — what INFITRA actually is. Small, quiet,
                  cyan rules. Answers "what is this?" so the headline can
                  stay punchy without losing first-time visitors. */}
              <div className="flex items-center gap-3 mb-6 max-w-2xl w-full">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
                <p
                  className="text-[10px] uppercase tracking-[0.25em] font-headline text-center shrink-0"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  The workspace for live, co-created fitness programs
                </p>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(8,145,178,0.30)" }} />
              </div>

              {/* Pilot badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
                style={{
                  backgroundColor: "rgba(8, 145, 178, 0.10)",
                  border: "1px solid rgba(8, 145, 178, 0.25)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] animate-pulse" />
                <span
                  className="text-[#0891b2] text-[10px] tracking-widest uppercase font-headline"
                  style={{ fontWeight: 700 }}
                >
                  Closed Pilot · Applications Open
                </span>
              </div>

              {/* HEADLINE — the punch. Vertical ("fitness") deliberately
                  dropped here because the label above already carries it;
                  repeating felt redundant and weakened the rhythm. */}
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-headline tracking-tight leading-[1.05] max-w-3xl mb-6"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Build a program beyond what you can offer alone.
              </h1>

              {/* Subline — single sentence that carries mechanism (combine
                  expertise), product (one seamless program), and the
                  time-bound dimension (real-time, follow together). */}
              <p
                className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
                style={{ color: "#475569" }}
              >
                Combine your expertise with other experts and deliver it
                as one seamless program people follow together in real time.
              </p>

              {/* CTA */}
              <Link
                href="/apply"
                className="inline-block px-12 py-4 rounded-full text-white text-lg font-headline tracking-wide transition-transform hover:scale-[1.03]"
                style={{
                  backgroundColor: "#FF6130",
                  fontWeight: 700,
                  boxShadow: "0 8px 28px rgba(255,97,48,0.35), 0 2px 10px rgba(255,97,48,0.20)",
                }}
              >
                Apply for the pilot
              </Link>
              <p className="text-xs mt-4 tracking-wide" style={{ color: "#94a3b8" }}>
                Closed cohort of 5 fitness creator pairs. Reviewed individually.
              </p>
            </div>
          </section>

          {/* ── [2] VISUAL — "2 experts → 1 program" ───── */}
          <section className="px-6 py-24">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-4 items-center">
                {/* Left expert — Alex (with OWNER badge top-right) */}
                <div
                  className="relative rounded-3xl p-8 text-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,97,48,0.25)",
                  }}
                >
                  {/* Ownership badge — makes the governance model visible */}
                  <span
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                    style={{
                      color: "#FF6130",
                      backgroundColor: "rgba(255,97,48,0.10)",
                      border: "1px solid rgba(255,97,48,0.30)",
                      fontWeight: 700,
                    }}
                  >
                    Owner · 60%
                  </span>
                  <div
                    className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-4"
                    style={{
                      border: "2px solid rgba(255,97,48,0.35)",
                      boxShadow: "0 6px 20px rgba(255,97,48,0.18)",
                    }}
                  >
                    <img
                      src="/landing/avatar-alex.jpg"
                      alt="Alex, the trainer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p
                    className="text-base md:text-lg font-headline"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    Alex
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-widest font-headline mt-1"
                    style={{ color: "#FF6130", fontWeight: 700 }}
                  >
                    Trainer
                  </p>
                </div>

                {/* Arrow → (cyan SVG, replaces gray ASCII) */}
                <div className="hidden md:flex items-center justify-center">
                  <svg width="56" height="14" viewBox="0 0 56 14" fill="none" aria-hidden>
                    <line x1="2" y1="7" x2="48" y2="7" stroke="#0891b2" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M42 2 L50 7 L42 12" stroke="#0891b2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Center: One Program — substanced.
                    Top stripe (orange→cyan) signals "blends both creators".
                    Overlapping mini avatars + 8 session dots + duration give
                    the card actual visual weight, matching the expert cards
                    on either side instead of looking like an empty label. */}
                <div
                  className="rounded-3xl overflow-hidden text-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,97,48,0.08) 0%, rgba(8,145,178,0.08) 100%)",
                    border: "1px solid rgba(15,34,41,0.10)",
                    boxShadow: "0 12px 40px rgba(15,34,41,0.06)",
                  }}
                >
                  {/* Cover stripe — both brand colors merging */}
                  <div
                    className="h-1.5"
                    style={{
                      background: "linear-gradient(90deg, #FF6130 0%, #9CF0FF 100%)",
                    }}
                  />
                  <div className="p-6 md:p-7">
                    {/* Mini overlapping avatars — visual focal point that
                        balances the larger avatars in the flanking cards */}
                    <div className="flex items-center justify-center -space-x-3 mb-4">
                      <img
                        src="/landing/avatar-alex.jpg"
                        alt=""
                        className="w-11 h-11 rounded-full object-cover relative z-10"
                        style={{ border: "3px solid #F2EFE8" }}
                      />
                      <img
                        src="/landing/avatar-mira.jpg"
                        alt=""
                        className="w-11 h-11 rounded-full object-cover"
                        style={{ border: "3px solid #F2EFE8" }}
                      />
                    </div>

                    {/* Title */}
                    <p
                      className="text-lg md:text-xl font-headline tracking-tight"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      One Program
                    </p>

                    {/* Session dots — 8 dots with kickoff + finale highlighted.
                        Visualises the time-bound rhythm without crowding. */}
                    <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                        const isAnchor = i === 0 || i === 7;
                        return (
                          <span
                            key={i}
                            className="rounded-full"
                            style={{
                              width: isAnchor ? 6 : 4,
                              height: isAnchor ? 6 : 4,
                              backgroundColor: isAnchor ? "#0891b2" : "rgba(8,145,178,0.30)",
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Duration caption */}
                    <p
                      className="text-[10px] uppercase tracking-[0.25em] font-headline"
                      style={{ color: "#0891b2", fontWeight: 700 }}
                    >
                      8 Sessions · 4 Weeks
                    </p>
                  </div>
                </div>

                {/* Arrow ← (cyan SVG, mirrored) */}
                <div className="hidden md:flex items-center justify-center">
                  <svg width="56" height="14" viewBox="0 0 56 14" fill="none" aria-hidden>
                    <line x1="8" y1="7" x2="54" y2="7" stroke="#0891b2" strokeWidth={1.5} strokeLinecap="round" />
                    <path d="M14 2 L6 7 L14 12" stroke="#0891b2" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Right expert — Mira (with COHOST badge top-right) */}
                <div
                  className="relative rounded-3xl p-8 text-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(8,145,178,0.25)",
                  }}
                >
                  <span
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-headline"
                    style={{
                      color: "#0891b2",
                      backgroundColor: "rgba(8,145,178,0.10)",
                      border: "1px solid rgba(8,145,178,0.30)",
                      fontWeight: 700,
                    }}
                  >
                    Cohost · 40%
                  </span>
                  <div
                    className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-4"
                    style={{
                      border: "2px solid rgba(8,145,178,0.35)",
                      boxShadow: "0 6px 20px rgba(8,145,178,0.18)",
                    }}
                  >
                    <img
                      src="/landing/avatar-mira.jpg"
                      alt="Mira, the nutritionist"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p
                    className="text-base md:text-lg font-headline"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    Mira
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-widest font-headline mt-1"
                    style={{ color: "#0891b2", fontWeight: 700 }}
                  >
                    Nutritionist
                  </p>
                </div>
              </div>

              {/* ── SYSTEM FEATURES (compact chips) — what the system gives
                  every collaboration: workspace, contracts, splits, and
                  clear ownership. Live sits in the experience-layer
                  section below ("Where it comes alive"), not here. */}
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {[
                  {
                    label: "Shared Workspace",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="6" width="13" height="13" rx="2.5" />
                        <rect x="8" y="3" width="13" height="13" rx="2.5" />
                      </svg>
                    ),
                  },
                  {
                    label: "Signed Contracts",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 15l2 2 4-4" />
                      </svg>
                    ),
                  },
                  {
                    label: "Automated Splits",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3v9l7.8 4.5" />
                      </svg>
                    ),
                  },
                  {
                    label: "Clear Ownership",
                    icon: (
                      // Two stylized figures — one larger/forward (owner),
                      // one smaller/behind (cohost). Reads as "owner + cohosts".
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="8" r="3" />
                        <path d="M3 20v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1" />
                        <circle cx="17" cy="9" r="2.2" />
                        <path d="M15 14a4 4 0 0 1 6 3.5v1" />
                      </svg>
                    ),
                  },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.78)",
                      border: "1px solid rgba(8,145,178,0.20)",
                    }}
                  >
                    <span
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "rgba(8,145,178,0.10)" }}
                    >
                      {feature.icon}
                    </span>
                    <span
                      className="text-xs md:text-[13px] font-headline leading-tight"
                      style={{ color: "#0F2229", fontWeight: 700 }}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── [3] WHERE IT COMES ALIVE — typographic bridge ── */}
          <section className="px-6 py-24">
            <div className="max-w-3xl mx-auto text-center">
              {/* Beat 1: alone → together */}
              <p
                className="text-2xl md:text-4xl font-headline tracking-tight leading-[1.15]"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Most programs are followed alone.
                <br />
                <span style={{ color: "#FF6130" }}>This one isn&apos;t.</span>
              </p>

              {/* Thin cyan rule */}
              <div
                className="w-10 h-px mx-auto my-10"
                style={{ backgroundColor: "rgba(8,145,178,0.55)" }}
              />

              {/* Beat 2: live sessions are the anchors */}
              <p
                className="text-xl md:text-2xl font-headline tracking-tight leading-snug mb-3"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Live sessions are the anchors.
              </p>
              <p
                className="text-base md:text-lg leading-relaxed max-w-xl mx-auto"
                style={{ color: "#475569" }}
              >
                Show up. Train together. Get real-time guidance.
              </p>

              {/* ── Heartbeat-calendar hybrid — the rhythm made concrete ──
                  The existing 2-spike heartbeat evolved into 8 spikes
                  evenly spread across a 4-week canvas. Same single visual
                  element now does both jobs: poetic rhythm metaphor AND
                  literal calendar structure (8 live anchors, 4 weeks).
                  No new visual added; just one upgraded. */}
              <div className="mt-12 mb-8">
                <p
                  className="text-center text-[10px] uppercase tracking-[0.25em] font-headline mb-4"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  4 Weeks · 8 Live Anchors
                </p>

                <div className="flex items-center justify-center">
                  {(() => {
                    // Eight anchor positions, evenly spaced across the
                    // viewBox. Two anchors per week, four weeks total.
                    const anchors = [50, 150, 250, 350, 450, 550, 650, 750];
                    let path = "M 0 40";
                    anchors.forEach((x) => {
                      path += ` L ${x - 12} 40 L ${x - 4} 12 L ${x + 4} 68 L ${x + 12} 40`;
                    });
                    path += " L 800 40";

                    return (
                      <svg
                        viewBox="0 0 800 80"
                        className="w-full max-w-2xl h-14 md:h-20"
                        fill="none"
                        aria-hidden
                      >
                        {/* Subtle dashed baseline — the "between sessions"
                            continuous time, with the heartbeat punctuating it */}
                        <path
                          d="M 0 40 L 800 40"
                          stroke="rgba(15,34,41,0.10)"
                          strokeWidth={1}
                          strokeDasharray="2 4"
                        />
                        {/* The 8-anchor heartbeat */}
                        <path
                          d={path}
                          stroke="#0891b2"
                          strokeWidth={2.25}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Pulsing dot at each anchor — staggered so the
                            wave moves left-to-right across the timeline.
                            Reads as "the program moving forward in time." */}
                        {anchors.map((x, i) => (
                          <circle key={x} cx={x} cy={40} r={5} fill="#0891b2">
                            <animate
                              attributeName="opacity"
                              values="0.4;1;0.4"
                              dur="3.2s"
                              begin={`${i * 0.4}s`}
                              repeatCount="indefinite"
                            />
                          </circle>
                        ))}
                      </svg>
                    );
                  })()}
                </div>

                {/* Week markers — quietly anchor the calendar reading.
                    Equally spaced beneath the heartbeat (max-w matches
                    the SVG above so they line up with the right anchor
                    pairs in their week). */}
                <div className="w-full max-w-2xl mx-auto grid grid-cols-4 mt-2">
                  {["W1", "W2", "W3", "W4"].map((w) => (
                    <p
                      key={w}
                      className="text-center text-[10px] uppercase tracking-widest font-headline"
                      style={{ color: "#94a3b8", fontWeight: 700 }}
                    >
                      {w}
                    </p>
                  ))}
                </div>
              </div>

              {/* Beat 3: rhythm captions — what happens in the dashed
                  baseline (between) vs the spikes (live moments). */}
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.25em] font-headline mb-1"
                    style={{ color: "#94a3b8", fontWeight: 700 }}
                  >
                    Between sessions
                  </p>
                  <p
                    className="text-sm md:text-base font-headline"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    Progress and share with challenge community
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.25em] font-headline mb-1"
                    style={{ color: "#0891b2", fontWeight: 700 }}
                  >
                    Live moments
                  </p>
                  <p
                    className="text-sm md:text-base font-headline"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    Everything comes together
                  </p>
                </div>
              </div>

              {/* Closing line dropped — the heartbeat-calendar already
                  visualises "structure + peak moments." Saying it in
                  text after showing it visually was redundant. */}
            </div>
          </section>

          {/* ── [4] WHAT YOU CAN BUILD — production challenge preview ── */}
          <section className="px-6 py-24">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <p
                  className="text-xs uppercase tracking-[0.25em] mb-3 font-headline"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  An example
                </p>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
                  style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  What you can build.
                </h2>
              </div>

              {/* The mockup card — composed to look like the real challenge view.
                  Floating treatment (heavy shadow) reinforces "this is the product." */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(15,34,41,0.08)",
                  boxShadow:
                    "0 30px 80px rgba(15,34,41,0.18), 0 10px 30px rgba(15,34,41,0.08)",
                }}
              >
                {/* Cover — taller aspect + anchored top so the duo stays in frame */}
                <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[2/1] overflow-hidden bg-[#0F2229]">
                  <img
                    src="/landing/challenge-cover.jpg"
                    alt="The Reset — a 4-week joint challenge"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                  {/* Bottom gradient for legibility of overlay chips */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(15,34,41,0.55) 0%, rgba(15,34,41,0) 100%)",
                    }}
                  />
                  {/* Live chip top-left */}
                  <span
                    className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-headline"
                    style={{
                      backgroundColor: "rgba(15,34,41,0.85)",
                      color: "#9CF0FF",
                      fontWeight: 700,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
                    Live · 4 weeks
                  </span>
                </div>

                <div className="p-6 md:p-10">
                  {/* Title + subtitle */}
                  <h3
                    className="text-2xl md:text-4xl font-headline tracking-tight"
                    style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
                  >
                    The Reset
                  </h3>
                  <p
                    className="text-sm md:text-base mt-2 mb-6"
                    style={{ color: "#475569" }}
                  >
                    Train smart. Eat right. Show up live, together.
                  </p>

                  {/* Two creators — visual parity, no hierarchy */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255,97,48,0.06)",
                        border: "1px solid rgba(255,97,48,0.18)",
                      }}
                    >
                      <div
                        className="shrink-0 w-10 h-10 rounded-full overflow-hidden"
                        style={{ border: "1.5px solid rgba(255,97,48,0.35)" }}
                      >
                        <img
                          src="/landing/avatar-alex.jpg"
                          alt="Alex"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-headline truncate"
                          style={{ color: "#0F2229", fontWeight: 700 }}
                        >
                          Alex
                        </p>
                        <p
                          className="text-[10px] uppercase tracking-widest font-headline"
                          style={{ color: "#FF6130", fontWeight: 700 }}
                        >
                          Trainer
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 p-3 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(8,145,178,0.06)",
                        border: "1px solid rgba(8,145,178,0.18)",
                      }}
                    >
                      <div
                        className="shrink-0 w-10 h-10 rounded-full overflow-hidden"
                        style={{ border: "1.5px solid rgba(8,145,178,0.35)" }}
                      >
                        <img
                          src="/landing/avatar-mira.jpg"
                          alt="Mira"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-headline truncate"
                          style={{ color: "#0F2229", fontWeight: 700 }}
                        >
                          Mira
                        </p>
                        <p
                          className="text-[10px] uppercase tracking-widest font-headline"
                          style={{ color: "#0891b2", fontWeight: 700 }}
                        >
                          Nutritionist
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Facts strip */}
                  <div
                    className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 py-3 px-4 rounded-2xl text-xs md:text-sm font-headline mb-8"
                    style={{
                      backgroundColor: "rgba(15,34,41,0.04)",
                      color: "#0F2229",
                      fontWeight: 700,
                    }}
                  >
                    <span>4 weeks</span>
                    <span style={{ color: "#94a3b8" }}>·</span>
                    <span>8 live sessions</span>
                  </div>

                  {/* Sessions label */}
                  <div className="flex items-baseline justify-between mb-4">
                    <p
                      className="text-[10px] uppercase tracking-[0.25em] font-headline"
                      style={{ color: "#0F2229", fontWeight: 700 }}
                    >
                      Sessions
                    </p>
                    <p
                      className="text-[10px] uppercase tracking-widest font-headline"
                      style={{ color: "#94a3b8", fontWeight: 700 }}
                    >
                      First 3 of 8
                    </p>
                  </div>

                  {/* Sessions row — horizontal scroll on mobile, grid on desktop */}
                  <div className="-mx-6 md:-mx-10 px-6 md:px-10 overflow-x-auto md:overflow-visible">
                    <div className="grid grid-cols-3 gap-3 md:gap-4 min-w-[480px] md:min-w-0">
                      {/* Session 1 — Intro, both creators */}
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "#F8F6F0",
                          border: "1px solid rgba(15,34,41,0.06)",
                        }}
                      >
                        <div className="relative aspect-[4/3] bg-[#0F2229] overflow-hidden">
                          <img
                            src="/landing/session-intro.jpg"
                            alt="Kickoff session with both coaches"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p
                            className="text-[9px] uppercase tracking-widest font-headline mb-1"
                            style={{ color: "#94a3b8", fontWeight: 700 }}
                          >
                            Week 1 · Mon
                          </p>
                          <p
                            className="text-xs md:text-sm font-headline leading-snug mb-2"
                            style={{ color: "#0F2229", fontWeight: 700 }}
                          >
                            Kickoff — meet your coaches
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-5 h-5 rounded-full overflow-hidden">
                              <img
                                src="/landing/avatar-alex.jpg"
                                alt="Alex"
                                className="w-full h-full object-cover"
                              />
                            </span>
                            <span
                              className="inline-block w-5 h-5 rounded-full overflow-hidden -ml-2"
                              style={{ border: "1.5px solid #F8F6F0" }}
                            >
                              <img
                                src="/landing/avatar-mira.jpg"
                                alt="Mira"
                                className="w-full h-full object-cover"
                              />
                            </span>
                            <span
                              className="ml-1.5 text-[10px] font-headline"
                              style={{ color: "#475569", fontWeight: 700 }}
                            >
                              Alex + Mira
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Session 2 — Trainer */}
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "#F8F6F0",
                          border: "1px solid rgba(15,34,41,0.06)",
                        }}
                      >
                        <div className="relative aspect-[4/3] bg-[#0F2229] overflow-hidden">
                          <img
                            src="/landing/session-trainer.jpg"
                            alt="Strength foundations with Alex"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p
                            className="text-[9px] uppercase tracking-widest font-headline mb-1"
                            style={{ color: "#94a3b8", fontWeight: 700 }}
                          >
                            Week 1 · Thu
                          </p>
                          <p
                            className="text-xs md:text-sm font-headline leading-snug mb-2"
                            style={{ color: "#0F2229", fontWeight: 700 }}
                          >
                            Build your base
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-5 h-5 rounded-full overflow-hidden">
                              <img
                                src="/landing/avatar-alex.jpg"
                                alt="Alex"
                                className="w-full h-full object-cover"
                              />
                            </span>
                            <span
                              className="text-[10px] font-headline"
                              style={{ color: "#FF6130", fontWeight: 700 }}
                            >
                              Alex
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Session 3 — Nutritionist */}
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          backgroundColor: "#F8F6F0",
                          border: "1px solid rgba(15,34,41,0.06)",
                        }}
                      >
                        <div className="relative aspect-[4/3] bg-[#0F2229] overflow-hidden">
                          <img
                            src="/landing/session-nutritionist.jpg"
                            alt="Eat for energy with Mira"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p
                            className="text-[9px] uppercase tracking-widest font-headline mb-1"
                            style={{ color: "#94a3b8", fontWeight: 700 }}
                          >
                            Week 2 · Tue
                          </p>
                          <p
                            className="text-xs md:text-sm font-headline leading-snug mb-2"
                            style={{ color: "#0F2229", fontWeight: 700 }}
                          >
                            Eat for energy
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block w-5 h-5 rounded-full overflow-hidden">
                              <img
                                src="/landing/avatar-mira.jpg"
                                alt="Mira"
                                className="w-full h-full object-cover"
                              />
                            </span>
                            <span
                              className="text-[10px] font-headline"
                              style={{ color: "#0891b2", fontWeight: 700 }}
                            >
                              Mira
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── [5] FINAL CTA ──────────────────────────── */}
          <section className="px-6 py-32 text-center">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-4xl md:text-5xl font-headline tracking-tight mb-6"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Be one of the first 5 pairs.
              </h2>
              <p
                className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10"
                style={{ color: "#475569" }}
              >
                Closed pilot with fitness creator pairs in DACH (Switzerland, Germany, Austria).
                One joint challenge per pair, run live with direct support.
              </p>

              <Link
                href="/apply"
                className="inline-block px-12 py-4 rounded-full text-white text-lg font-headline tracking-wide transition-transform hover:scale-[1.03]"
                style={{
                  backgroundColor: "#FF6130",
                  fontWeight: 700,
                  boxShadow: "0 8px 28px rgba(255,97,48,0.35), 0 2px 10px rgba(255,97,48,0.20)",
                }}
              >
                Apply for the pilot
              </Link>
              <p className="text-xs mt-4 tracking-wide" style={{ color: "#94a3b8" }}>
                Reviewed individually. Pilot launches Q3.
              </p>
            </div>
          </section>

          {/* ── [6] COLLAPSIBLE DEPTH — quiet final beat for skeptics ── */}
          <section className="px-6 py-20">
            <div className="max-w-3xl mx-auto">
              <details className="group">
                <summary
                  className="cursor-pointer list-none flex items-center justify-center gap-3 text-sm md:text-base font-headline transition-opacity hover:opacity-80"
                  style={{ color: "#475569", fontWeight: 700 }}
                >
                  <span>See why this matters</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="transition-transform group-open:rotate-180"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>

                <div className="mt-10 space-y-6">
                  {/* — Sub: Two of everything (broken / fixed) — */}
                  <div
                    className="rounded-3xl p-8"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(15,34,41,0.08)",
                    }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight mb-6"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Even when collaborations happen — it&apos;s two of everything
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Broken */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          backgroundColor: "rgba(255,97,48,0.05)",
                          border: "1px solid rgba(255,97,48,0.18)",
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-widest font-headline mb-3"
                          style={{ color: "#FF6130", fontWeight: 700 }}
                        >
                          Today
                        </p>
                        <ul className="space-y-1.5">
                          {["Two landing pages", "Two checkouts", "Fragmented experience"].map(
                            (item) => (
                              <li
                                key={item}
                                className="text-sm md:text-base font-headline"
                                style={{ color: "#475569", fontWeight: 700 }}
                              >
                                {item}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      {/* Fixed */}
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          backgroundColor: "rgba(8,145,178,0.06)",
                          border: "1px solid rgba(8,145,178,0.22)",
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-widest font-headline mb-3"
                          style={{ color: "#0891b2", fontWeight: 700 }}
                        >
                          INFITRA
                        </p>
                        <ul className="space-y-1.5">
                          {["One product", "One checkout", "Unified experience"].map((item) => (
                            <li
                              key={item}
                              className="text-sm md:text-base font-headline"
                              style={{ color: "#0F2229", fontWeight: 700 }}
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* — Sub: Do everything themselves — */}
                  <div
                    className="rounded-3xl p-8"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(15,34,41,0.08)",
                    }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight mb-5"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Creators try to do everything themselves
                    </h3>
                    <div className="space-y-3 text-base leading-relaxed" style={{ color: "#475569" }}>
                      <p>
                        A trainer adds meal plans. A nutrition coach adds workouts. Everyone tries to sell
                        a &ldquo;complete&rdquo; program.
                      </p>
                      <p>But this spreads focus.</p>
                      <p>
                        Instead of delivering their strongest expertise, they dilute it across areas they
                        don&apos;t fully own.
                      </p>
                      <div
                        className="mt-5 p-4 rounded-2xl"
                        style={{
                          backgroundColor: "rgba(255,97,48,0.08)",
                          border: "1px solid rgba(255,97,48,0.25)",
                        }}
                      >
                        <p
                          className="text-[10px] uppercase tracking-widest font-headline mb-1"
                          style={{ color: "#FF6130", fontWeight: 700 }}
                        >
                          The result
                        </p>
                        <p
                          className="text-base font-headline"
                          style={{ color: "#0F2229", fontWeight: 700 }}
                        >
                          Programs that try to do everything — and don&apos;t stand out in anything.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* — Sub: Collaboration not real — */}
                  <div
                    className="rounded-3xl p-8"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(15,34,41,0.08)",
                    }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight mb-5"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Collaboration already happens — but it&apos;s not real
                    </h3>
                    <div className="space-y-4 text-base leading-relaxed" style={{ color: "#475569" }}>
                      <p>
                        Creators go live together. They mention each other. They create videos together.
                      </p>
                      <p style={{ color: "#0F2229", fontWeight: 700 }}>But:</p>
                      <ul className="space-y-1.5 pl-1">
                        {[
                          "it's mostly for marketing and publicity",
                          "monetization is unclear or minimal",
                          "there is no professional setup",
                        ].map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-[#0F2229]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="pt-2" style={{ color: "#0F2229", fontWeight: 700 }}>
                        Behind the scenes:
                      </p>
                      <ul className="space-y-1.5 pl-1">
                        {[
                          "WhatsApp coordination",
                          "vague agreements",
                          "one person collects revenue",
                          "payouts happen on trust",
                        ].map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="shrink-0 mt-2.5 w-1.5 h-1.5 rounded-full bg-[#0F2229]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <p
                        className="text-base font-headline pt-2"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        → It never becomes a real product.
                      </p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </section>

        </main>

        {/* ── FOOTER ───────────────────────────────────── */}
        <footer
          style={{
            borderTop: "1px solid rgba(15,34,41,0.08)",
            backgroundColor: "rgba(242,239,232,0.6)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="INFITRA" width={28} height={28} className="block rounded-md" />
              <span
                className="text-base tracking-tight font-headline"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </div>
            <div className="flex gap-6 text-xs" style={{ color: "#94a3b8" }}>
              <Link href="/pilot-terms" className="hover:opacity-80">Pilot Terms</Link>
              <a href="mailto:hello@infitra.fit" className="hover:opacity-80">Contact</a>
              <span>© 2026 INFITRA</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
