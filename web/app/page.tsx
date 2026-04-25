import Image from "next/image";
import Link from "next/link";
import { WaveFlowingBackground } from "./components/WaveFlowingBackground";
import { FloatingNeonLogo } from "./components/_unused/FloatingNeonLogo";

/**
 * INFITRA — pilot landing page (editorial treatment, Path B).
 *
 * Single unified background — cream (#F2EFE8) + WaveFlowingBackground —
 * everywhere. No coloured section bands. Differentiation between sections
 * comes from typography, whitespace, and contained cards. Reads like a
 * long-form editorial article rather than a stack of coloured chunks.
 * Stays consistent with the rest of the production app shell.
 *
 * Six-act narrative arc:
 *   1. Hero — promise + identity
 *   2. Vision card — "What you can build"
 *   3. Frustration — "What's broken today" (3 sub-sections in cards)
 *   4. Manifesto bridge — single brand line in editorial whitespace
 *   5. Solution — "INFITRA makes this one product"
 *   6. Pilot CTA — confident close
 *   + Footer
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
          {/* ── HERO ────────────────────────────────────── */}
          <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
            <div className="relative max-w-4xl mx-auto w-full flex flex-col items-center">
              {/* Pilot badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10"
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

              {/* Animated cyan logo mark on cream — restored from the
                  archived component. Layered cyan halos + float-twist
                  breathing motion + depth shaders for 3D feel. */}
              <FloatingNeonLogo
                variant="cream"
                className="w-[280px] h-[280px] md:w-[340px] md:h-[340px] mb-10"
              />


              {/* Wordmark — upright, matches dashboard */}
              <p className="text-6xl md:text-7xl lg:text-8xl font-black text-[#FF6130] tracking-tighter font-headline leading-none mb-10">
                INFITRA
              </p>

              {/* Headline */}
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight leading-[1.1] max-w-3xl mb-6"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Build a program that&apos;s better than what you can offer alone.
              </h1>

              {/* Subhead */}
              <p
                className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
                style={{ color: "#475569" }}
              >
                Combine your expertise with another coach and deliver it as one seamless program
                your audience will pay more for.
              </p>

              {/* Tagline display */}
              <div className="flex items-center gap-4 mb-12 max-w-3xl w-full">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.12)" }} />
                <p
                  className="text-xs md:text-sm uppercase tracking-[0.25em] font-headline text-center shrink-0"
                  style={{ color: "#0F2229", fontWeight: 700 }}
                >
                  One program. Multiple experts. Built and sold as one.
                </p>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.12)" }} />
              </div>

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
              <p className="text-xs mt-5 tracking-wide" style={{ color: "#94a3b8" }}>
                Closed cohort of 5 fitness creator pairs. Reviewed individually.
              </p>
            </div>
          </section>

          {/* ── [2] WHAT YOU CAN BUILD ──────────────────── */}
          <section className="px-6 py-28">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <p
                  className="text-xs uppercase tracking-[0.25em] mb-4 font-headline"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  What you can build
                </p>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
                  style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  Multiple experts. One program. One unified experience.
                </h2>
              </div>

              <div
                className="rounded-3xl p-8 md:p-12"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(15,34,41,0.08)",
                  boxShadow: "0 12px 40px rgba(15,34,41,0.06)",
                }}
              >
                <div className="text-center mb-10">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 mb-4">
                    <span
                      className="text-2xl md:text-3xl font-headline"
                      style={{ color: "#FF6130", fontWeight: 700 }}
                    >
                      Fitness coach
                    </span>
                    <span
                      className="text-xl md:text-2xl"
                      style={{ color: "#94a3b8", fontWeight: 400 }}
                    >
                      ×
                    </span>
                    <span
                      className="text-2xl md:text-3xl font-headline"
                      style={{ color: "#0891b2", fontWeight: 700 }}
                    >
                      Nutritionist
                    </span>
                  </div>
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: "#475569" }}>
                    Co-create a 4-week fat-loss challenge.
                  </p>
                </div>

                <div
                  className="grid grid-cols-2 gap-4 pt-8"
                  style={{ borderTop: "1px solid rgba(15,34,41,0.08)" }}
                >
                  {["One product", "One checkout", "Clean revenue split", "No coordination mess"].map((label) => (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: "#0891b2" }}
                      />
                      <span
                        className="text-sm md:text-base font-headline"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── [3] WHAT'S BROKEN TODAY — frustration in contained cards ── */}
          <section className="px-6 py-28">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <p
                  className="text-xs uppercase tracking-[0.25em] mb-4 font-headline"
                  style={{ color: "#FF6130", fontWeight: 700 }}
                >
                  What&apos;s broken today
                </p>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight"
                  style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  Why most creator collaborations don&apos;t become real products.
                </h2>
              </div>

              <div className="space-y-6">
                {/* — Sub 01 — */}
                <div
                  className="rounded-3xl p-8 md:p-10"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(15,34,41,0.08)",
                    boxShadow: "0 8px 24px rgba(15,34,41,0.04)",
                  }}
                >
                  <div className="flex items-baseline gap-5 mb-6">
                    <span
                      className="text-5xl md:text-6xl font-headline leading-none"
                      style={{ color: "rgba(255,97,48,0.45)", fontWeight: 700 }}
                    >
                      01
                    </span>
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Creators try to do everything themselves
                    </h3>
                  </div>
                  <div className="space-y-4 text-base md:text-lg leading-relaxed pl-0 md:pl-16" style={{ color: "#3a4046" }}>
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
                      className="mt-6 p-5 rounded-2xl"
                      style={{
                        backgroundColor: "rgba(255,97,48,0.08)",
                        border: "1px solid rgba(255,97,48,0.25)",
                      }}
                    >
                      <p
                        className="text-[10px] uppercase tracking-widest font-headline mb-2"
                        style={{ color: "#FF6130", fontWeight: 700 }}
                      >
                        The result
                      </p>
                      <p
                        className="text-base md:text-lg font-headline"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        Programs that try to do everything — and don&apos;t stand out in anything.
                      </p>
                    </div>
                  </div>
                </div>

                {/* — Sub 02 — */}
                <div
                  className="rounded-3xl p-8 md:p-10"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(15,34,41,0.08)",
                    boxShadow: "0 8px 24px rgba(15,34,41,0.04)",
                  }}
                >
                  <div className="flex items-baseline gap-5 mb-6">
                    <span
                      className="text-5xl md:text-6xl font-headline leading-none"
                      style={{ color: "rgba(255,97,48,0.45)", fontWeight: 700 }}
                    >
                      02
                    </span>
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Collaboration already happens — but it&apos;s not real
                    </h3>
                  </div>
                  <div className="space-y-5 text-base md:text-lg leading-relaxed pl-0 md:pl-16" style={{ color: "#3a4046" }}>
                    <p>
                      Creators go live together. They mention each other. They create videos together.
                    </p>
                    <p style={{ color: "#0F2229", fontWeight: 700 }}>But:</p>
                    <ul className="space-y-2">
                      {[
                        "it's mostly for marketing and publicity",
                        "monetization is unclear or minimal",
                        "there is no professional setup",
                      ].map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="shrink-0 mt-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0F2229" }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="pt-3" style={{ color: "#0F2229", fontWeight: 700 }}>
                      Behind the scenes:
                    </p>
                    <ul className="space-y-2">
                      {[
                        "WhatsApp coordination",
                        "vague agreements",
                        "one person collects revenue",
                        "payouts happen on trust",
                      ].map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="shrink-0 mt-3 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#0F2229" }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p
                      className="text-base md:text-lg font-headline pt-3"
                      style={{ color: "#0F2229", fontWeight: 700 }}
                    >
                      → It never becomes a real product.
                    </p>
                  </div>
                </div>

                {/* — Sub 03 — */}
                <div
                  className="rounded-3xl p-8 md:p-10"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(15,34,41,0.08)",
                    boxShadow: "0 8px 24px rgba(15,34,41,0.04)",
                  }}
                >
                  <div className="flex items-baseline gap-5 mb-6">
                    <span
                      className="text-5xl md:text-6xl font-headline leading-none"
                      style={{ color: "rgba(255,97,48,0.45)", fontWeight: 700 }}
                    >
                      03
                    </span>
                    <h3
                      className="text-xl md:text-2xl font-headline tracking-tight"
                      style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                    >
                      Even when creators try to build together
                    </h3>
                  </div>
                  <div className="pl-0 md:pl-16">
                    <p
                      className="text-base md:text-lg leading-relaxed mb-5"
                      style={{ color: "#3a4046" }}
                    >
                      It turns into two of everything:
                    </p>
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
                      {["Two landing pages", "Two checkouts", "Two separate experiences"].map((label) => (
                        <div
                          key={label}
                          className="p-4 md:p-5 rounded-xl text-center"
                          style={{
                            backgroundColor: "rgba(15,34,41,0.05)",
                            border: "1px solid rgba(15,34,41,0.10)",
                          }}
                        >
                          <p
                            className="text-sm md:text-base font-headline leading-tight"
                            style={{ color: "#0F2229", fontWeight: 700 }}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p
                      className="text-lg md:text-xl font-headline italic"
                      style={{ color: "#0F2229", fontWeight: 700 }}
                    >
                      It feels like two coaches taped together — not one program.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── [4] INFITRA SOLUTION ────────────────────── */}
          <section className="px-6 py-24">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <p
                  className="text-xs uppercase tracking-[0.25em] mb-4 font-headline"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  The fix
                </p>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight mb-8"
                  style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  INFITRA makes this one product.
                </h2>
                <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: "#475569" }}>
                  Each creator brings 100% of their expertise — not 50% across everything.
                </p>
              </div>

              <div className="text-center mb-16">
                <div className="space-y-3 mb-10">
                  <p
                    className="text-2xl md:text-3xl font-headline tracking-tight"
                    style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    Training stays training.
                  </p>
                  <p
                    className="text-2xl md:text-3xl font-headline tracking-tight"
                    style={{ color: "#0891b2", fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    Nutrition stays nutrition.
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-center mb-8">
                  <div className="w-10 h-px" style={{ backgroundColor: "rgba(15,34,41,0.25)" }} />
                  <span
                    className="text-[10px] uppercase tracking-[0.3em] font-headline"
                    style={{ color: "#94a3b8", fontWeight: 700 }}
                  >
                    Together
                  </span>
                  <div className="w-10 h-px" style={{ backgroundColor: "rgba(15,34,41,0.25)" }} />
                </div>

                <p
                  className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight leading-[1.1]"
                  style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
                >
                  One seamless program.
                </p>

                <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mt-6" style={{ color: "#475569" }}>
                  Clearer. Stronger. Easier to sell. More valuable for the participant. Invites continuation.
                </p>
              </div>

              <div
                className="rounded-3xl p-8 md:p-10"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(15,34,41,0.08)",
                }}
              >
                <p
                  className="text-xs uppercase tracking-[0.25em] mb-6 font-headline text-center"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  What changes with INFITRA
                </p>
                <ul className="space-y-4 max-w-2xl mx-auto">
                  {[
                    "One product instead of fragmented offers",
                    "One checkout instead of split payments",
                    "One experience instead of disconnected sessions",
                    "Locked-in revenue splits — no trust games",
                    "Shared workspace to build together cleanly",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-4">
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: "rgba(8,145,178,0.12)" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={3}>
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span
                        className="text-base md:text-lg font-headline"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── [5] PILOT CTA ───────────────────────────── */}
          <section className="px-6 py-32 text-center">
            <div className="max-w-3xl mx-auto">
              <h2
                className="text-4xl md:text-5xl font-headline tracking-tight mb-6"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Be one of the first 5 pairs.
              </h2>
              <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10" style={{ color: "#475569" }}>
                We&apos;re running a closed pilot with a small cohort of fitness creator pairs in DACH
                (Switzerland, Germany, Austria).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
                {[
                  "1 joint challenge per pair",
                  "Run live with direct support",
                  "Fully set up with you",
                ].map((label) => (
                  <div
                    key={label}
                    className="p-5 rounded-2xl"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.65)",
                      border: "1px solid rgba(15,34,41,0.08)",
                    }}
                  >
                    <p className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-12" style={{ color: "#475569" }}>
                If this works, you&apos;ll have a new way to build and sell programs — not just once,
                but repeatedly.
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
              <p className="text-xs mt-5 tracking-wide" style={{ color: "#94a3b8" }}>
                Reviewed individually. Pilot launches Q3.
              </p>
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
