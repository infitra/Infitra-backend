import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = {
  title: "Home — INFITRA",
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  return d.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, tagline, bio, avatar_url, cover_image_url")
    .eq("id", user!.id)
    .single();

  // Community
  const { data: space } = await supabase
    .from("app_creator_space")
    .select("id, title, description, creator_id")
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

  // Upcoming sessions
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  const liveSession = (upcomingSessions ?? []).find((s: any) => !!s.live_room_id);
  const goLiveSession = !liveSession
    ? (upcomingSessions ?? []).find((s: any) => {
        const st = new Date(s.start_time);
        return now >= new Date(st.getTime() - 15 * 60 * 1000);
      })
    : null;
  const showPulse = !!(liveSession || goLiveSession);

  // Tribes
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, source_challenge_id")
    .eq("owner_id", user!.id);

  const tribeMemberCounts: Record<string, number> = {};
  const challengeIds = (challengeSpaces ?? []).map((s: any) => s.source_challenge_id).filter(Boolean);
  if (challengeIds.length > 0) {
    const { data: members } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .in("challenge_id", challengeIds);
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id;
    }
    for (const m of members ?? []) {
      const sid = c2s[m.challenge_id];
      if (sid) tribeMemberCounts[sid] = (tribeMemberCounts[sid] ?? 0) + 1;
    }
  }

  const hasTribes = (challengeSpaces ?? []).length > 0;
  const tribeCount = challengeSpaces?.length ?? 0;
  const totalTribeMembers = Object.values(tribeMemberCounts).reduce((a, b) => a + b, 0);
  const initials = (profile?.display_name ?? "?")[0].toUpperCase();

  return (
    <div className="py-6 space-y-6">

      {/* ── THE PULSE (only when urgent) ──────────────────── */}
      {showPulse && (
        <div className="rounded-2xl infitra-card overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: liveSession ? "#ef4444" : "#FF6130" }} />
                <span className="text-xs font-bold font-headline uppercase tracking-wider" style={{ color: liveSession ? "#ef4444" : "#FF6130" }}>
                  {liveSession ? "Live Now" : "Ready to go live"}
                </span>
              </div>
              <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight truncate">
                {(liveSession ?? goLiveSession)!.title}
              </h2>
            </div>
            <Link
              href={`/dashboard/sessions/${(liveSession ?? goLiveSession)!.id}${liveSession ? "/live" : ""}`}
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline shrink-0"
              style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
            >
              {liveSession ? "Enter Session" : "Go Live"}
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CREATOR BRAND — Your identity. Bold. Unmistakable.
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Cover image or brand gradient */}
        {profile?.cover_image_url ? (
          <div className="h-32 md:h-40 relative">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-16 md:h-20" style={{ background: "linear-gradient(135deg, rgba(8,145,178,0.15) 0%, rgba(255,97,48,0.15) 100%)" }} />
        )}

        <div className="px-6 pb-6 relative">
          {/* Avatar — overlaps cover */}
          <div className={profile?.cover_image_url ? "-mt-10" : "-mt-8"}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? ""}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover bg-white"
                style={{ border: "4px solid #FEFEFF", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
              />
            ) : (
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,97,48,0.10)", border: "4px solid #FEFEFF", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}
              >
                <span className="text-xl md:text-2xl font-black font-headline text-[#FF6130]">{initials}</span>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="mt-3 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-black font-headline text-[#0F2229] tracking-tight">
                {profile?.display_name}
              </h1>
              {profile?.tagline && (
                <p className="text-sm md:text-base text-[#64748b] mt-1">{profile.tagline}</p>
              )}
              {profile?.bio && (
                <p className="text-sm text-[#94a3b8] mt-2 max-w-lg line-clamp-2">{profile.bio}</p>
              )}
            </div>
            <Link
              href="/dashboard/profile"
              className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] shrink-0"
              style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "9999px", padding: "8px 16px" }}
            >
              Edit Profile
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <span className="text-xs text-[#64748b]">
              <span className="font-bold text-[#0F2229]">{memberCount}</span> community member{memberCount !== 1 ? "s" : ""}
            </span>
            {hasTribes && (
              <span className="text-xs text-[#64748b]">
                <span className="font-bold text-[#FF6130]">{tribeCount}</span> tribe{tribeCount !== 1 ? "s" : ""}
                <span className="ml-1">· {totalTribeMembers} member{totalTribeMembers !== 1 ? "s" : ""}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TRIBES GATEWAY — The engagement layer
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6130 0%, rgba(255,97,48,0.15) 100%)" }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-black font-headline text-[#0F2229] tracking-tight">
              Your Tribes
            </h2>
            <Link
              href="/dashboard/tribes"
              className="px-4 py-2 rounded-full text-white text-xs font-bold font-headline shrink-0"
              style={{ backgroundColor: "#FF6130" }}
            >
              {hasTribes ? "Enter Tribes →" : "Create Your First →"}
            </Link>
          </div>
          <p className="text-[11px] text-[#64748b] mb-4">
            Where communities engage freely and collaborations happen
          </p>

          {hasTribes ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-headline text-[#FF6130]">{tribeCount}</span>
                <span className="text-xs text-[#94a3b8]">active<br/>tribe{tribeCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black font-headline text-[#0F2229]">{totalTribeMembers}</span>
                <span className="text-xs text-[#94a3b8]">total<br/>members</span>
              </div>
              <div className="h-8 w-px" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
              <Link href="/dashboard/create" className="text-xs font-bold font-headline text-[#0891b2] hover:text-[#0F2229]">
                Sessions → Challenges → Tribes
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#64748b] mb-3 max-w-md">
                Start a challenge, bundle 3+ sessions, publish it — and your first tribe is born. A space where participants engage freely, separate from your home community.
              </p>
              <Link href="/dashboard/create" className="text-xs font-bold font-headline text-[#FF6130]">
                Learn the golden path →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HOME BASE — Your loyal community
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div>
            <h2 className="text-sm font-bold font-headline uppercase tracking-wider text-[#0891b2]">
              Home Base
            </h2>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Your loyal community · {memberCount} member{memberCount !== 1 ? "s" : ""}
            </p>
          </div>
          {space && (
            <Link href={`/communities/creator/${space.id}`} className="text-[10px] font-bold font-headline text-[#0891b2]">
              Open →
            </Link>
          )}
        </div>

        <div className="p-6">
          {space ? (
            <PostFeed
              spaceId={space.id}
              communityType="creator"
              currentUserId={user!.id}
              canPost={true}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm font-bold font-headline mb-2 text-[#0F2229]">Your home base is waiting</p>
              <p className="text-xs max-w-xs mx-auto text-[#64748b]">
                It appears automatically when someone purchases from you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
