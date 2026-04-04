import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PostFeed } from "@/app/components/community/PostFeed";
import { CommunityCard } from "@/app/components/community/CommunityCard";

export const metadata = {
  title: "Community — INFITRA",
};

export default async function DashboardCommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Creator's own community ────────────────────────────
  const { data: space } = await supabase
    .from("app_creator_space")
    .select("id, title, description, creator_id, created_at")
    .eq("creator_id", user!.id)
    .maybeSingle();

  let memberCount = 0;
  if (space?.id) {
    const { count } = await supabase
      .from("app_creator_space_member")
      .select("user_id", { count: "exact", head: true })
      .eq("space_id", space.id);
    memberCount = count ?? 0;
  }

  // ── Challenge tribes the creator owns ──────────────────
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, source_challenge_id, owner_id")
    .eq("owner_id", user!.id);

  // Get member counts for each tribe
  const tribeMemberCounts: Record<string, number> = {};
  if (challengeSpaces?.length) {
    const spaceIds = challengeSpaces.map((s: any) => s.id);
    const { data: members } = await supabase
      .from("app_challenge_space_member")
      .select("space_id")
      .in("space_id", spaceIds);
    for (const m of members ?? []) {
      tribeMemberCounts[m.space_id] =
        (tribeMemberCounts[m.space_id] ?? 0) + 1;
    }
  }

  // Get challenge titles for subtitles
  const challengeIds = (challengeSpaces ?? [])
    .map((s: any) => s.source_challenge_id)
    .filter(Boolean);
  const challengeTitleMap: Record<string, string> = {};
  if (challengeIds.length > 0) {
    const { data: challenges } = await supabase
      .from("app_challenge")
      .select("id, title")
      .in("id", challengeIds);
    for (const c of challenges ?? []) {
      challengeTitleMap[c.id] = c.title;
    }
  }

  const hasTribes = (challengeSpaces ?? []).length > 0;

  return (
    <div className="py-10 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
          Community
        </h1>
        <p className="text-sm text-[#9CF0FF]/40 mt-1">
          Your community and challenge tribes.
        </p>
      </div>

      {/* ── Your Community ────────────────────────────────── */}
      <div className="mb-12">
        <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-4">
          Your Community
        </h2>

        {!space ? (
          <div className="text-center py-12 rounded-2xl bg-[#0F2229] border border-dashed border-[#9CF0FF]/10">
            <div className="w-14 h-14 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
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
            <h3 className="text-base font-black text-white font-headline tracking-tight mb-1">
              No community yet
            </h3>
            <p className="text-xs text-[#9CF0FF]/30 max-w-xs mx-auto">
              Your community appears automatically when someone purchases from
              you. Every buyer becomes a member.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 overflow-hidden">
            <div className="p-6 border-b border-[#9CF0FF]/8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] font-bold text-[#9CF0FF]/60 bg-[#9CF0FF]/10 px-2.5 py-1 rounded-full font-headline">
                  COMMUNITY
                </span>
                <span className="text-xs text-[#9CF0FF]/25">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="text-lg font-black text-white font-headline tracking-tight">
                {space.title}
              </h3>
              {space.description && (
                <p className="text-xs text-[#9CF0FF]/35 mt-1">
                  {space.description}
                </p>
              )}
            </div>
            <div className="p-6">
              <PostFeed
                spaceId={space.id}
                communityType="creator"
                currentUserId={user!.id}
                canPost={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Your Tribes ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-4">
          Your Tribes
        </h2>

        {!hasTribes ? (
          <div className="text-center py-12 rounded-2xl bg-[#0F2229] border border-dashed border-[#9CF0FF]/10">
            <p className="text-xs text-[#9CF0FF]/30">
              Tribes are created automatically when you publish a challenge.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challengeSpaces!.map((cs: any) => (
              <CommunityCard
                key={cs.id}
                type="challenge"
                spaceId={cs.id}
                title={cs.title}
                subtitle={
                  challengeTitleMap[cs.source_challenge_id] ?? "Challenge"
                }
                memberCount={tribeMemberCounts[cs.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
