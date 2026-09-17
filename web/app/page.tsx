import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import { StageWaves } from "@/app/components/BrandWaves";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { createAnonClient } from "@/lib/supabase/anon";
import { StageNav } from "@/app/landing/v3/StageNav";
import { Hero } from "@/app/landing/v3/Hero";
import { Invitation } from "@/app/landing/v3/Invitation";
import { FoundingNetwork } from "@/app/landing/v3/FoundingNetwork";
import { Finale } from "@/app/landing/v3/Finale";
import { WhatYouCanBuild } from "@/app/landing/WhatYouCanBuild";
import { HowItWorks } from "@/app/landing/HowItWorks";
import { LiveWeek } from "@/app/landing/LiveWeek";
import { Summary } from "@/app/landing/Summary";
import { Footer } from "@/app/landing/Footer";

/**
 * THE LANDING (promoted from /new, 17 Sep 2026; /new now redirects here).
 *
 * The story: one dark stage carrying the whole pitch, what it is, who it is
 * for, and the ask (Hero, with the founding cards when the public reader is
 * open). Then the door into the showcase (Invitation) and the example itself,
 * how joining works with what one sale is worth (FoundingNetwork), and one
 * closing ask (Finale).
 *
 * The showcase in the middle (WhatYouCanBuild → Summary) is the same run that
 * the previous landing carried, unchanged: every visual in it is a PORT of a
 * real INFITRA surface, threaded by one experience (landing/content.ts).
 * Vocabulary: experiences, never "program"; the buyer page is the marketing
 * page.
 *
 * The cards come from the public reader alone, which returns an empty list
 * until the launch switch opens (load_founding_community's p_public_only
 * branch returns [] before it reads anything), so the hero is built to read
 * complete without them.
 */

/** The hero reads public cards; the page stays static and refreshes every
 *  five minutes instead of rendering per request. */
export const revalidate = 300;

export const metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Offer more without becoming everything. INFITRA makes professional collaboration in fitness and health easy: experts, studios and gyms create one live experience together, online.",
};

export default async function LandingPage() {
  const anon = createAnonClient();
  const { data: pub } = await anon.rpc("load_founding_community", { p_public_only: true });
  const members = (pub?.members ?? []) as FoundingMember[];

  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ backgroundColor: "#F2EFE8" }}>
      <WaveFlowingBackground />

      <div className="relative z-10">
        <StageNav />

        <main>
          {/* One sky over the opening and the model: the stage and the
             section that explains it share a single dark ground and a single
             wave field, so there is no seam between them. The bar watches
             [data-dark] to know where the run ends. */}
          <div data-dark className="relative overflow-hidden" style={{ backgroundColor: "#0C262E" }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <StageWaves id="stage" fit="slice" />
            </div>
            <div className="relative z-10">
              <Hero members={members} />
            </div>
          </div>
          <Invitation />
          <WhatYouCanBuild />
          <HowItWorks />
          <LiveWeek />
          <Summary />
          <FoundingNetwork />
          <Finale />
        </main>

        <Footer />
      </div>
    </div>
  );
}
