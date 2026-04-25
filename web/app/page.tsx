import Image from "next/image";
import Link from "next/link";
import { WaveFlowingBackground } from "./components/WaveFlowingBackground";

/**
 * INFITRA — pilot landing page.
 *
 * One-screen pitch focused on the pilot wedge: cross-discipline fitness
 * creators running joint challenges as a single product. Invite-only.
 * Uses the production Infitra background (cream + WaveFlowing) and keeps
 * the floating logo-mark animation (`float-twist` keyframes in globals.css).
 */
export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-clip"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      <WaveFlowingBackground />

      <div className="relative z-10">
        {/* ── NAV ── */}
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
                className="text-[22px] tracking-tight font-headline leading-none italic"
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
          {/* ── HERO ── */}
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
                  Closed Pilot · DACH · Applications Open
                </span>
              </div>

              {/* ── Floating logo mark — clean cyan glow, no dark backdrop.
                  The cyan logo on cream + cyan-wave background reads as
                  warm, premium, alive. Lets the brand colours speak rather
                  than imposing a dark stage on the page. ── */}
              <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] mb-10 flex items-center justify-center">
                {/* Soft cyan halo — biggest, most diffuse */}
                <div className="absolute inset-0 scale-[1.6] rounded-full bg-[#9CF0FF]/40 blur-[90px]" />
                {/* Tighter inner glow for definition */}
                <div className="absolute inset-0 scale-[1.1] rounded-full bg-[#9CF0FF]/35 blur-[40px]" />

                <div className="float-twist absolute inset-0">
                  {/* Subtle warm ground shadow */}
                  <div className="absolute w-[60%] h-[8%] bottom-[-6%] left-[20%] rounded-full bg-[#0F2229]/15 blur-[12px]" />

                  {/* Dark underside */}
                  <div
                    className="absolute w-full h-full translate-y-[1px]"
                    style={{
                      filter: "brightness(0.6) saturate(1.4)",
                      maskImage: "linear-gradient(to top, black 25%, transparent 75%)",
                      WebkitMaskImage: "linear-gradient(to top, black 25%, transparent 75%)",
                    }}
                  >
                    <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
                  </div>

                  {/* Base mark */}
                  <div className="absolute w-full h-full">
                    <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
                  </div>

                  {/* Mid-tone depth bottom-right */}
                  <div
                    className="absolute w-full h-full"
                    style={{
                      maskImage: "linear-gradient(315deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 35%, transparent 55%)",
                      WebkitMaskImage: "linear-gradient(315deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 35%, transparent 55%)",
                      filter: "brightness(0.65) saturate(1.5)",
                    }}
                  >
                    <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
                  </div>

                  {/* Highlight top-left */}
                  <div
                    className="absolute w-full h-full"
                    style={{
                      maskImage: "linear-gradient(140deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                      WebkitMaskImage: "linear-gradient(140deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                      filter: "brightness(1.4) saturate(0.85)",
                    }}
                  >
                    <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
                  </div>

                  {/* Specular rim top-left */}
                  <div
                    className="absolute w-full h-full"
                    style={{
                      maskImage: "linear-gradient(150deg, rgba(0,0,0,0.4) 0%, transparent 22%)",
                      WebkitMaskImage: "linear-gradient(150deg, rgba(0,0,0,0.4) 0%, transparent 22%)",
                      filter: "brightness(1.85) saturate(0.5)",
                    }}
                  >
                    <Image src="/logo-mark-cyan.png" alt="INFITRA" fill className="object-contain" />
                  </div>
                </div>
              </div>

              {/* INFITRA wordmark — uses the same chunky synthesised-italic
                  treatment as the auth + onboarding wordmarks, scaled up
                  for the hero. font-black + tracking-tighter is the brand
                  feel that production has always rendered. */}
              <p className="text-7xl md:text-8xl lg:text-9xl font-black text-[#FF6130] tracking-tighter font-headline italic leading-none mb-8">
                INFITRA
              </p>

              {/* The pitch headline */}
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-headline tracking-tight leading-[1.05] max-w-3xl mb-6"
                style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
              >
                Run your next challenge with a coach your audience doesn&apos;t have.
              </h1>

              <p
                className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
                style={{ color: "#475569" }}
              >
                Pair your training with complementary expertise. Co-design one program. Sell it
                as one product. Split revenue cleanly.
              </p>

              {/* Primary CTA */}
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

          {/* ── THE EXAMPLE — concrete, one card ── */}
          <section className="px-6 py-28">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs font-headline font-bold uppercase tracking-[0.2em] mb-3"
                   style={{ color: "#0891b2" }}>
                  What you can build
                </p>
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight"
                    style={{ color: "#0F2229" }}>
                  Two experts. One program. One unified experience.
                </h2>
              </div>

              <div
                className="rounded-3xl p-8 md:p-10"
                style={{
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(15,34,41,0.08)",
                  boxShadow: "0 8px 32px rgba(15,34,41,0.04)",
                }}
              >
                <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: "#0F2229" }}>
                  A <span style={{ color: "#FF6130", fontWeight: 700 }}>fitness trainer</span> teams up
                  with a <span style={{ color: "#0891b2", fontWeight: 700 }}>nutritionist</span> to
                  co-create a 4-week fat-loss journey.
                </p>
                <p className="text-base leading-relaxed" style={{ color: "#475569" }}>
                  Their audiences each see one program — not two coaches tag-teaming.
                  Participants buy once, get the full experience, and pay a premium because the value is holistic.
                  Behind the scenes, INFITRA handles the workspace, the contract, the unified checkout, and the revenue split.
                </p>
              </div>
            </div>
          </section>

          {/* ── THREE PROPS — what we solve ── */}
          <section className="px-6 py-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-xs font-headline font-bold uppercase tracking-[0.2em] mb-3"
                   style={{ color: "#0891b2" }}>
                  What's broken today
                </p>
                <h2 className="text-3xl md:text-4xl font-headline font-bold tracking-tight max-w-2xl mx-auto"
                    style={{ color: "#0F2229" }}>
                  Two creators collaborating used to mean two of everything.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    badge: "Without INFITRA",
                    title: "Two checkouts, two emails, two PayPal links.",
                    fix: "INFITRA delivers it as one program. One sale. One participant experience.",
                  },
                  {
                    badge: "Without INFITRA",
                    title: "Splits via WhatsApp. Trust on faith.",
                    fix: "Contract engine locks revenue splits up front. Both sides know the terms before launch.",
                  },
                  {
                    badge: "Without INFITRA",
                    title: "Coordination in group chats. No shared editor.",
                    fix: "Shared workspace where both creators co-design, lock terms, and publish together.",
                  },
                ].map(({ badge, title, fix }) => (
                  <div
                    key={title}
                    className="rounded-2xl p-6"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(15,34,41,0.08)",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest font-headline mb-3"
                       style={{ color: "rgba(15,34,41,0.45)" }}>
                      {badge}
                    </p>
                    <p className="text-base font-headline font-bold mb-3 leading-snug" style={{ color: "#0F2229" }}>
                      {title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                      {fix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PILOT FRAMING + CTA REPEAT ── */}
          <section className="px-6 py-32">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tight mb-5"
                  style={{ color: "#0F2229" }}>
                Be one of the first 5 pairs.
              </h2>
              <p className="text-base md:text-lg leading-relaxed mb-3 max-w-xl mx-auto" style={{ color: "#475569" }}>
                We're piloting with a small cohort of fitness creator pairs in DACH (Switzerland, Germany,
                Austria). One joint challenge per pair, run live with our personal support throughout.
              </p>
              <p className="text-sm mb-10" style={{ color: "#94a3b8" }}>
                Reviewed individually. Pilot launches Q3.
              </p>

              <Link
                href="/apply"
                className="inline-block px-10 py-4 rounded-full text-white text-base font-headline font-bold tracking-wide transition-transform hover:scale-[1.03]"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow: "0 6px 24px rgba(255,97,48,0.35), 0 2px 8px rgba(255,97,48,0.20)",
                }}
              >
                Apply for the pilot
              </Link>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(15,34,41,0.08)",
            backgroundColor: "rgba(242,239,232,0.6)",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="INFITRA" width={28} height={28} className="block rounded-md" />
              <span
                className="text-base tracking-tight font-headline italic"
                style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                INFITRA
              </span>
            </div>
            <p className="text-xs leading-relaxed text-center md:text-left max-w-xs"
               style={{ color: "#94a3b8" }}>
              The collaboration platform for fitness creators.
            </p>
            <div className="flex gap-6 text-xs" style={{ color: "#94a3b8" }}>
              <Link href="/pilot-terms" className="hover:opacity-80">Pilot Terms</Link>
              <a href="mailto:hello@infitra.fit" className="hover:opacity-80">Contact</a>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 py-4"
               style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}>
            <p className="text-[10px] uppercase tracking-widest font-bold font-headline"
               style={{ color: "rgba(15,34,41,0.35)" }}>
              © 2026 INFITRA
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
