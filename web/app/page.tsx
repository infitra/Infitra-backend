import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { Hero } from "./landing/Hero";
import { TwoDoors } from "./landing/TwoDoors";
import { WhatYouCanBuild } from "./landing/WhatYouCanBuild";
import { HowItWorks } from "./landing/HowItWorks";
import { LiveWeek } from "./landing/LiveWeek";
import { Summary } from "./landing/Summary";
import { FoundingNetwork } from "./landing/FoundingNetwork";
import { Finale } from "./landing/Finale";
import { FoundingRow } from "./landing/FoundingRow";
import { Footer } from "./landing/Footer";

/**
 * THE LANDING — the product-showcase story (formerly polished at /new,
 * promoted here; /new now redirects home). Components live in ./landing.
 *
 * Reframed 11 Sep 2026 for the founding-network strategy. The showcase in
 * the middle is untouched and still carries the page: it is the proof that
 * makes a small ask worth saying yes to. What changed is the frame around
 * it, because the offer is no longer "found an experience with a stranger"
 * but "be in the network where the pairing is found".
 *
 *   Hero (the tension, then the ask) → Two doors (experts | studios and
 *   gyms, where the institutional track finally enters the page) →
 *   What you can build (the marketing-page example with the real browsable
 *   carousel) → ACT 1 · How it works (4-page swipe flow ending at publish)
 *   → bridge ("Now it comes alive.") → ACT 2 · One live week (the pinned
 *   time-thread chapter) → the summary reunion → The founding network (the
 *   offer, the three steps, the terms) → the live cards, once the founder
 *   opens the public reader → one closing ask.
 *
 * ONE experience threads it all: the real flagship "6-Week Sustainable
 * Fitness Reset" (./landing/content.ts). Every visual is a PORT of a real
 * INFITRA surface. Vocabulary: experiences, never "program"; the public
 * page is the marketing page.
 */

/** The founding row reads public cards; the page stays static and refreshes
 *  every five minutes instead of rendering per request (6 Sep 2026). */
export const revalidate = 300;

export const metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Offer more without becoming everything. Experts, studios and gyms create one live experience together, online. INFITRA handles the page, the checkout, the agreement, the split, the live rooms and the group space.",
};

export default function LandingPage() {
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
            {/* One door (9 Sep 2026): members who joined by invite link sign in here.
                The waitlist and apply pills went with the founding-network model;
                the landing itself is rewritten next. */}
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
