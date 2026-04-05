import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = {
  title: "Community — INFITRA",
};

export default async function CreatorCommunityPage({
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
    .from("app_creator_space")
    .select("id, title, description, creator_id")
    .eq("id", spaceId)
    .single();

  if (!space) notFound();

  // Fetch creator profile
  const { data: creator } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url")
    .eq("id", space.creator_id)
    .single();

  // Member count
  const { count: memberCount } = await supabase
    .from("app_creator_space_member")
    .select("user_id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  // User profile for nav
  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const canPost = user.id === space.creator_id;

  // Upcoming sessions from this creator
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, live_room_id, status")
    .eq("host_id", space.creator_id)
    .eq("status", "published")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  const now = new Date();

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          {/* Back */}
          <Link
            href="/discover"
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
              <span className="text-[9px] font-bold text-[#9CF0FF]/60 bg-[#9CF0FF]/10 px-2.5 py-1 rounded-full font-headline">
                COMMUNITY
              </span>
              <span className="text-xs text-[#9CF0FF]/25">
                {memberCount ?? 0} member
                {(memberCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
              {space.title}
            </h1>

            {/* Creator info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9CF0FF]/10 border border-[#9CF0FF]/20 flex items-center justify-center">
                <span className="text-xs font-black text-[#9CF0FF]/60 font-headline">
                  {(creator?.display_name ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-bold text-white font-headline">
                {creator?.display_name}
              </p>
            </div>

            {space.description && (
              <p className="text-sm text-[#9CF0FF]/40 mt-4 max-w-lg">
                {space.description}
              </p>
            )}
          </div>

          {/* Upcoming sessions */}
          {upcomingSessions && upcomingSessions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#9CF0FF]/40 uppercase tracking-wider font-headline mb-3">
                Upcoming Sessions
              </h3>
              <div className="space-y-2">
                {upcomingSessions.map((sess: any) => {
                  const startTime = new Date(sess.start_time);
                  const joinOpensAt = new Date(startTime.getTime() - 5 * 60 * 1000);
                  const canJoin = !!sess.live_room_id && now >= joinOpensAt;
                  const diffMin = Math.floor((startTime.getTime() - now.getTime()) / 60000);
                  const timeLabel =
                    diffMin < 0 ? "Now" :
                    diffMin < 60 ? `In ${diffMin} min` :
                    diffMin < 1440 ? `In ${Math.floor(diffMin / 60)}h` :
                    startTime.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

                  return (
                    <Link
                      key={sess.id}
                      href={canJoin ? `/sessions/${sess.id}/live` : `/sessions/${sess.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#071318]/50 border border-[#9CF0FF]/8 hover:border-[#9CF0FF]/20 transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${sess.live_room_id ? "bg-red-500 animate-pulse" : "bg-[#9CF0FF]/20"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white font-headline truncate">{sess.title}</p>
                        <p className="text-[10px] text-[#9CF0FF]/30">{timeLabel} &middot; {sess.duration_minutes} min</p>
                      </div>
                      {canJoin && (
                        <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline shrink-0">Join</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <PostFeed
            spaceId={spaceId}
            communityType="creator"
            currentUserId={user.id}
            canPost={canPost}
          />
        </div>
      </div>
    </div>
  );
}
