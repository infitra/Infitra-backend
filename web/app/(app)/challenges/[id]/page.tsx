import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout_error?: string }>;
}) {
  const { id } = await params;
  const { checkout_error: checkoutError } = await searchParams;
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
  let viewerDisplayName: string | null = null;
  let viewerRole: string | undefined = undefined;
  // spaceId is the door into the cohort community (/communities/challenge/[spaceId]).
  // Bundle 4.1 bug fix: previously the "Open challenge space" links passed
  // challengeId directly, but app_challenge_space.id !== source_challenge_id —
  // those links were broken. Resolve the space here and pass its ID down.
  let spaceId: string | null = null;
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

    if (hasPurchased || isCreator) {
      const { data: space } = await supabase
        .from("app_challenge_space")
        .select("id")
        .eq("source_challenge_id", id)
        .maybeSingle();
      spaceId = space?.id ?? null;
    }

    // Fetch viewer profile for the app-style nav (display_name + role
    // drive whether ParticipantNav shows creator links like Home /
    // Earnings / + Create or just the participant version).
    const { data: viewerProfile } = await supabase
      .from("app_profile")
      .select("display_name, role")
      .eq("id", user.id)
      .maybeSingle();
    viewerDisplayName = viewerProfile?.display_name ?? null;
    viewerRole = viewerProfile?.role ?? undefined;
  }

  // topic_ownership shape: { [creator_profile_id]: string[] }
  const topicsByCreator: Record<string, string[]> =
    (buyerView.topic_ownership as Record<string, string[]>) ?? {};

  return (
    <>
      {/* Chrome — auth-aware:
          • Authenticated viewers (the common case for creators viewing
            their own page, participants browsing, and anyone returning
            after sign-in) see the full app nav (ParticipantNav). Home /
            Earnings / Create for creators; Sign out + user menu for
            everyone. Reads as "you are in INFITRA, this is a program
            inside it" — not a separate marketing page.
          • Anonymous viewers (stranger landing from a DM share) see a
            minimal marketing-style nav: logo + Sign-in CTA. They're
            discovering the offer, not navigating the app. */}
      {user ? (
        <ParticipantNav displayName={viewerDisplayName} role={viewerRole} />
      ) : (
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
              href={`/login?returnTo=/challenges/${id}`}
              className="px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
            >
              Sign in
            </Link>
          </div>
        </nav>
      )}

      <main>
        {/* Buy-flow recovery banner — Bundle 4.1.
            When intent=buy:* lands the user back here instead of on
            Stripe (already purchased, capacity, rate limit, network
            error), the post-auth helper appends ?checkout_error=...
            so we can explain what happened in-context rather than
            silently dropping them on the page. */}
        {checkoutError && (
          <div className="pt-24 px-6 max-w-2xl mx-auto">
            <div
              className="rounded-2xl p-4"
              style={{
                backgroundColor: "rgba(255,97,48,0.08)",
                border: "1px solid rgba(255,97,48,0.25)",
              }}
            >
              <p
                className="text-[10px] font-bold font-headline uppercase tracking-[0.18em] mb-1"
                style={{ color: "#c2410c" }}
              >
                Checkout didn&apos;t open
              </p>
              <p className="text-sm" style={{ color: "#0F2229" }}>
                {checkoutError === "ALREADY_PURCHASED"
                  ? "You're already enrolled in this program — open the cohort space below."
                  : checkoutError === "CHALLENGE_FULL"
                    ? "This program is at capacity right now. Check back soon or message the creators."
                    : "We couldn't open Stripe checkout. Try the Join button below, or reload the page."}
              </p>
            </div>
          </div>
        )}
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
          spaceId={spaceId}
          title={buyerView.title}
          priceCents={buyerView.price_cents}
          currency={buyerView.currency}
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          sessionCount={sessions.length}
          creatorCount={creators.length}
          spotsLeft={buyerView.spots_left ?? null}
          isAuthenticated={!!user}
          hasPurchased={hasPurchased}
          isCreator={isCreator}
        />
      </main>

      <StickyJoinCTA
        challengeId={id}
        spaceId={spaceId}
        priceCents={buyerView.price_cents}
        currency={buyerView.currency}
        isAuthenticated={!!user}
        hasPurchased={hasPurchased}
        isCreator={isCreator}
      />
    </>
  );
}
