import Link from "next/link";
import { WaveFlowingBackground } from "@/app/components/WaveFlowingBackground";
import type { FoundingMember } from "@/app/components/FoundingCard";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { Hero } from "@/app/landing/v3/Hero";
import { ThreeWinners } from "@/app/landing/v3/ThreeWinners";
import { Bridge } from "@/app/landing/v3/Bridge";
import { NetworkStripe } from "@/app/landing/v3/NetworkStripe";
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
 * The story: the tension and the definition (Hero), the opportunity named
 * per side with the independence line (ThreeWinners), one line into the
 * proof (Bridge), the shared showcase, the founding network as a dark stripe
 * once it holds cards (NetworkStripe), how joining works with the terms
 * (FoundingNetwork), one closing ask (Finale).
 *
 * The showcase in the middle is shared with the live page, never forked.
 *
 * Preview: the public reader is closed until launch, so `?preview=cards`
 * lets a signed-in admin see the stripe with the cards the network holds
 * today. Reading the query makes this route dynamic, which is fine for a
 * noindex staging page; the promotion drops the preview and restores ISR.
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

  if (members.length < 3 && preview === "cards") {
    // The member/admin branch of the same reader: the database decides who
    // may see the cards, the page only passes them on.
    const supabase = await createClient();
    const { data: full } = await supabase.rpc("load_founding_community", { p_public_only: false });
    if (full?.authorized === true) {
      members = (full.members ?? []) as FoundingMember[];
      previewMode = members.length > 0;
    }
  }

  const showStripe = members.length >= 3 || previewMode;

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
          <ThreeWinners />
          <Bridge />
          <WhatYouCanBuild />
          <HowItWorks />
          <LiveWeek />
          <Summary />
          <NetworkStripe members={showStripe ? members : []} preview={previewMode} />
          <FoundingNetwork forming={!showStripe} />
          <Finale />
        </main>

        <Footer />
      </div>
    </div>
  );
}
