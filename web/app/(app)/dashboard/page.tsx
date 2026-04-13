import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CreatorIdentitySection } from "./CreatorIdentitySection";
import { TribeCard } from "./TribeCard";
import { ContextualPostFeed } from "./ContextualPostFeed";

export const metadata = { title: "Home — INFITRA" };

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
    .from("app_session")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .eq("status", "ended");

  const { count: sessionsPublished } = await supabase
    .from("app_session")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .neq("status", "draft");

  // ── Upcoming sessions (10, with images + challenge links) ──
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, image_url, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(10);

  // Get challenge names for sessions
  const sessionIds = (upcomingSessions ?? []).map((s: any) => s.id);
  const challengeMap: Record<string, string> = {};
  if (sessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, app_challenge(title)")
      .in("session_id", sessionIds);
    for (const link of links ?? []) {
      const ch = (link as any).app_challenge;
      if (ch?.title) challengeMap[(link as any).session_id] = ch.title;
    }
  }

  const sessionsForStrip = (upcomingSessions ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    image_url: s.image_url ?? null,
    start_time: s.start_time,
    challengeName: challengeMap[s.id] ?? null,
  }));

  // Pulse session
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

  // Fetch challenge details for status/dates
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

  // Next session per tribe
  const tribeNextSessions: Record<string, any> = {};
  if (challengeIds.length > 0) {
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) { if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id; }
    const { data: tsLinks } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, status)")
      .in("challenge_id", challengeIds);
    for (const link of tsLinks ?? []) {
      const sess = (link as any).app_session;
      if (!sess || sess.status !== "published" || new Date(sess.start_time) < now) continue;
      const spaceId = c2s[(link as any).challenge_id];
      if (spaceId && (!tribeNextSessions[spaceId] || new Date(sess.start_time) < new Date(tribeNextSessions[spaceId].start_time))) {
        tribeNextSessions[spaceId] = sess;
      }
    }
  }

  // Build tribe data — filter to active + upcoming only
  const today = now.toISOString().split("T")[0];
  const tribeData = (challengeSpaces ?? [])
    .map((cs: any) => {
      const ch = challengeDetails[cs.source_challenge_id] ?? {};
      const nextSess = tribeNextSessions[cs.id];
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
        nextSessionTitle: nextSess?.title ?? null,
        nextSessionTime: nextSess?.start_time ?? null,
      };
    })
    .filter((t) => {
      if (t.challengeStatus !== "published") return false;
      // Active: between start and end
      if (t.challengeStartDate && t.challengeEndDate) {
        if (today >= t.challengeStartDate && today <= t.challengeEndDate) return true;
        if (today < t.challengeStartDate) return true; // upcoming
      }
      return false;
    });

  // Active tribe stats
  const activeTribes = tribeData.filter((t) => t.challengeStartDate && today >= t.challengeStartDate && t.challengeEndDate && today <= t.challengeEndDate).length;
  const totalTribeMembers = tribeData.reduce((a, t) => a + t.memberCount, 0);

  // ── Available events for contextual feed ──────────────
  const { data: feedSessions } = await supabase
    .from("app_session")
    .select("id, title, image_url")
    .eq("host_id", user!.id)
    .in("status", ["published", "ended"])
    .order("start_time", { ascending: false })
    .limit(15);

  const { data: feedChallenges } = await supabase
    .from("app_challenge")
    .select("id, title, image_url")
    .eq("owner_id", user!.id)
    .eq("status", "published")
    .limit(10);

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
        sessions={sessionsForStrip}
        badges={badges}
      />

      {/* ── SECTION 2: Your Tribes (active + upcoming) ──── */}
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

      {/* ── SECTION 3: Community Feed ────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0891b2]" />
          <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">Community</h2>
          <span className="text-xs text-[#94a3b8]">· {communityMembers} member{communityMembers !== 1 ? "s" : ""}</span>
        </div>

        {space ? (
          <ContextualPostFeed
            spaceId={space.id}
            currentUserId={user!.id}
            events={feedEvents}
          />
        ) : (
          <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: "rgba(15,34,41,0.12)" }}>
            <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">Your community is waiting</p>
            <p className="text-sm max-w-sm mx-auto text-[#64748b]">It appears automatically when someone purchases from you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
