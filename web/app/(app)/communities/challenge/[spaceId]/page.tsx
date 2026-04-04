import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = {
  title: "Tribe — INFITRA",
};

export default async function ChallengeTribePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch space
  const { data: space } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, owner_id, source_challenge_id")
    .eq("id", spaceId)
    .single();

  if (!space) notFound();

  // Fetch challenge info
  let challengeTitle: string | null = null;
  if (space.source_challenge_id) {
    const { data: challenge } = await supabase
      .from("app_challenge")
      .select("title")
      .eq("id", space.source_challenge_id)
      .single();
    challengeTitle = challenge?.title ?? null;
  }

  // Check posting rights via RPC
  const { data: canPostResult } = await supabase.rpc(
    "can_post_in_challenge_space",
    { p_space: spaceId, p_user: user.id }
  );
  const canPost = canPostResult === true;

  // Member count
  const { count: memberCount } = await supabase
    .from("app_challenge_space_member")
    .select("user_id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  // Owner profile
  const { data: owner } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", space.owner_id)
    .single();

  // User profile for nav
  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          {/* Back */}
          <Link
            href="/communities"
            className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-8 flex items-center gap-1.5 font-headline"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Communities
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-bold text-[#FF6130]/60 bg-[#FF6130]/10 px-2.5 py-1 rounded-full font-headline">
                TRIBE
              </span>
              <span className="text-xs text-[#9CF0FF]/25">
                {memberCount ?? 0} member
                {(memberCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
              {space.title}
            </h1>

            {/* Challenge + owner info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF6130]/10 border border-[#FF6130]/20 flex items-center justify-center">
                <span className="text-xs font-black text-[#FF6130] font-headline">
                  {(owner?.display_name ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-white font-headline">
                  {owner?.display_name}
                </p>
                {challengeTitle && (
                  <Link
                    href={`/challenges/${space.source_challenge_id}`}
                    className="text-[10px] text-[#FF6130]/50 hover:text-[#FF6130] font-headline transition-colors"
                  >
                    {challengeTitle} &rarr;
                  </Link>
                )}
              </div>
            </div>

            {space.description && (
              <p className="text-sm text-[#9CF0FF]/40 mt-4 max-w-lg">
                {space.description}
              </p>
            )}
          </div>

          <PostFeed
            spaceId={spaceId}
            communityType="challenge"
            currentUserId={user.id}
            canPost={canPost}
          />
        </div>
      </div>
    </div>
  );
}
