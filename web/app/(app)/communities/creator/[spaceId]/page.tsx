import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = { title: "Tribe — INFITRA" };

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffH < 0) return "Now";
  if (diffH < 24) return `In ${diffH}h`;
  if (diffD === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default async function TribePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Tribe (creator space) ──────────────────────────
  const { data: space } = await supabase
    .from("app_creator_space")
    .select("id, title, description, creator_id, cover_image_url")
    .eq("id", spaceId)
    .single();
  if (!space) notFound();

  // ── Creator profile ────────────────────────────────
  const { data: creator } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url, tagline, bio")
    .eq("id", space.creator_id)
    .single();

  // ── Members ────────────────────────────────────────
  const { count: memberCount } = await supabase
    .from("app_creator_space_member")
    .select("user_id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  const { data: memberRows } = await supabase
    .from("app_creator_space_member")
    .select("user_id")
    .eq("space_id", spaceId)
    .limit(8);

  let memberAvatars: string[] = [];
  if (memberRows?.length) {
    const { data: profiles } = await supabase
      .from("app_profile")
      .select("avatar_url")
      .in("id", memberRows.map((m: any) => m.user_id));
    memberAvatars = (profiles ?? []).map((p: any) => p.avatar_url).filter(Boolean);
  }

  // ── Current user info ──────────────────────────────
  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const isOwner = user.id === space.creator_id;
  const canPost = isOwner;
  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/discover";

  // ── Owned challenges (published) ───────────────────
  const { data: ownedChallenges } = await supabase
    .from("app_challenge")
    .select("id, title, image_url, start_date, end_date, price_cents, status")
    .eq("owner_id", space.creator_id)
    .eq("status", "published")
    .order("start_date", { ascending: false });

  // Challenge member counts
  const challengeIds = (ownedChallenges ?? []).map((c: any) => c.id);
  const challengeMemberCounts: Record<string, number> = {};
  if (challengeIds.length > 0) {
    const { data: members } = await supabase.from("app_challenge_member").select("challenge_id").in("challenge_id", challengeIds);
    for (const m of members ?? []) challengeMemberCounts[m.challenge_id] = (challengeMemberCounts[m.challenge_id] ?? 0) + 1;
  }

  // Challenge session counts
  const challengeSessionCounts: Record<string, number> = {};
  if (challengeIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(status)")
      .in("challenge_id", challengeIds);
    for (const l of links ?? []) {
      if ((l as any).app_session?.status !== "draft") {
        challengeSessionCounts[(l as any).challenge_id] = (challengeSessionCounts[(l as any).challenge_id] ?? 0) + 1;
      }
    }
  }

  // Challenge spaces (for thread links)
  const challengeSpaceMap: Record<string, string> = {};
  if (challengeIds.length > 0) {
    const { data: spaces } = await supabase
      .from("app_challenge_space")
      .select("id, source_challenge_id")
      .in("source_challenge_id", challengeIds);
    for (const s of spaces ?? []) {
      if (s.source_challenge_id) challengeSpaceMap[s.source_challenge_id] = s.id;
    }
  }

  // ── Collab challenges (where creator is cohost) ────
  const { data: collabLinks } = await supabase
    .from("app_challenge_cohost")
    .select("challenge_id, split_percent, app_challenge(id, title, image_url, start_date, end_date, price_cents, status, owner_id)")
    .eq("cohost_id", space.creator_id);

  const collabChallenges = (collabLinks ?? [])
    .filter((l: any) => l.app_challenge?.status === "published")
    .map((l: any) => ({ ...l.app_challenge, splitPercent: l.split_percent }));

  // Fetch collab challenge owner names
  const collabOwnerIds = [...new Set(collabChallenges.map((c: any) => c.owner_id))];
  const collabOwnerNames: Record<string, string> = {};
  if (collabOwnerIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name").in("id", collabOwnerIds);
    for (const p of profiles ?? []) collabOwnerNames[p.id] = p.display_name ?? "Creator";
  }

  // Collab challenge spaces
  const collabChallengeIds = collabChallenges.map((c: any) => c.id);
  if (collabChallengeIds.length > 0) {
    const { data: spaces } = await supabase
      .from("app_challenge_space")
      .select("id, source_challenge_id")
      .in("source_challenge_id", collabChallengeIds);
    for (const s of spaces ?? []) {
      if (s.source_challenge_id) challengeSpaceMap[s.source_challenge_id] = s.id;
    }
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

      <div className="flex-1 pt-20">
        {/* ── TRIBE HEADER ───────────────────────────────── */}
        <div className="relative">
          {/* Cover image */}
          {space.cover_image_url && (
            <div className="h-48 md:h-64 relative">
              <img src={space.cover_image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(242,239,232,1) 100%)" }} />
            </div>
          )}

          <div className="max-w-5xl mx-auto px-6">
            <div className={`${space.cover_image_url ? "-mt-16 relative z-10" : "pt-6"}`}>
              {/* Creator avatar + name */}
              <div className="flex items-end gap-4 mb-4">
                {creator?.avatar_url ? (
                  <div className="shrink-0 rounded-full p-[2px]" style={{ background: "#9CF0FF" }}>
                    <img src={creator.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" style={{ border: "2px solid white" }} />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#0891b2" }}>
                    <span className="text-2xl font-black font-headline text-white">{(creator?.display_name ?? "?")[0]}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-black font-headline text-[#0F2229] tracking-tight">
                    {creator?.display_name}&apos;s Tribe
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Member avatars */}
                    {memberAvatars.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {memberAvatars.slice(0, 5).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-6 h-6 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 5 - i }} />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-[#94a3b8]">{memberCount ?? 0} member{(memberCount ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>

              {creator?.tagline && (
                <p className="text-sm text-[#64748b] mb-2">{creator.tagline}</p>
              )}
              {creator?.bio && (
                <p className="text-sm text-[#94a3b8] max-w-xl mb-6">{creator.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-12">
          {/* ── ACTIVE CHALLENGES ──────────────────────────── */}
          {(ownedChallenges ?? []).length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#FF6130" }} />
                <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Active Challenges</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(ownedChallenges ?? []).map((ch: any) => {
                  const isActive = ch.start_date && ch.end_date && today >= ch.start_date && today <= ch.end_date;
                  const threadSpaceId = challengeSpaceMap[ch.id];
                  return (
                    <div key={ch.id} className="rounded-2xl infitra-card overflow-hidden">
                      {/* Image */}
                      <div className="h-32 relative">
                        {ch.image_url ? (
                          <>
                            <img src={ch.image_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.6) 100%)" }} />
                          </>
                        ) : (
                          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                              <img src="/logo-mark.png" alt="" width={32} height={32} />
                            </div>
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-headline text-[#FF6130]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6130] animate-pulse" />
                              ACTIVE
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-lg font-black font-headline text-white tracking-tight">{ch.title}</h3>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-3">
                          <span>{challengeSessionCounts[ch.id] ?? 0} sessions</span>
                          <span>·</span>
                          <span>{challengeMemberCounts[ch.id] ?? 0} participants</span>
                          <span>·</span>
                          <span>CHF {(ch.price_cents / 100).toFixed(0)}</span>
                        </div>
                        {threadSpaceId && (
                          <Link
                            href={`/communities/challenge/${threadSpaceId}`}
                            className="text-xs font-bold font-headline text-[#FF6130] hover:text-[#d4512a]"
                          >
                            Enter Challenge Thread →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── COLLABORATIONS ─────────────────────────────── */}
          {collabChallenges.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#0891b2" }} />
                <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Collaborations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collabChallenges.map((ch: any) => {
                  const threadSpaceId = challengeSpaceMap[ch.id];
                  return (
                    <div key={ch.id} className="rounded-2xl infitra-card overflow-hidden" style={{ border: "1px solid rgba(156,240,255,0.25)" }}>
                      <div className="h-28 relative">
                        {ch.image_url ? (
                          <>
                            <img src={ch.image_url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.6) 100%)" }} />
                          </>
                        ) : (
                          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229, #0891b2)" }} />
                        )}
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-base font-black font-headline text-white tracking-tight">{ch.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-[#0891b2] font-bold font-headline mb-2">
                          Collaboration with {collabOwnerNames[ch.owner_id] ?? "Creator"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                          <span>CHF {(ch.price_cents / 100).toFixed(0)}</span>
                          <span>·</span>
                          <span>Your share: {ch.splitPercent}%</span>
                        </div>
                        {threadSpaceId && (
                          <Link
                            href={`/communities/challenge/${threadSpaceId}`}
                            className="text-xs font-bold font-headline text-[#FF6130] hover:text-[#d4512a] mt-2 block"
                          >
                            Enter Challenge Thread →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── BROADCAST FEED ─────────────────────────────── */}
          <div className="rounded-2xl infitra-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#0891b2" }} />
              <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Broadcast</h2>
              <span className="text-xs text-[#94a3b8]">· {creator?.display_name} posts here</span>
            </div>

            <PostFeed
              spaceId={spaceId}
              communityType="creator"
              currentUserId={user.id}
              canPost={canPost}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
