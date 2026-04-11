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

  // Upcoming sessions for pulse
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, live_room_id")
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
    <div className="py-6 space-y-8">

      {/* ── PULSE (urgent only) ───────────────────────────── */}
      {showPulse && (
        <div
          className="rounded-2xl overflow-hidden p-6 flex items-center justify-between"
          style={{
            backgroundColor: "#0F2229",
            boxShadow: "0 4px 20px rgba(15,34,41,0.25)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: liveSession ? "#ef4444" : "#FF6130" }} />
              <span className="text-xs font-bold font-headline uppercase tracking-wider" style={{ color: liveSession ? "#ef4444" : "#FF6130" }}>
                {liveSession ? "Live Now" : "Ready to go live"}
              </span>
            </div>
            <h2 className="text-xl font-black font-headline text-white tracking-tight truncate">
              {(liveSession ?? goLiveSession)!.title}
            </h2>
          </div>
          <Link
            href={`/dashboard/sessions/${(liveSession ?? goLiveSession)!.id}${liveSession ? "/live" : ""}`}
            className="px-6 py-3 rounded-full text-white text-sm font-black font-headline shrink-0"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.5)" }}
          >
            {liveSession ? "Enter Session" : "Go Live"}
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CREATOR BRAND — Bold. Unmistakable. Your studio.
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Cover / Brand banner */}
        {profile?.cover_image_url ? (
          <div className="h-40 md:h-52 relative">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
          </div>
        ) : (
          <div
            className="h-28 md:h-36"
            style={{ background: "linear-gradient(135deg, #0F2229 0%, rgba(8,145,178,0.4) 50%, rgba(255,97,48,0.3) 100%)" }}
          />
        )}

        <div className="px-8 pb-8 relative">
          {/* Avatar */}
          <div className="-mt-12 mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? ""}
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: "4px solid #FEFEFF", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,97,48,0.10)", border: "4px solid #FEFEFF", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
              >
                <span className="text-3xl font-black font-headline text-[#FF6130]">{initials}</span>
              </div>
            )}
          </div>

          {/* Name — BIG */}
          <h1 className="text-3xl md:text-4xl font-black font-headline text-[#0F2229] tracking-tight leading-none">
            {profile?.display_name}
          </h1>
          {profile?.tagline && (
            <p className="text-base md:text-lg text-[#64748b] mt-2 font-headline font-semibold">
              {profile.tagline}
            </p>
          )}
          {profile?.bio && (
            <p className="text-sm text-[#94a3b8] mt-3 max-w-xl leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats + Edit */}
          <div className="flex items-center justify-between mt-5 pt-5" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xl font-black font-headline text-[#0891b2]">{memberCount}</span>
                <span className="text-xs text-[#94a3b8] ml-1.5">community</span>
              </div>
              {hasTribes && (
                <div>
                  <span className="text-xl font-black font-headline text-[#FF6130]">{tribeCount}</span>
                  <span className="text-xs text-[#94a3b8] ml-1.5">tribe{tribeCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            <Link
              href="/dashboard/profile"
              className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] px-4 py-2 rounded-full"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TRIBES GATEWAY — Dark zone. Where the action is.
          ══════════════════════════════════════════════════════ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#0F2229",
          boxShadow: "0 4px 20px rgba(15,34,41,0.20)",
        }}
      >
        <div className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-2">
                The Engagement Layer
              </p>
              <h2 className="text-2xl font-black font-headline text-white tracking-tight mb-2">
                Your Tribes
              </h2>
              <p className="text-sm text-[#9CF0FF]/50 max-w-md">
                Where communities engage freely, collaborations happen, and participants share and grow together — without mixing with your personal identity.
              </p>
            </div>
            <Link
              href={hasTribes ? "/dashboard/tribes" : "/dashboard/create"}
              className="px-6 py-3 rounded-full text-sm font-bold font-headline shrink-0 mt-1"
              style={{
                backgroundColor: "#FF6130",
                color: "white",
                boxShadow: "0 4px 14px rgba(255,97,48,0.4)",
              }}
            >
              {hasTribes ? "Enter Tribes →" : "Start Your First →"}
            </Link>
          </div>

          {hasTribes ? (
            <div className="flex items-end gap-10 mt-8">
              <div>
                <p className="text-5xl font-black font-headline text-white leading-none">{tribeCount}</p>
                <p className="text-xs text-[#9CF0FF]/40 mt-1 font-headline uppercase tracking-wider">
                  Active Tribe{tribeCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-5xl font-black font-headline text-[#FF6130] leading-none">{totalTribeMembers}</p>
                <p className="text-xs text-[#9CF0FF]/40 mt-1 font-headline uppercase tracking-wider">
                  Total Members
                </p>
              </div>
              <div className="flex-1" />
              <p className="text-[10px] text-[#9CF0FF]/30 font-headline">
                Sessions → Challenges → <span className="text-[#FF6130]">Tribes</span>
              </p>
            </div>
          ) : (
            <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "rgba(156,240,255,0.06)", border: "1px solid rgba(156,240,255,0.10)" }}>
              <p className="text-xs text-[#9CF0FF]/60">
                <span className="text-[#FF6130] font-bold font-headline">The golden path:</span> Create sessions → bundle into a challenge → publish → your tribe is born. A community space where participants can post, share, and engage freely.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          HOME BASE — Your loyal community. Warm. Stable.
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        <div
          className="px-8 pt-6 pb-5"
          style={{ borderBottom: "1px solid rgba(8,145,178,0.10)", background: "linear-gradient(to bottom, rgba(8,145,178,0.03), transparent)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0891b2]" />
                <h2 className="text-base font-black font-headline text-[#0F2229] tracking-tight">
                  Home Base
                </h2>
              </div>
              <p className="text-xs text-[#64748b]">
                Your identity · Your loyal community · {memberCount} member{memberCount !== 1 ? "s" : ""}
              </p>
            </div>
            {space && (
              <Link href={`/communities/creator/${space.id}`} className="text-xs font-bold font-headline text-[#0891b2]">
                Open Full →
              </Link>
            )}
          </div>
        </div>

        <div className="px-8 py-6">
          {space ? (
            <PostFeed
              spaceId={space.id}
              communityType="creator"
              currentUserId={user!.id}
              canPost={true}
            />
          ) : (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-full bg-[#0891b2]/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-3 h-3 rounded-full bg-[#0891b2]" />
              </div>
              <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">Your home base is waiting</p>
              <p className="text-sm max-w-sm mx-auto text-[#64748b]">
                It appears automatically when someone purchases from you. This is where your loyal community grows.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
