import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PublicChallengeHero } from "@/app/(app)/experiences/[id]/PublicChallengeHero";
import { PublicCreatorsBlock } from "@/app/(app)/experiences/[id]/PublicCreatorsBlock";
import { PublicBeyondLiveBlock } from "@/app/(app)/experiences/[id]/PublicBeyondLiveBlock";
import { PublishedShareBar } from "./PublishedShareBar";
import { buildWeeks } from "@/lib/challenges/buildWeeks";
import { loadSessionCohosts } from "@/lib/challenges/sessionCohosts";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";

export const metadata = { title: "Collaboration Published — INFITRA" };

/**
 * Post-publish celebration / preview page.
 *
 * Bundle 4: replaces the legacy "you published, here are some stats"
 * confirmation card with a full preview of the public buyer page that
 * participants will see. The creator gets a celebratory header on top,
 * a copyable share link bar (sticky on scroll), and the same
 * components used at /experiences/[id] composed inline so they see
 * exactly what buyers see.
 *
 * Single source of truth for the buyer experience: PublicChallengeHero,
 * PublicCreatorsBlock, PublicBeyondLiveBlock all come from
 * /experiences/[id]/ and are reused here. No PublicCommitBlock because
 * a creator isn't going to buy their own program — instead the commit
 * footer is replaced with a "Share this with your community" block.
 */
export default async function PublishedCelebrationPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const viewerTimeZone = await resolveViewerTimeZone();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Buyer view — same source as the public page (single source of truth)
  const { data: buyerView } = await supabase
    .from("vw_challenge_buyer_view")
    .select("*")
    .eq("challenge_id", challengeId)
    .maybeSingle();

  if (!buyerView) redirect("/dashboard");

  // Viewer must be a party to the collaboration (owner or cohost).
  const isOwner = buyerView.owner_id === user.id;
  const { data: cohostRow } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", challengeId)
    .eq("cohost_id", user.id)
    .maybeSingle();
  if (!isOwner && !cohostRow) redirect("/dashboard");

  // If publish hasn't actually completed yet, bounce back to the workspace.
  if (buyerView.status !== "published") {
    redirect(`/dashboard/collaborate/${challengeId}`);
  }

  // Raw promise + description for the hero card's two-beat treatment
  // (Bundle 4.2.8). Same logic as /experiences/[id]/page.tsx.
  const { data: challengeDetails } = await supabase
    .from("app_challenge")
    .select("promise_text, description")
    .eq("id", challengeId)
    .maybeSingle();
  const rawPromise = challengeDetails?.promise_text?.trim() || null;
  const rawDescription = challengeDetails?.description?.trim() || null;
  const heroPromise = rawPromise ?? rawDescription;
  const heroDescription = rawPromise ? rawDescription : null;

  // All cohorts + profiles (for the creator block)
  const { data: cohostRows } = await supabase
    .from("app_challenge_cohost")
    .select("cohost_id")
    .eq("challenge_id", challengeId);
  const cohostIds: string[] = (cohostRows ?? []).map((c: { cohost_id: string }) => c.cohost_id);

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

  const owner = profileById.get(buyerView.owner_id);
  const cohostProfiles = cohostIds
    .map((cid) => profileById.get(cid))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const creators = [
    ...(owner ? [{ ...owner, role: "owner" as const }] : []),
    ...cohostProfiles.map((p) => ({ ...p, role: "cohost" as const })),
  ];

  // Sessions with cover + description + host (Bundle 4.2.14)
  const { data: sessionRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, description, image_url, start_time, duration_minutes, host_id)",
    )
    .eq("challenge_id", challengeId);

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

  const topicsByCreator: Record<string, string[]> =
    (buyerView.topic_ownership as Record<string, string[]>) ?? {};

  // Bundle 4.2.47: build the per-week structure for the now-canonical
  // WeeklyJourneyCarousel inside PublicChallengeHero. Mirrors the
  // buyer page's assembly so the post-publish preview shows exactly
  // what participants will see.
  const weeklyArc = (buyerView.weekly_arc as Array<{ week: number; theme: string }>) ?? [];
  const rawWeeks = buildWeeks(
    buyerView.start_date,
    buyerView.end_date,
    weeklyArc,
    sessions,
  );
  const creatorsById = new Map(creators.map((c) => [c.id, c]));
  // Per-session cohosts — same public-safe view path as the buyer page.
  const cohostsBySession = await loadSessionCohosts(
    supabase,
    challengeId,
    creatorsById,
  );
  const weeks = rawWeeks.map((week) => ({
    ...week,
    sessions: week.sessions.map((s) => ({
      ...s,
      host: s.host_id ? creatorsById.get(s.host_id) ?? null : null,
      cohosts: cohostsBySession.get(s.id) ?? [],
    })),
  }));

  return (
    <>
      {/* Dashboard layout (/(app)/dashboard/layout.tsx) already
          provides the app's full Home / Earnings / +Create nav with
          user menu and notification bell — same chrome the creator
          uses everywhere else inside INFITRA. The success page reads
          as "you're in your dashboard, viewing the published
          preview" rather than a separate landing-style page. */}

      {/* Celebratory header strip — sits above the public preview.
          Sticky share bar takes over once the user scrolls past it. */}
      <header className="px-6 lg:px-12 pt-6 lg:pt-10 pb-10 lg:pb-14 text-center">
        <Link
          href="/dashboard"
          className="text-xs font-bold font-headline mb-4 inline-block hover:underline"
          style={{ color: "#94a3b8" }}
        >
          ← Back to dashboard
        </Link>
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
          style={{ color: "#FF6130" }}
        >
          Published
        </p>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight"
          style={{ color: "#0F2229" }}
        >
          You&apos;re live.
        </h1>
        <p
          className="text-base lg:text-lg mt-4 max-w-xl mx-auto leading-relaxed"
          style={{ color: "#475569" }}
        >
          This is what participants will see. Share the link with your community.
        </p>
        <a
          href="/dashboard/calendar"
          download
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-xs font-bold font-headline transition-transform hover:scale-[1.01]"
          style={{
            color: "#0891b2",
            backgroundColor: "rgba(8,145,178,0.08)",
            boxShadow: "inset 0 0 0 1.5px rgba(8,145,178,0.30)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Add your sessions to your calendar
        </a>
      </header>

      {/* Sticky share bar — visible while the creator scrolls through
          the preview, gives them a constant copyable link + view
          public page action. */}
      <PublishedShareBar challengeId={challengeId} title={buyerView.title} />

      {/* The actual public preview — same architecture as /experiences/[id].
          Bundle 4.2.5: self-contained card + section 2.
            SECTION 1 — Cover image (optional) + self-contained product
                        card (the price-as-CTA inside the card renders
                        as a preview badge because isCreator=true)
            SECTION 2 — Experts / Inside the program

          PublicCommitBlock is replaced by the "Share this" footer below —
          creators don't buy their own programs. */}
      <main className="flex-1">
        <PublicChallengeHero
          challengeId={challengeId}
          spaceId={null}
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
          isAuthenticated={true}
          hasPurchased={false}
          isCreator={true}
        />

        <PublicCreatorsBlock
          creators={creators}
          topicsByCreator={topicsByCreator}
        />

        <PublicBeyondLiveBlock />
      </main>

      {/* Creator-only commit-replacement footer: "Share this" block
          instead of a buy CTA. Mirrors the buyer page's commit beat
          spacing so the page rhythm is preserved. Transparent at
          top so the (app) layout's cream + wave shines through. */}
      <section
        className="px-6 lg:px-12 py-16 lg:py-24"
        style={{
          background:
            "linear-gradient(180deg, rgba(242,239,232,0) 0%, rgba(255,97,48,0.05) 100%)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-[10px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
            style={{ color: "#94a3b8" }}
          >
            Next step
          </p>
          <h2
            className="text-3xl lg:text-4xl font-black font-headline tracking-tight mb-4"
            style={{ color: "#0F2229" }}
          >
            Get the word out
          </h2>
          <p
            className="text-base lg:text-lg leading-relaxed mb-8"
            style={{ color: "#475569" }}
          >
            Your program lives at the link above. Share it in your community,
            DMs, or wherever your people are.
          </p>
          <Link
            href={`/experiences/${challengeId}`}
            className="inline-block px-6 py-3.5 rounded-full text-white text-sm font-black font-headline transition-transform hover:scale-[1.01]"
            style={{
              backgroundColor: "#FF6130",
              boxShadow:
                "0 6px 20px rgba(255,97,48,0.40), 0 2px 6px rgba(255,97,48,0.20)",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open public page ↗
          </Link>
        </div>
      </section>
    </>
  );
}

