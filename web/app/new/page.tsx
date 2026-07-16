import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { Hero } from "./Hero";
import { WhatYouCanBuild } from "./WhatYouCanBuild";
import { HowItWorks } from "./HowItWorks";
import { TakenCareOf } from "./TakenCareOf";
import { Bridge, TheRoom } from "./TheRoom";
import { FoundingPilot } from "./FoundingPilot";
import { Process } from "./Process";
import { Depth, Footer } from "./Depth";

/**
 * LANDING V2 — the product-showcase landing (LANDING_V2_PLAN.md, round 2
 * structure per founder direction).
 *
 * Lives at /new as the production polishing workspace; promoted to / once
 * approved (then this route goes away). noindex until promotion.
 *
 * One story in two acts, one runway to Apply:
 *   Hero (headline only) → What you can build (the marketing-page example
 *   with the real browsable carousel) → ACT 1 · How it works (4-page swipe
 *   flow ending at publish) → bridge ("Published. Now it comes alive.") →
 *   ACT 2 · How it unfolds (the space with its real header, the engagement
 *   loop, the live moment, the continuation) → Everything taken care of
 *   (the two-act manifest recap + CTA) → The founding pilot → The path +
 *   final CTA → depth.
 *
 * ONE experience threads it all: the real flagship "6-Week Sustainable
 * Fitness Reset" (./content.ts). Every visual is a PORT of a real INFITRA
 * surface. Vocabulary: experiences, never "program"; the public page is the
 * marketing page.
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
          <WhatYouCanBuild />
          <HowItWorks />
          <Bridge />
          <TheRoom />
          <TakenCareOf />
          <FoundingPilot />
          <Process />
          <Depth />
        </main>

        <Footer />
      </div>
    </div>
  );
}
