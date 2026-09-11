import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { Hero } from "@/app/landing/v3/Hero";
import { TwoDoors } from "@/app/landing/v3/TwoDoors";
import { FoundingNetwork } from "@/app/landing/v3/FoundingNetwork";
import { Finale } from "@/app/landing/v3/Finale";
import { WhatYouCanBuild } from "@/app/landing/WhatYouCanBuild";
import { HowItWorks } from "@/app/landing/HowItWorks";
import { LiveWeek } from "@/app/landing/LiveWeek";
import { Summary } from "@/app/landing/Summary";
import { FoundingRow } from "@/app/landing/FoundingRow";
import { Footer } from "@/app/landing/Footer";

/**
 * /new — THE LANDING STAGING SURFACE (11 Sep 2026).
 *
 * The next landing is built and polished here while the live page at / keeps
 * selling the current story untouched. When this one is finished, its
 * sections replace the live page and /new goes back to being a redirect.
 * That is the same path the current landing took.
 *
 * What is being reframed: the live page opens on the product and the terms
 * and closes by asking a stranger to found an experience with someone they
 * have not met. The offer is now a profile in a forming network, so this
 * version opens on the tension, gives studios and gyms a door of their own
 * directly under the hero, and closes on the small ask.
 *
 * The showcase in the middle is deliberately shared with the live page, not
 * copied: it is the proof that makes a small ask worth a yes, and LiveWeek
 * carries a closed mobile-scroll tuning that must not be forked.
 *
 * noindex while it is a draft.
 */
export const revalidate = 300;

export const metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Offer more without becoming everything. Experts, studios and gyms create one live experience together, online.",
  robots: { index: false, follow: false },
};

export default function LandingStagingPage() {
  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ backgroundColor: "#F2EFE8" }}>
      <WaveFlowingBackground />

      <div className="relative z-10">
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
            <Link href="/new" className="flex items-center gap-2.5">
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
              href="/login"
              className="px-4 sm:px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest whitespace-nowrap"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              Sign in
            </Link>
          </div>
        </nav>

        <main>
          <Hero />
          <TwoDoors />
          <WhatYouCanBuild />
          <HowItWorks />
          <LiveWeek />
          <Summary />
          <FoundingNetwork />
          <FoundingRow />
          <Finale />
        </main>

        <Footer />
      </div>
    </div>
  );
}
