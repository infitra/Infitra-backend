import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicChallengeHero } from "./PublicChallengeHero";
import { PublicPromiseBlock } from "./PublicPromiseBlock";
import { PublicCreatorsBlock } from "./PublicCreatorsBlock";
import { PublicProgramRhythm } from "./PublicProgramRhythm";
import { PublicCommitBlock } from "./PublicCommitBlock";
import { StickyJoinCTA } from "./StickyJoinCTA";

export const metadata = {
  title: "Challenge — INFITRA",
};

// Bundle 4: public buyer page. Editorial / magazine-style scroll
// composed of dedicated components per beat. Public-readable (no auth
// required to view); auth required only at purchase time. The same
// components are reused inline in the post-publish success page so
// the creator sees exactly what participants see.

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Buyer view — consolidated challenge data from vw_challenge_buyer_view
  const { data: buyerView } = await supabase
    .from("vw_challenge_buyer_view")
    .select("*")
    .eq("challenge_id", id)
    .maybeSingle();

  if (!buyerView) notFound();
  if (buyerView.status !== "published") notFound();

  // Cohorts → IDs
  const { data: cohostRows } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", id);
  const cohostIds: string[] = (cohostRows ?? []).map((c: { cohost_id: string }) => c.cohost_id);

  // All creator profiles (owner + cohosts)
  const allCreatorIds = [buyerView.owner_id, ...cohostIds];
  const { data: creatorProfiles } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url, bio, tagline, username")
    .in("id", allCreatorIds);

  const profileById = new Map<string, {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    tagline: string | null;
    username: string | null;
  }>();
  for (const p of creatorProfiles ?? []) {
    profileById.set((p as any).id, p as any);
  }

  // Build ordered creator list: owner first, cohosts after
  const owner = profileById.get(buyerView.owner_id);
  const cohostProfiles = cohostIds
    .map((cid) => profileById.get(cid))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const creators = [
    ...(owner ? [{ ...owner, role: "owner" as const }] : []),
    ...cohostProfiles.map((p) => ({ ...p, role: "cohost" as const })),
  ];

  // Sessions, with cover image + description
  const { data: sessionRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, description, image_url, start_time, duration_minutes)",
    )
    .eq("challenge_id", id);

  const sessions = ((sessionRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean) as Array<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      start_time: string;
      duration_minutes: number;
    }>)
    .sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  // User state (only if authenticated; page is public)
  let hasPurchased = false;
  let isCreator = false;
  if (user) {
    const { data: membership } = await supabase
      .from("app_challenge_member")
      .select("id")
      .eq("challenge_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasPurchased = !!membership;
    isCreator =
      user.id === buyerView.owner_id || cohostIds.includes(user.id);
  }

  // topic_ownership shape: { [creator_profile_id]: string[] }
  const topicsByCreator: Record<string, string[]> =
    (buyerView.topic_ownership as Record<string, string[]>) ?? {};

  return (
    <>
      {/* INFITRA marketing-style top nav — same fixed glass-blur
          treatment as the landing page. Auth-aware CTA: Sign in for
          anonymous visitors (the common case via DM share), Dashboard
          for authenticated. Matches the landing-page nav pattern so
          the buyer page reads as "an INFITRA page about this program"
          rather than a separated microsite. The (app) layout above
          provides the cream + WaveFlowingBackground shell. */}
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
            href={user ? "/dashboard" : `/login?returnTo=/challenges/${id}`}
            className="px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>

      <main>
        <PublicChallengeHero
          title={buyerView.title}
          imageUrl={buyerView.image_url}
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          sessionCount={sessions.length}
          creators={creators}
        />

        {buyerView.promise_text && buyerView.promise_text.trim() && (
          <PublicPromiseBlock
            promise={buyerView.promise_text}
            creators={creators}
          />
        )}

        <PublicCreatorsBlock
          creators={creators}
          topicsByCreator={topicsByCreator}
        />

        <PublicProgramRhythm
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          weeklyArc={(buyerView.weekly_arc as Array<{ week: number; theme: string }>) ?? []}
          sessions={sessions}
        />

        <PublicCommitBlock
          challengeId={id}
          title={buyerView.title}
          priceCents={buyerView.price_cents}
          currency={buyerView.currency}
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          sessionCount={sessions.length}
          creatorCount={creators.length}
          isAuthenticated={!!user}
          hasPurchased={hasPurchased}
          isCreator={isCreator}
        />
      </main>

      <StickyJoinCTA
        challengeId={id}
        priceCents={buyerView.price_cents}
        currency={buyerView.currency}
        isAuthenticated={!!user}
        hasPurchased={hasPurchased}
        isCreator={isCreator}
      />
    </>
  );
}
