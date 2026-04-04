import { createClient } from "@/lib/supabase/server";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = {
  title: "Community — INFITRA",
};

export default async function DashboardCommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find creator's own community space
  const { data: space } = await supabase.rpc("get_creator_space_by_creator", {
    p_creator: user!.id,
  });

  // Member count
  let memberCount = 0;
  if (space?.id) {
    const { count } = await supabase
      .from("app_creator_space_member")
      .select("user_id", { count: "exact", head: true })
      .eq("space_id", space.id);
    memberCount = count ?? 0;
  }

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
          Your Community
        </h1>
        <p className="text-sm text-[#9CF0FF]/40 mt-1">
          Your persistent space with everyone who has purchased from you.
        </p>
      </div>

      {!space ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#9CF0FF"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white font-headline tracking-tight mb-2">
            No community yet
          </h2>
          <p className="text-sm text-[#9CF0FF]/40 max-w-xs mx-auto">
            Your community appears automatically when someone purchases one of
            your sessions or challenges. Every buyer becomes a member.
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[9px] font-bold text-[#9CF0FF]/60 bg-[#9CF0FF]/10 px-2.5 py-1 rounded-full font-headline">
              COMMUNITY
            </span>
            <span className="text-xs text-[#9CF0FF]/30">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>

          {space.description && (
            <p className="text-sm text-[#9CF0FF]/40 mb-6 max-w-lg">
              {space.description}
            </p>
          )}

          <PostFeed
            spaceId={space.id}
            communityType="creator"
            currentUserId={user!.id}
            canPost={true}
          />
        </>
      )}
    </div>
  );
}
