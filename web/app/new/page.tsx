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
 * /new: THE LANDING STAGING SURFACE (11 Sep 2026).
 *
 * The next landing is built and polished here while the live page at / keeps
 * selling the current story untouched. When this one is finished, its
 * sections replace the live page on the founder's word and /new goes back to
 * being a redirect, the same path the current landing took.
 *
 * The story: one dark stage carrying the whole pitch, what it is, who it is
 * for, what they keep, the network and the ask (Hero). Then the door into the
 * showcase (Invitation), the example itself, how joining works with what one
 * sale is worth (FoundingNetwork), one closing ask (Finale).
 *
 * The showcase in the middle is shared with the live page, never forked.
 *
 * The preview scaffold is gone (17 Sep 2026). `?preview=cards` let a
 * signed-in admin see the hero with the network's real cards, padded by
 * repeating one profile so the band had something behind its edge. It had
 * done its job, and a duplicated member is not a thing to keep standing near
 * a page about to go public. The route is static again.
 *
 * The cards on this page come from the public reader alone, which returns an
 * empty list until the launch switch opens: load_founding_community's
 * p_public_only branch returns [] before it reads anything.
 */
export const metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Offer more without becoming everything. INFITRA makes professional collaboration in fitness and health easy: experts, studios and gyms create one live experience together, online.",
  robots: { index: false, follow: false },
};

export const revalidate = 300;

export default async function LandingStagingPage() {
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
