import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PublicChallengeHero } from "@/app/(app)/experiences/[id]/PublicChallengeHero";
import { PublicCreatorsBlock } from "@/app/(app)/experiences/[id]/PublicCreatorsBlock";
import { PublicBeyondLiveBlock } from "@/app/(app)/experiences/[id]/PublicBeyondLiveBlock";
import { loadBuyerRenderData } from "@/lib/challenges/buyerRenderData";
import { resolveViewerTimeZone } from "@/lib/time/viewerTimeZone";

export const metadata = { title: "Preview — INFITRA" };
export const dynamic = "force-dynamic";

/**
 * Pre-publish buyer preview (H4-lean). A creator-only snapshot of the REAL
 * buyer page rendered from the current draft, so they see exactly what
 * participants will get before pulling the publish trigger. Reuses the same
 * Public* blocks + assembly as the post-publish page (loadBuyerRenderData) so
 * the two can't drift. Not a live two-pane editor (deferred post-pilot).
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Source from app_challenge directly — vw_challenge_buyer_view is
  // published/completed-only, so it can't serve a draft.
  const { data: c } = await supabase
    .from("app_challenge")
    .select(
      "id, title, image_url, start_date, end_date, price_cents, currency, status, owner_id, promise_text, description, weekly_arc, topic_ownership"
    )
    .eq("id", challengeId)
    .maybeSingle();
  if (!c) redirect("/dashboard");

  // Creator-only — it's their draft (owner or co-host).
  const isOwner = c.owner_id === user.id;
  let isCohost = false;
  if (!isOwner) {
    const { data: ch } = await supabase
      .from("app_challenge_cohost")
      .select("cohost_id")
      .eq("challenge_id", challengeId)
      .eq("cohost_id", user.id)
      .maybeSingle();
    isCohost = !!ch;
  }
  if (!isOwner && !isCohost) redirect("/dashboard");

  // Already published → the canonical preview is the post-publish page.
  if (c.status === "published") {
    redirect(`/dashboard/collaborate/${challengeId}/published`);
  }

  const viewerTimeZone = await resolveViewerTimeZone();
  const { creators, topicsByCreator, weeks, sessions, heroPromise, heroDescription } =
    await loadBuyerRenderData(supabase, {
      id: c.id,
      owner_id: c.owner_id,
      start_date: c.start_date,
      end_date: c.end_date,
      weekly_arc: c.weekly_arc,
      topic_ownership: c.topic_ownership,
      promise_text: c.promise_text,
      description: c.description,
    });

  return (
    <>
      <header className="px-6 lg:px-12 pt-6 lg:pt-10 pb-8 text-center">
        <Link
          href={`/dashboard/collaborate/${challengeId}`}
          className="text-xs font-bold font-headline mb-4 inline-block hover:underline"
          style={{ color: "#94a3b8" }}
        >
          ← Back to workspace
        </Link>
        <p
          className="text-[11px] font-bold font-headline uppercase tracking-[0.25em] mb-3"
          style={{ color: "#0891b2" }}
        >
          Preview
        </p>
        <h1
          className="text-3xl sm:text-4xl font-black font-headline tracking-tight"
          style={{ color: "#0F2229" }}
        >
          This is what participants will see
        </h1>
        <p className="text-base mt-3 max-w-xl mx-auto leading-relaxed" style={{ color: "#475569" }}>
          A preview of your buyer page from the current draft — nothing is
          published yet.
        </p>
      </header>

      <main className="flex-1">
        <PublicChallengeHero
          challengeId={challengeId}
          spaceId={null}
          title={c.title}
          promise={heroPromise}
          description={heroDescription}
          imageUrl={c.image_url}
          startDate={c.start_date}
          endDate={c.end_date}
          sessionCount={sessions.length}
          priceCents={c.price_cents}
          currency={c.currency}
          creators={creators}
          weeks={weeks}
          timeZone={viewerTimeZone}
          isAuthenticated={true}
          hasPurchased={false}
          isCreator={true}
          reviewStats={null}
          reviews={[]}
        />

        <PublicCreatorsBlock creators={creators} topicsByCreator={topicsByCreator} />

        <PublicBeyondLiveBlock />
      </main>
    </>
  );
}
