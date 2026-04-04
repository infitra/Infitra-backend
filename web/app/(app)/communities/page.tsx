import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { CommunityCard } from "@/app/components/community/CommunityCard";

export const metadata = {
  title: "Communities — INFITRA",
};

export default async function CommunitiesHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // ── Creator communities I belong to ────────────────────
  const { data: myMemberships } = await supabase
    .from("app_creator_space_member")
    .select(
      "space_id, app_creator_space(id, title, description, creator_id)"
    )
    .eq("user_id", user.id);

  const creatorSpaces = (myMemberships ?? [])
    .map((m: any) => m.app_creator_space)
    .filter(Boolean);

  // Get creator names
  const creatorIds = creatorSpaces.map((s: any) => s.creator_id);
  let creatorNameMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("app_profile")
      .select("id, display_name")
      .in("id", creatorIds);
    for (const p of profiles ?? []) {
      creatorNameMap[p.id] = p.display_name ?? "Creator";
    }
  }

  // Get member counts
  let creatorMemberCounts: Record<string, number> = {};
  if (creatorSpaces.length > 0) {
    const spaceIds = creatorSpaces.map((s: any) => s.id);
    const { data: members } = await supabase
      .from("app_creator_space_member")
      .select("space_id")
      .in("space_id", spaceIds);
    for (const m of members ?? []) {
      creatorMemberCounts[m.space_id] =
        (creatorMemberCounts[m.space_id] ?? 0) + 1;
    }
  }

  // ── Challenge tribes I belong to ───────────────────────
  // Get challenge IDs from my purchases
  const { data: myTransactions } = await supabase
    .from("app_challenge_member")
    .select("challenge_id")
    .eq("user_id", user.id);

  const purchasedChallengeIds = (myTransactions ?? []).map(
    (t: any) => t.challenge_id
  );

  let challengeSpaces: any[] = [];
  let challengeMemberCounts: Record<string, number> = {};

  if (purchasedChallengeIds.length > 0) {
    // Get spaces for purchased challenges
    const { data: spaces } = await supabase
      .from("app_challenge_space")
      .select("id, title, description, source_challenge_id, owner_id")
      .in("source_challenge_id", purchasedChallengeIds);

    challengeSpaces = spaces ?? [];

    // Get member counts
    if (challengeSpaces.length > 0) {
      const spaceIds = challengeSpaces.map((s: any) => s.id);
      const { data: members } = await supabase
        .from("app_challenge_space_member")
        .select("space_id")
        .in("space_id", spaceIds);
      for (const m of members ?? []) {
        challengeMemberCounts[m.space_id] =
          (challengeMemberCounts[m.space_id] ?? 0) + 1;
      }
    }

    // Get challenge titles for subtitles
    const { data: challenges } = await supabase
      .from("app_challenge")
      .select("id, title")
      .in("id", purchasedChallengeIds);
    const challengeTitleMap: Record<string, string> = {};
    for (const c of challenges ?? []) {
      challengeTitleMap[c.id] = c.title;
    }
    for (const space of challengeSpaces) {
      space._challengeTitle =
        challengeTitleMap[space.source_challenge_id] ?? space.title;
    }
  }

  // Also check if user is admin of any challenge spaces
  const { data: adminMemberships } = await supabase
    .from("app_challenge_space_member")
    .select(
      "space_id, app_challenge_space(id, title, description, source_challenge_id, owner_id)"
    )
    .eq("user_id", user.id);

  for (const am of adminMemberships ?? []) {
    const sp = (am as any).app_challenge_space;
    if (sp && !challengeSpaces.find((s: any) => s.id === sp.id)) {
      challengeSpaces.push({ ...sp, _challengeTitle: sp.title });
    }
  }

  const hasCreator = creatorSpaces.length > 0;
  const hasChallenge = challengeSpaces.length > 0;
  const hasAny = hasCreator || hasChallenge;

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-5xl mx-auto py-10">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              Communities
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mt-1">
              Your creator communities and challenge tribes.
            </p>
          </div>

          {!hasAny ? (
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
                No communities yet
              </h2>
              <p className="text-sm text-[#9CF0FF]/40 max-w-xs mx-auto">
                When you purchase a session or join a challenge, you
                automatically become part of the creator&apos;s community or the
                challenge tribe.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Creator communities */}
              {hasCreator && (
                <div>
                  <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-4">
                    Communities
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {creatorSpaces.map((space: any) => (
                      <CommunityCard
                        key={space.id}
                        type="creator"
                        spaceId={space.id}
                        title={space.title}
                        subtitle={
                          creatorNameMap[space.creator_id] ?? "Creator"
                        }
                        memberCount={creatorMemberCounts[space.id] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Challenge tribes */}
              {hasChallenge && (
                <div>
                  <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-4">
                    Tribes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {challengeSpaces.map((space: any) => (
                      <CommunityCard
                        key={space.id}
                        type="challenge"
                        spaceId={space.id}
                        title={space.title}
                        subtitle={space._challengeTitle ?? "Challenge"}
                        memberCount={challengeMemberCounts[space.id] ?? 0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
