import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreatorIdentitySection } from "./CreatorIdentitySection";
import { TribeCard } from "./TribeCard";
import { ContextualPostFeed } from "./ContextualPostFeed";

export const metadata = { title: "Home — INFITRA" };

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `In ${diffMin}m`;
  if (diffH < 24) return `In ${diffH}h`;
  if (diffD === 1) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Profile ──────────────────────────────────────────
  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, tagline, bio, avatar_url, cover_image_url")
    .eq("id", user!.id)
    .single();

  // ── Stats ────────────────────────────────────────────
  const { data: summary } = await supabase.from("vw_my_creator_summary").select("*").single();
  const earningsCHF = (Number(summary?.creator_cut_cents ?? 0) / 100).toFixed(2);

  // Community members
  const { data: space } = await supabase.from("app_creator_space").select("id").eq("creator_id", user!.id).maybeSingle();
  let communityMembers = 0;
  if (space?.id) {
    const { count } = await supabase.from("app_creator_space_member").select("user_id", { count: "exact", head: true }).eq("space_id", space.id);
    communityMembers = count ?? 0;
  }

  // Session counts
  const { count: sessionsCompleted } = await supabase
    .from("app_session").select("id", { count: "exact", head: true })
    .eq("host_id", user!.id).eq("status", "ended");

  const { count: sessionsPublished } = await supabase
    .from("app_session").select("id", { count: "exact", head: true })
    .eq("host_id", user!.id).neq("status", "draft");

  // ── Upcoming sessions (all, for partitioning) ────────
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, image_url, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(20);

  // Get ALL challenge_session links for upcoming sessions
  const allSessionIds = (upcomingSessions ?? []).map((s: any) => s.id);
  const sessionToChallengeId: Record<string, string> = {};
  const sessionToChallengeName: Record<string, string> = {};
  if (allSessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, challenge_id, app_challenge(title)")
      .in("session_id", allSessionIds);
    for (const link of links ?? []) {
      sessionToChallengeId[(link as any).session_id] = (link as any).challenge_id;
      const ch = (link as any).app_challenge;
      if (ch?.title) sessionToChallengeName[(link as any).session_id] = ch.title;
    }
  }

  // Pulse session (live or ready to go live)
  const liveSession = (upcomingSessions ?? []).find((s: any) => !!s.live_room_id);
  const goLiveSession = !liveSession
    ? (upcomingSessions ?? []).find((s: any) => {
        const st = new Date(s.start_time);
        return now >= new Date(st.getTime() - 15 * 60 * 1000);
      })
    : null;

  // ── Badges ───────────────────────────────────────────
  const { data: userBadges } = await supabase
    .from("app_user_badge")
    .select("badge_id, awarded_at, app_badge(label, description, tier, color_hex, icon)")
    .eq("user_id", user!.id)
    .eq("visible_on_profile", true)
    .is("revoked_at", null)
    .order("awarded_at", { ascending: false });

  const badges = (userBadges ?? []).map((ub: any) => ({
    badge_id: ub.badge_id,
    label: ub.app_badge?.label ?? "",
    description: ub.app_badge?.description ?? null,
    tier: ub.app_badge?.tier ?? "common",
    color_hex: ub.app_badge?.color_hex ?? null,
    icon: ub.app_badge?.icon ?? null,
    awarded_at: ub.awarded_at,
  }));

  // ── Tribes (active + upcoming only) ──────────────────
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, source_challenge_id, cover_image_url")
    .eq("owner_id", user!.id);

  const challengeIds = (challengeSpaces ?? []).map((s: any) => s.source_challenge_id).filter(Boolean);
  const challengeDetails: Record<string, any> = {};
  if (challengeIds.length > 0) {
    const { data: chs } = await supabase.from("app_challenge").select("id, title, status, start_date, end_date, price_cents").in("id", challengeIds);
    for (const c of chs ?? []) challengeDetails[c.id] = c;
  }

  // Member counts per tribe
  const tribeMemberCounts: Record<string, number> = {};
  if (challengeIds.length > 0) {
    const { data: members } = await supabase.from("app_challenge_member").select("challenge_id").in("challenge_id", challengeIds);
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) { if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id; }
    for (const m of members ?? []) { const sid = c2s[m.challenge_id]; if (sid) tribeMemberCounts[sid] = (tribeMemberCounts[sid] ?? 0) + 1; }
  }

  // ── Per-tribe sessions (next sessions grouped by tribe) ──
  const tribeSessions: Record<string, { id: string; title: string; image_url: string | null; start_time: string }[]> = {};
  const linkedSessionIds = new Set<string>();

  // Map challenge_id → space_id
  const challengeToSpace: Record<string, string> = {};
  for (const cs of challengeSpaces ?? []) {
    if (cs.source_challenge_id) challengeToSpace[cs.source_challenge_id] = cs.id;
  }

  // Assign upcoming sessions to their tribe
  for (const sess of upcomingSessions ?? []) {
    const challengeId = sessionToChallengeId[sess.id];
    if (challengeId) {
      const spaceId = challengeToSpace[challengeId];
      if (spaceId) {
        if (!tribeSessions[spaceId]) tribeSessions[spaceId] = [];
        tribeSessions[spaceId].push({
          id: sess.id,
          title: sess.title,
          image_url: sess.image_url ?? null,
          start_time: sess.start_time,
        });
        linkedSessionIds.add(sess.id);
      }
    }
  }

  // Standalone sessions (not linked to any challenge)
  const standaloneSessions = (upcomingSessions ?? []).filter((s: any) => !linkedSessionIds.has(s.id));

  // Build tribe data — filter to active + upcoming only
  const today = now.toISOString().split("T")[0];
  const tribeData = (challengeSpaces ?? [])
    .map((cs: any) => {
      const ch = challengeDetails[cs.source_challenge_id] ?? {};
      return {
        id: cs.id,
        title: cs.title,
        coverImageUrl: cs.cover_image_url ?? null,
        memberCount: tribeMemberCounts[cs.id] ?? 0,
        challengeTitle: ch.title ?? "",
        challengeStatus: ch.status ?? "draft",
        challengeStartDate: ch.start_date ?? null,
        challengeEndDate: ch.end_date ?? null,
        challengePriceCents: ch.price_cents ?? 0,
        nextSessions: tribeSessions[cs.id] ?? [],
      };
    })
    .filter((t) => {
      if (t.challengeStatus !== "published") return false;
      if (t.challengeStartDate && t.challengeEndDate) {
        if (today >= t.challengeStartDate && today <= t.challengeEndDate) return true;
        if (today < t.challengeStartDate) return true;
      }
      return false;
    });

  // Stats
  const activeTribes = tribeData.filter((t) => t.challengeStartDate && today >= t.challengeStartDate && t.challengeEndDate && today <= t.challengeEndDate).length;
  const totalTribeMembers = tribeData.reduce((a, t) => a + t.memberCount, 0);

  // ── Next Up: 3 soonest sessions across everything ────
  const nextUpSessions = (upcomingSessions ?? []).slice(0, 3).map((s: any) => ({
    id: s.id,
    title: s.title,
    image_url: s.image_url ?? null,
    start_time: s.start_time,
    live_room_id: s.live_room_id,
    challengeName: sessionToChallengeName[s.id] ?? null,
  }));

  // ── Available events for contextual feed ──────────────
  const { data: feedSessions } = await supabase
    .from("app_session").select("id, title, image_url")
    .eq("host_id", user!.id).in("status", ["published", "ended"])
    .order("start_time", { ascending: false }).limit(15);

  const { data: feedChallenges } = await supabase
    .from("app_challenge").select("id, title, image_url")
    .eq("owner_id", user!.id).eq("status", "published").limit(10);

  const feedEvents = [
    ...(feedSessions ?? []).map((s: any) => ({ id: s.id, type: "session" as const, title: s.title, imageUrl: s.image_url })),
    ...(feedChallenges ?? []).map((c: any) => ({ id: c.id, type: "challenge" as const, title: c.title, imageUrl: c.image_url })),
  ];

  return (
    <div className="py-6 space-y-8">

      {/* ── PULSE ─────────────────────────────────────────── */}
      {(liveSession || goLiveSession) && (
        <div className="rounded-2xl overflow-hidden p-6 flex items-center justify-between" style={{ backgroundColor: "#0F2229", boxShadow: "0 4px 20px rgba(15,34,41,0.25)" }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: liveSession ? "#ef4444" : "#FF6130" }} />
              <span className="text-xs font-bold font-headline uppercase tracking-wider" style={{ color: liveSession ? "#ef4444" : "#FF6130" }}>
                {liveSession ? "Live Now" : "Ready to go live"}
              </span>
            </div>
            <h2 className="text-xl font-black font-headline text-white tracking-tight truncate">{(liveSession ?? goLiveSession)!.title}</h2>
          </div>
          <Link
            href={`/dashboard/sessions/${(liveSession ?? goLiveSession)!.id}${liveSession ? "/live" : ""}`}
            className="px-6 py-3 rounded-full text-white text-sm font-black font-headline shrink-0"
            style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
          >
            {liveSession ? "Enter Session" : "Go Live"}
          </Link>
        </div>
      )}

      {/* ── SECTION 1: Creator Identity ──────────────────── */}
      <CreatorIdentitySection
        profile={{
          display_name: profile?.display_name ?? "",
          tagline: profile?.tagline ?? null,
          bio: profile?.bio ?? null,
          avatar_url: profile?.avatar_url ?? null,
          cover_image_url: profile?.cover_image_url ?? null,
        }}
        stats={{
          communityMembers,
          activeTribes,
          activeParticipants: totalTribeMembers,
          sessionsCompleted: sessionsCompleted ?? 0,
          sessionsUpcoming: (upcomingSessions ?? []).length,
          sessionsPublished: sessionsPublished ?? 0,
          earningsCHF,
        }}
        badges={badges}
      />

      {/* ── SECTION 2: Next Up — bold, image-forward ─────── */}
      {nextUpSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-4">Next Up</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nextUpSessions.map((sess, i) => {
              const isUrgent = (new Date(sess.start_time).getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
              const isLive = !!sess.live_room_id;
              return (
                <Link
                  key={sess.id}
                  href={`/dashboard/sessions/${sess.id}`}
                  className="block rounded-2xl overflow-hidden infitra-card-link group"
                >
                  {/* Image area */}
                  <div className="h-32 relative">
                    {sess.image_url ? (
                      <>
                        <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7) 100%)" }} />
                      </>
                    ) : (
                      <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #0F2229 0%, #1a3340 50%, #2a1508 100%)" }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]">
                          <img src="/logo-mark.png" alt="" width={32} height={32} />
                        </div>
                      </div>
                    )}

                    {/* Countdown — prominent */}
                    <div className="absolute top-3 right-3">
                      {isLive ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black font-headline text-white bg-red-500">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <span
                          className="px-3 py-1.5 rounded-full text-xs font-black font-headline text-white"
                          style={{ backgroundColor: isUrgent ? "#FF6130" : "rgba(0,0,0,0.6)" }}
                        >
                          {formatRelativeTime(sess.start_time)}
                        </span>
                      )}
                    </div>

                    {/* Challenge label */}
                    {sess.challengeName && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold font-headline text-white/90" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                          {sess.challengeName}
                        </span>
                      </div>
                    )}

                    {/* Title at bottom */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-base font-black font-headline text-white tracking-tight group-hover:text-[#FF6130]">
                        {sess.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Your Tribes (active + upcoming) ──── */}
      {tribeData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">Your Tribes</h2>
            <Link href="/dashboard/create" className="text-xs font-bold font-headline text-[#FF6130]">+ New Challenge</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
            {tribeData.map((tribe) => (
              <TribeCard key={tribe.id} tribe={tribe} />
            ))}
          </div>
        </div>
      )}

      {tribeData.length === 0 && (
        <div className="rounded-2xl infitra-card p-8 text-center">
          <p className="text-base font-bold font-headline text-[#0F2229] mb-2">No active tribes yet</p>
          <p className="text-sm text-[#64748b] max-w-md mx-auto mb-4">Start a challenge to create your first tribe — where your community engages freely.</p>
          <Link href="/dashboard/create" className="text-sm font-bold font-headline text-[#FF6130]">Create Challenge →</Link>
        </div>
      )}

      {/* ── Standalone Sessions (not linked to tribes) ──── */}
      {standaloneSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight mb-4">Quick Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standaloneSessions.slice(0, 6).map((sess: any) => {
              const isUrgent = (new Date(sess.start_time).getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
              return (
                <Link
                  key={sess.id}
                  href={`/dashboard/sessions/${sess.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl infitra-card-link group"
                >
                  {sess.image_url ? (
                    <img src={sess.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340)" }}>
                      <img src="/logo-mark.png" alt="" width={18} height={18} style={{ opacity: 0.12 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">{sess.title}</p>
                    <p className={`text-xs font-bold font-headline mt-1 ${isUrgent ? "text-[#FF6130]" : "text-[#94a3b8]"}`}>
                      {formatRelativeTime(sess.start_time)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Community Feed (contained space) ─── */}
      <div className="rounded-2xl infitra-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#9CF0FF", boxShadow: "0 0 6px rgba(156,240,255,0.5)" }} />
          <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">Community</h2>
          <span className="text-xs text-[#94a3b8]">· {communityMembers} member{communityMembers !== 1 ? "s" : ""}</span>
        </div>

        {space ? (
          <ContextualPostFeed
            spaceId={space.id}
            currentUserId={user!.id}
            events={feedEvents}
            avatarUrl={profile?.avatar_url ?? null}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">Your community is waiting</p>
            <p className="text-sm max-w-sm mx-auto text-[#64748b]">It appears automatically when someone purchases from you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
