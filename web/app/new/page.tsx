import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { StageNav } from "@/app/landing/v3/StageNav";
import { Hero } from "@/app/landing/v3/Hero";
import { ThreeWinners } from "@/app/landing/v3/ThreeWinners";
import { WhatItIs } from "@/app/landing/v3/WhatItIs";
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
 * The story: the dark stage with the opportunity, what INFITRA provides and
 * the network itself (Hero), the opportunity per side with the two shapes
 * that produce it (ThreeWinners), what an experience is and what it costs to
 * try (WhatItIs), the shared showcase as the example, how joining works with
 * the terms (FoundingNetwork), one closing ask (Finale).
 *
 * The showcase in the middle is shared with the live page, never forked.
 *
 * Preview: the public reader is closed until launch, so `?preview=cards` lets
 * a signed-in admin see the hero as it will stand with the cards the network
 * holds today. Reading the query makes this route dynamic, which is fine for
 * a noindex staging page; the promotion drops the preview and restores ISR.
 */
export const metadata = {
  title: "INFITRA · Live, co-created fitness experiences",
  description:
    "Offer more without becoming everything. INFITRA makes professional collaboration in fitness and health easy: experts, studios and gyms create one live experience together, online.",
  robots: { index: false, follow: false },
};

export default async function LandingStagingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;

  const anon = createAnonClient();
  const { data: pub } = await anon.rpc("load_founding_community", { p_public_only: true });
  let members = (pub?.members ?? []) as FoundingMember[];
  let previewMode = false;

  if (members.length === 0 && preview === "cards") {
    // The member/admin branch of the same reader: the database decides who
    // may see the cards, the page only passes them on.
    const supabase = await createClient();
    const { data: full } = await supabase.rpc("load_founding_community", { p_public_only: false });
    if (full?.authorized === true) {
      members = (full.members ?? []) as FoundingMember[];
      previewMode = members.length > 0;
    }

    // PREVIEW SCAFFOLD (12 Sep 2026): the band only drifts once three
    // profiles can fill it, and the network holds fewer. Repeating what is
    // there lets the motion be judged before launch. Admin only: previewMode
    // is set from the RPC's authorised branch and never from the public
    // read, so nothing here can reach a visitor. Delete this block once the
    // network holds three profiles of its own.
    if (previewMode && members.length < 3) {
      const real = members;
      members = Array.from({ length: 3 }, (_, i) => ({
        ...real[i % real.length],
        id: `${real[i % real.length].id}#preview${i}`,
      }));
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-clip" style={{ backgroundColor: "#F2EFE8" }}>
      <WaveFlowingBackground />

      <div className="relative z-10">
        <StageNav />

        <main>
          <Hero members={members} preview={previewMode} />
          <ThreeWinners />
          <WhatItIs />
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
