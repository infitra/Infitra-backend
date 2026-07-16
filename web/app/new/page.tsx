import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { Hero } from "./Hero";
import { FourMoves } from "./FourMoves";
import { Money } from "./Money";
import { Bridge, TheRoom } from "./TheRoom";
import { Continues } from "./Continues";
import { Handled } from "./Handled";
import { FoundingPilot } from "./FoundingPilot";
import { Process } from "./Process";
import { Depth, Footer } from "./Depth";

/**
 * LANDING V2 — the product-showcase landing (LANDING_V2_PLAN.md, confirmed).
 *
 * Lives at /new as the production polishing workspace; promoted to / once
 * approved (then this route goes away). noindex until promotion.
 *
 * One story, one runway to Apply:
 *   Hero (the claim + the artifact) → Four moves (yours) → The fifth move
 *   (money, automatic) → bridge → The room (theirs) → It continues →
 *   Everything handled → The founding pilot → The path + final CTA → depth.
 *
 * Every mockup is populated from ./content.ts — real flagship data, labeled
 * "Example experience". Vocabulary: experiences, never "program".
 */

export const metadata = {
  title: "INFITRA — Live, co-created fitness experiences",
  description:
    "Build an experience beyond what you can offer alone. Two experts, one live experience — page, checkout, contract, revenue split, live rooms and tribe, handled.",
  robots: { index: false, follow: false }, // polishing workspace — noindex until promoted to /
};

export default function LandingV2Page() {
  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ backgroundColor: "#F2EFE8" }}>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-mark.png" alt="INFITRA" width={34} height={34} className="block rounded-lg" />
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
          <Hero />
          <FourMoves />
          <Money />
          <Bridge />
          <TheRoom />
          <Continues />
          <Handled />
          <FoundingPilot />
          <Process />
          <Depth />
        </main>

        <Footer />
      </div>
    </div>
  );
}
