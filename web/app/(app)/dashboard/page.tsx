import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreatorIdentitySection } from "./CreatorIdentitySection";
import { TribeCard } from "./TribeCard";
import { ContextualPostFeed } from "./ContextualPostFeed";
import { CollabInvitations } from "./CollabInvitations";

export const dynamic = "force-dynamic";
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

  // Community members + avatar strip
  const { data: space } = await supabase.from("app_creator_space").select("id").eq("creator_id", user!.id).maybeSingle();
  let communityMembers = 0;
  let memberAvatars: string[] = [];
  if (space?.id) {
    const { count } = await supabase.from("app_creator_space_member").select("user_id", { count: "exact", head: true }).eq("space_id", space.id);
    communityMembers = count ?? 0;
    // Fetch up to 5 member avatars for the header strip
    const { data: memberRows } = await supabase
      .from("app_creator_space_member")
      .select("user_id")
      .eq("space_id", space.id)
      .limit(5);
    if (memberRows?.length) {
      const { data: memberProfiles } = await supabase
        .from("app_profile")
        .select("avatar_url")
        .in("id", memberRows.map((m: any) => m.user_id));
      memberAvatars = (memberProfiles ?? []).map((p: any) => p.avatar_url).filter(Boolean);
    }
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
    })
    .sort((a, b) => {
      const aNext = a.nextSessions[0]?.start_time;
      const bNext = b.nextSessions[0]?.start_time;
      if (!aNext && !bNext) return 0;
      if (!aNext) return 1;
      if (!bNext) return -1;
      return new Date(aNext).getTime() - new Date(bNext).getTime();
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

  // ── Pending collaboration invitations ─────────────────
  const { data: pendingInvites } = await supabase
    .from("app_collaboration_invite")
    .select("id, from_id, message, initial_split_percent, created_at")
    .eq("to_id", user!.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch inviter profiles
  const inviterIds = [...new Set((pendingInvites ?? []).map((i: any) => i.from_id))];
  const inviterProfiles: Record<string, { name: string; avatar: string | null; tagline: string | null }> = {};
  if (inviterIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url, tagline").in("id", inviterIds);
    for (const p of profiles ?? []) inviterProfiles[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url, tagline: p.tagline };
  }

  // ── Sent collaboration invitations (for the inviter) ──
  const { data: sentInvites } = await supabase
    .from("app_collaboration_invite")
    .select("id, to_id, message, initial_split_percent, status, created_at, challenge_id")
    .eq("from_id", user!.id)
    .in("status", ["pending", "interested"])
    .order("created_at", { ascending: false });

  const sentInviteeIds = [...new Set((sentInvites ?? []).map((i: any) => i.to_id))];
  const sentInviteeProfiles: Record<string, { name: string; avatar: string | null }> = {};
  if (sentInviteeIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", sentInviteeIds);
    for (const p of profiles ?? []) sentInviteeProfiles[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url };
  }

  // ── Active collaboration workspaces (draft challenges where user is owner or cohost) ──
  // Owned collab drafts
  const { data: ownedCollabDrafts } = await supabase
    .from("app_challenge")
    .select("id, title, created_at, owner_id")
    .eq("owner_id", user!.id)
    .eq("status", "draft")
    .not("id", "is", null);

  // Filter to only those with cohosts
  const ownedDraftIds = (ownedCollabDrafts ?? []).map((c: any) => c.id);
  let ownedCollabIds = new Set<string>();
  if (ownedDraftIds.length > 0) {
    const { data: cohostLinks } = await supabase
      .from("app_challenge_cohost")
      .select("challenge_id")
      .in("challenge_id", ownedDraftIds);
    ownedCollabIds = new Set((cohostLinks ?? []).map((l: any) => l.challenge_id));
  }
  const myOwnedCollabs = (ownedCollabDrafts ?? []).filter((c: any) => ownedCollabIds.has(c.id));

  // Cohost collab drafts — RLS on app_challenge already filters to challenges
  // where user is owner OR cohost. So draft challenges NOT owned by user = cohost collabs.
  const { data: cohostCollabDrafts } = await supabase
    .from("app_challenge")
    .select("id, title, owner_id, status, created_at")
    .eq("status", "draft")
    .neq("owner_id", user!.id);
  const cohostCollabs = cohostCollabDrafts ?? [];

  // All active workspaces
  const allCollabWorkspaces = [
    ...myOwnedCollabs.map((c: any) => ({ ...c, role: "owner" as const })),
    ...cohostCollabs.map((c: any) => ({ ...c, role: "cohost" as const })),
  ];

  // Fetch partner names for workspaces
  const workspacePartnerIds = new Set<string>();
  const workspaceCohostMap: Record<string, string> = {};
  // For owned collabs: find cohost partner directly from cohost table
  if (myOwnedCollabs.length > 0) {
    const { data: wCohosts } = await supabase
      .from("app_challenge_cohost")
      .select("challenge_id, cohost_id")
      .in("challenge_id", myOwnedCollabs.map((c: any) => c.id));
    for (const wc of wCohosts ?? []) {
      workspaceCohostMap[(wc as any).challenge_id] = (wc as any).cohost_id;
      workspacePartnerIds.add((wc as any).cohost_id);
    }
  }
  // For cohost collabs: the partner is the owner
  for (const c of cohostCollabs) {
    workspacePartnerIds.add(c.owner_id);
  }

  const workspacePartnerProfiles: Record<string, { name: string; avatar: string | null }> = {};
  if (workspacePartnerIds.size > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", [...workspacePartnerIds]);
    for (const p of profiles ?? []) workspacePartnerProfiles[p.id] = { name: p.display_name ?? "Creator", avatar: p.avatar_url };
  }

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

      {/* ── COLLABORATION INVITATIONS ─────────────────────── */}
      {(pendingInvites ?? []).length > 0 && (
        <CollabInvitations
          invites={(pendingInvites ?? []).map((i: any) => ({
            id: i.id,
            fromName: inviterProfiles[i.from_id]?.name ?? "Creator",
            fromAvatar: inviterProfiles[i.from_id]?.avatar ?? null,
            fromTagline: inviterProfiles[i.from_id]?.tagline ?? null,
            message: i.message,
            splitPercent: i.initial_split_percent,
            createdAt: i.created_at,
          }))}
        />
      )}

      {/* ── SENT INVITATIONS (inviter's view) ────────────── */}
      {(sentInvites ?? []).length > 0 && (
        <div>
          <h3 className="text-sm font-bold font-headline text-[#94a3b8] uppercase tracking-wider mb-3">Sent Invitations</h3>
          <div className="space-y-2">
            {(sentInvites ?? []).map((i: any) => {
              const invitee = sentInviteeProfiles[i.to_id];
              return (
                <div key={i.id} className="flex items-center justify-between p-4 rounded-2xl infitra-card">
                  <div className="flex items-center gap-3 min-w-0">
                    {invitee?.avatar ? (
                      <img src={invitee.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black font-headline text-cyan-700">{invitee?.name?.[0] ?? "?"}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-headline text-[#0F2229] truncate">{invitee?.name ?? "Creator"}</p>
                      <p className="text-[10px] text-[#94a3b8] truncate">{i.message}</p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    {i.status === "pending" ? (
                      <span className="text-[10px] font-bold font-headline text-[#94a3b8]">⏳ Pending</span>
                    ) : i.status === "interested" ? (
                      <a href={`/dashboard/collaborate/${i.challenge_id}`} className="text-[10px] font-bold font-headline text-[#FF6130]">
                        Open Workspace →
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACTIVE COLLABORATION WORKSPACES ─────────────── */}
      {allCollabWorkspaces.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#9CF0FF" }} />
            <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Active Collaborations</h2>
          </div>
          <div className="space-y-2">
            {allCollabWorkspaces.map((w: any) => {
              const partnerId = w.role === "owner" ? workspaceCohostMap[w.id] : w.owner_id;
              const partner = partnerId ? workspacePartnerProfiles[partnerId] : null;
              return (
                <a
                  key={w.id}
                  href={`/dashboard/collaborate/${w.id}`}
                  className="group flex items-center justify-between p-4 rounded-2xl infitra-card-link"
                  style={{ border: "1px solid rgba(156,240,255,0.20)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {partner?.avatar ? (
                      <img src={partner.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black font-headline text-cyan-700">{partner?.name?.[0] ?? "?"}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">
                        {w.title || "Untitled Collaboration"}
                      </p>
                      <p className="text-[10px] text-[#0891b2]">
                        with {partner?.name ?? "Creator"} · Draft
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold font-headline text-[#FF6130] shrink-0">
                    Open Workspace →
                  </span>
                </a>
              );
            })}
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#FF6130" }} />
            <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Next Up</h2>
          </div>
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

      {/* ── SECTION 3: Your Tribe — challenges inside ───── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#FF6130" }} />
            <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Your Tribe</h2>
            <span className="text-xs text-[#94a3b8]">· {communityMembers} member{communityMembers !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Active challenges as tribe content */}
        {tribeData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tribeData.map((tribe) => (
              <TribeCard key={tribe.id} tribe={tribe} fullWidth />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl infitra-card p-8 text-center">
            <p className="text-base font-bold font-headline text-[#0F2229] mb-2">No active challenges</p>
            <p className="text-sm text-[#64748b] max-w-md mx-auto mb-4">Launch a challenge in your tribe to start building your community.</p>
            <Link href="/dashboard/create" className="text-sm font-bold font-headline text-[#FF6130]">Create Challenge →</Link>
          </div>
        )}
      </div>

      {/* ── Standalone Sessions (not linked to tribes) ──── */}
      {standaloneSessions.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#94a3b8" }} />
            <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Quick Sessions</h2>
          </div>
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
        {/* Header with avatar strip */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#0891b2" }} />
            <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight">Community</h2>
            {/* Stacked member avatars */}
            {memberAvatars.length > 0 && (
              <div className="flex items-center -space-x-2">
                {memberAvatars.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-7 h-7 rounded-full object-cover" style={{ border: "2px solid white", zIndex: 5 - i }} />
                ))}
                {communityMembers > 5 && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold font-headline text-[#64748b]" style={{ backgroundColor: "rgba(0,0,0,0.06)", border: "2px solid white", zIndex: 0 }}>
                    +{communityMembers - 5}
                  </div>
                )}
              </div>
            )}
            <span className="text-xs text-[#94a3b8]">{communityMembers} member{communityMembers !== 1 ? "s" : ""}</span>
          </div>
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
