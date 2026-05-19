import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PublicChallengeHero } from "@/app/(app)/challenges/[id]/PublicChallengeHero";
import { PublicPromiseBlock } from "@/app/(app)/challenges/[id]/PublicPromiseBlock";
import { PublicCreatorsBlock } from "@/app/(app)/challenges/[id]/PublicCreatorsBlock";
import { PublicProgramRhythm } from "@/app/(app)/challenges/[id]/PublicProgramRhythm";
import { PublishedShareBar } from "./PublishedShareBar";

export const metadata = { title: "Collaboration Published — INFITRA" };

/**
 * Post-publish celebration / preview page.
 *
 * Bundle 4: replaces the legacy "you published, here are some stats"
 * confirmation card with a full preview of the public buyer page that
 * participants will see. The creator gets a celebratory header on top,
 * a copyable share link bar (sticky on scroll), and the same
 * components used at /challenges/[id] composed inline so they see
 * exactly what buyers see.
 *
 * Single source of truth for the buyer experience: PublicChallengeHero,
 * PublicPromiseBlock, PublicCreatorsBlock, PublicProgramRhythm all
 * come from /challenges/[id]/ and are reused here. No PublicCommitBlock
 * because a creator isn't going to buy their own program — instead the
 * commit footer is replaced with a "Share this with your community"
 * block.
 */
export default async function PublishedCelebrationPage({
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

  // Sessions with cover + description
  const { data: sessionRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, description, image_url, start_time, duration_minutes)",
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
    }>)
    .sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const topicsByCreator: Record<string, string[]> =
    (buyerView.topic_ownership as Record<string, string[]>) ?? {};

  return (
    <>
      {/* INFITRA marketing-style top nav — matches /challenges/[id]
          buyer page so the creator's preview reads as the same
          surface as what participants will see. (app) layout above
          provides cream + WaveFlowingBackground shell. */}
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
            href="/dashboard"
            className="px-5 py-2 rounded-full text-xs font-headline font-bold text-white uppercase tracking-widest"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.3)" }}
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Celebratory header strip — sits above the public preview.
          Sticky share bar takes over once the user scrolls past it.
          Top padding accounts for the fixed nav above. */}
      <header className="px-6 lg:px-12 pt-28 lg:pt-32 pb-10 lg:pb-14 text-center">
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
      </header>

      {/* Sticky share bar — visible while the creator scrolls through
          the preview, gives them a constant copyable link + view
          public page action. */}
      <PublishedShareBar challengeId={challengeId} title={buyerView.title} />

      {/* The actual public preview — same components as /challenges/[id] */}
      <main className="flex-1">
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
            href={`/challenges/${challengeId}`}
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
