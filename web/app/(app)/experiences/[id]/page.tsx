import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PublicChallengeHero } from "./PublicChallengeHero";
import { PublicCreatorsBlock } from "./PublicCreatorsBlock";
import { PublicInsideExperienceBlock } from "./PublicInsideExperienceBlock";
import { PublicCommitBlock } from "./PublicCommitBlock";
import { StickyJoinCTA } from "./StickyJoinCTA";
import { buildWeeks } from "@/lib/challenges/buildWeeks";
import { loadSessionCohosts } from "@/lib/challenges/sessionCohosts";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";

export const metadata = {
  title: "Experience — INFITRA",
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
  // Viewer's own timezone (device cookie → IP header → default) so session
  // times render in their local zone, resolved server-side for stable SSR.
  const viewerTimeZone = await resolveViewerTimeZone();
  const supabase = await createClient();

  // ── Wave 1 ─────────────────────────────────────────────────────────
  // Everything keyed only on the challenge id (plus the auth lookup) is
  // independent, so fetch it all in parallel. These used to be ~5
  // sequential awaits; collapsing them into one Promise.all cuts the
  // server-side waterfall depth (worst on a Vercel cold start).
  //
  // buyerView: consolidated challenge data (promise_text is coalesced
  //   with description server-side).
  // challengeDetails: the RAW promise_text + description as separate
  //   fields so the hero card can render both (promise as H1, description
  //   as the paragraph below the cover) — Bundle 4.2.8.
  // sessionRows: host_id is selected so each session card can attribute
  //   its leading Expert (avatar + name) — Bundle 4.2.14.
  const [
    {
      data: { user },
    },
    { data: buyerView },
    { data: challengeDetails },
    { data: cohostRows },
    { data: sessionRows },
    { data: reviewStatsRow },
    { data: reviewRows },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("vw_challenge_buyer_view")
      .select("*")
      .eq("challenge_id", id)
      .maybeSingle(),
    supabase
      .from("app_challenge")
      .select("promise_text, description, intro_prompt")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("app_challenge_cohost")
      .select("cohost_id")
      .eq("challenge_id", id),
    supabase
      .from("app_challenge_session")
      .select(
        "session_id, app_session(id, title, description, image_url, start_time, duration_minutes, host_id)",
      )
      .eq("challenge_id", id),
    // Social proof — both lineage-cumulative (continuation_group_id), so a
    // run 2 page carries run 1's rating and reviews. Definer views, anon-safe.
    supabase
      .from("vw_experience_review_stats")
      .select("avg_rating, total_reviews")
      .eq("challenge_id", id)
      .maybeSingle(),
    supabase
      .from("vw_experience_reviews_public")
      .select("review_id, rating, comment, created_at, reviewer_name, reviewer_avatar_url")
      .eq("challenge_id", id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (!buyerView) notFound();
  if (buyerView.status !== "published") notFound();

  // If promise is set, both can be shown. If only description is set,
  // description becomes the H1 (existing fallback in the hero) and there's
  // no separate description block (it would duplicate the H1).
  const rawPromise = challengeDetails?.promise_text?.trim() || null;
  const rawDescription = challengeDetails?.description?.trim() || null;
  const heroPromise = rawPromise ?? rawDescription;
  const heroDescription = rawPromise ? rawDescription : null;

  const cohostIds: string[] = (cohostRows ?? []).map(
    (c: { cohost_id: string }) => c.cohost_id,
  );

  const sessions = ((sessionRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean) as Array<{
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      start_time: string;
      duration_minutes: number;
      host_id: string | null;
    }>)
    .sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  // ── Wave 2 ─────────────────────────────────────────────────────────
  // Creator profiles depend on owner_id + cohostIds (from wave 1); the
  // viewer's own membership + profile depend on the authenticated user.
  // All three are independent of one another → parallel. The viewer
  // queries no-op (resolve null) for anonymous visitors.
  const allCreatorIds = [buyerView.owner_id, ...cohostIds];
  const [{ data: creatorProfiles }, membershipRes, viewerProfileRes] =
    await Promise.all([
      supabase
        .from("app_profile")
        .select("id, display_name, avatar_url, bio, tagline, username, is_founding_expert")
        .in("id", allCreatorIds),
      user
        ? supabase
            .from("app_challenge_member")
            .select("id")
            .eq("challenge_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("app_profile")
            .select("display_name, role")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const profileById = new Map<string, {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    tagline: string | null;
    username: string | null;
    is_founding_expert: boolean | null;
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
  const creatorsById = new Map(creators.map((c) => [c.id, c]));

  // Viewer state (page is public; these are only meaningful when signed in).
  const hasPurchased = !!(membershipRes.data as { id: string } | null);
  const isCreator =
    !!user && (user.id === buyerView.owner_id || cohostIds.includes(user.id));
  const viewerProfile = viewerProfileRes.data as {
    display_name: string | null;
    role: string | null;
  } | null;
  const viewerDisplayName = viewerProfile?.display_name ?? null;
  const viewerRole = viewerProfile?.role ?? undefined;

  // ── Wave 3 ─────────────────────────────────────────────────────────
  // Per-session cohosts need the resolved creator map (wave 2); the space
  // lookup needs to know the viewer is entitled (hasPurchased/isCreator).
  // Independent of each other → parallel.
  //
  // cohostsBySession: read from the public-safe vw_challenge_session_team
  //   view — app_session_cohost itself is RLS-restricted (split_percent).
  // spaceId: the door into the cohort community. app_challenge_space.id
  //   !== source_challenge_id, so it must be resolved here, not passed as
  //   the challengeId (Bundle 4.1 bug fix).
  const needsSpace = !!user && (hasPurchased || isCreator);
  const [cohostsBySession, spaceRes] = await Promise.all([
    loadSessionCohosts(supabase, id, creatorsById),
    needsSpace
      ? supabase
          .from("app_challenge_space")
          .select("id")
          .eq("source_challenge_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const spaceId: string | null =
    (spaceRes.data as { id: string } | null)?.id ?? null;

  // Bundle 4.2.47: build the per-week structure for the now-canonical
  // WeeklyJourneyCarousel inside PublicChallengeHero. Each session
  // inside its week gets its host + cohosts attached so the agenda
  // cards can render co-led sessions with the right facepile + names.
  const weeklyArc = (buyerView.weekly_arc as Array<{ week: number; theme: string }>) ?? [];
  const rawWeeks = buildWeeks(
    buyerView.start_date,
    buyerView.end_date,
    weeklyArc,
    sessions,
  );
  const weeks = rawWeeks.map((week) => ({
    ...week,
    sessions: week.sessions.map((s) => ({
      ...s,
      host: s.host_id ? creatorsById.get(s.host_id) ?? null : null,
      cohosts: cohostsBySession.get(s.id) ?? [],
    })),
  }));

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
              // Solid cream instead of backdrop-filter blur — see ParticipantNav:
              // a fixed bar blurring the animated background re-blurs every frame
              // and janks mobile scroll. Compositor-free near-opaque fill.
              background: "rgba(244, 241, 234, 0.94)",
              borderBottom: "1px solid rgba(15, 34, 41, 0.06)",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
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
              href={`/login?returnTo=/experiences/${id}`}
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
                  ? "You're already enrolled in this program — open your tribe space below."
                  : checkoutError === "CHALLENGE_FULL"
                    ? "This program is at capacity right now. Check back soon or message the Experts."
                    : "We couldn't open Stripe checkout. Try the Commit button below, or reload the page."}
              </p>
            </div>
          </div>
        )}
        {/* Bundle 4.2.5 architecture — self-contained card + section 2:

              SECTION 1 — THE PRODUCT BUNDLE (one self-contained card)
              ├── Cover image (optional, only when set)
              └── Hero card containing the entire offer:
                  • eyebrow / promise
                  • portraits + caption
                  • dates lead + metrics + tribe line
                  • journey carousel (manual swipe, editorial sessions)
                  • price-as-CTA (the buy button IS the price display)

              SECTION 2 — WHO + INSIDE THE PROGRAM
              ├── Meet your Experts (bios + topic chips)
              ├── Inside the program (tribe selling)
              └── Second CTA — "Commit" (lives inside PublicCommitBlock)

            PublicProgramRhythm was deleted in 4.2.5 — the first CTA
            moved INSIDE the card as the price-as-CTA. PromiseBlock was
            cut in 4.2 — promise is the H1 inside the card. */}

        {/* SECTION 1 — cover image is now inside the hero card (4.2.8),
            no separate page-top band. */}
        <PublicChallengeHero
          challengeId={id}
          spaceId={spaceId}
          title={buyerView.title}
          promise={heroPromise}
          description={heroDescription}
          imageUrl={buyerView.image_url}
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          sessionCount={sessions.length}
          priceCents={buyerView.price_cents}
          currency={buyerView.currency}
          creators={creators}
          weeks={weeks}
          timeZone={viewerTimeZone}
          isAuthenticated={!!user}
          hasPurchased={hasPurchased}
          isCreator={isCreator}
          reviewStats={
            reviewStatsRow && (reviewStatsRow as any).total_reviews > 0
              ? {
                  avgRating: Number((reviewStatsRow as any).avg_rating),
                  totalReviews: (reviewStatsRow as any).total_reviews as number,
                }
              : null
          }
          reviews={(reviewRows ?? []) as any}
        />

        {/* SECTION 2 */}
        <PublicCreatorsBlock
          creators={creators}
          topicsByCreator={topicsByCreator}
        />

        <PublicInsideExperienceBlock
          experts={creators}
          introPrompt={(challengeDetails as any)?.intro_prompt ?? null}
        />

        <PublicCommitBlock
          challengeId={id}
          spaceId={spaceId}
          priceCents={buyerView.price_cents}
          currency={buyerView.currency}
          startDate={buyerView.start_date}
          endDate={buyerView.end_date}
          sessionCount={sessions.length}
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


