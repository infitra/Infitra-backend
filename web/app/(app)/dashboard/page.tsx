import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { PostFeed } from "@/app/components/community/PostFeed";
import { DashboardTabs } from "./DashboardTabs";

export const metadata = {
  title: "Home — INFITRA",
};

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `In ${diffMin} min`;
  if (diffH < 24) return `In ${diffH}h`;
  if (diffD === 1)
    return `Tomorrow ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, tagline, bio, avatar_url, cover_image_url")
    .eq("id", user!.id)
    .single();

  const { data: summary } = await supabase
    .from("vw_my_creator_summary")
    .select("*")
    .single();
  const totalAttendees = Number(summary?.total_attendees ?? 0);
  const earningsCHF = (Number(summary?.creator_cut_cents ?? 0) / 100).toFixed(2);
  const { count: publishedSessionCount } = await supabase
    .from("app_session")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .neq("status", "draft");

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

  // Next Up sessions
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

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

  const goLiveSession = (upcomingSessions ?? []).find((s: any) => {
    const st = new Date(s.start_time);
    return now >= new Date(st.getTime() - 15 * 60 * 1000) && !s.live_room_id;
  });
  const liveSession = (upcomingSessions ?? []).find((s: any) => !!s.live_room_id);
  const nextSession = upcomingSessions?.[0];

  // Tribes
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, source_challenge_id")
    .eq("owner_id", user!.id);

  const tribeMemberCounts: Record<string, number> = {};
  const challengeIds = (challengeSpaces ?? []).map((s: any) => s.source_challenge_id).filter(Boolean);
  if (challengeIds.length > 0) {
    const { data: members } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .in("challenge_id", challengeIds);
    const challengeToSpace: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id) challengeToSpace[cs.source_challenge_id] = cs.id;
    }
    for (const m of members ?? []) {
      const spaceId = challengeToSpace[m.challenge_id];
      if (spaceId) tribeMemberCounts[spaceId] = (tribeMemberCounts[spaceId] ?? 0) + 1;
    }
  }
  const challengeTitleMap: Record<string, string> = {};
  if (challengeIds.length > 0) {
    const { data: challenges } = await supabase
      .from("app_challenge")
      .select("id, title")
      .in("id", challengeIds);
    for (const c of challenges ?? []) challengeTitleMap[c.id] = c.title;
  }

  // Tribe sessions (next session per tribe)
  const tribeNextSessions: Record<string, any> = {};
  if (challengeIds.length > 0) {
    const { data: tribeSessionLinks } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, status)")
      .in("challenge_id", challengeIds);
    for (const link of tribeSessionLinks ?? []) {
      const sess = (link as any).app_session;
      if (!sess || sess.status !== "published") continue;
      const sessTime = new Date(sess.start_time);
      if (sessTime < now) continue;
      const cId = (link as any).challenge_id;
      const spaceId = Object.entries(
        (challengeSpaces ?? []).reduce((acc: Record<string, string>, cs: any) => {
          if (cs.source_challenge_id) acc[cs.source_challenge_id] = cs.id;
          return acc;
        }, {})
      ).find(([k]) => k === cId)?.[1];
      if (spaceId && (!tribeNextSessions[spaceId] || sessTime < new Date(tribeNextSessions[spaceId].start_time))) {
        tribeNextSessions[spaceId] = sess;
      }
    }
  }

  const hasUpcoming = (upcomingSessions ?? []).length > 0;
  const hasTribes = (challengeSpaces ?? []).length > 0;
  const tribeCount = challengeSpaces?.length ?? 0;
  const initials = (profile?.display_name ?? "?")[0].toUpperCase();

  // ── Activity signals ───────────────────────────────────
  const activitySignals: { icon: string; text: string; color: string }[] = [];
  if (liveSession) {
    activitySignals.push({ icon: "🔴", text: `${liveSession.title} is LIVE`, color: "#FF6130" });
  } else if (nextSession) {
    activitySignals.push({ icon: "⏱", text: `Next session ${formatRelativeTime(nextSession.start_time)}`, color: "#0891b2" });
  }
  if (tribeCount > 0) {
    const totalTribeMembers = Object.values(tribeMemberCounts).reduce((a, b) => a + b, 0);
    activitySignals.push({ icon: "🔥", text: `${tribeCount} tribe${tribeCount !== 1 ? "s" : ""} · ${totalTribeMembers} member${totalTribeMembers !== 1 ? "s" : ""}`, color: "#FF6130" });
  }
  if (memberCount > 0) {
    activitySignals.push({ icon: "👥", text: `${memberCount} community member${memberCount !== 1 ? "s" : ""}`, color: "#0891b2" });
  }

  // ── Community content ──────────────────────────────────
  const communityContent = space ? (
    <PostFeed spaceId={space.id} communityType="creator" currentUserId={user!.id} canPost={true} />
  ) : (
    <div className="text-center py-20 rounded-2xl border border-dashed" style={{ backgroundColor: "rgba(255,255,255,0.55)", borderColor: "rgba(15,34,41,0.12)" }}>
      <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">No community yet</p>
      <p className="text-sm max-w-sm mx-auto text-[#64748b]">Your community space appears automatically when someone purchases from you.</p>
    </div>
  );

  // ── Tribes content ─────────────────────────────────────
  const tribesContent = hasTribes ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {challengeSpaces!.map((cs: any) => {
        const mCount = tribeMemberCounts[cs.id] ?? 0;
        const cTitle = challengeTitleMap[cs.source_challenge_id] ?? "Challenge";
        const nextSess = tribeNextSessions[cs.id];
        return (
          <Link key={cs.id} href={`/communities/challenge/${cs.id}`} className="group block rounded-2xl infitra-card-link overflow-hidden">
            {/* Orange accent bar */}
            <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6130, #FF6130/40)" }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full font-headline text-orange-700 bg-orange-100/80">TRIBE</span>
                  <span className="text-[10px] text-[#94a3b8]">{mCount} member{mCount !== 1 ? "s" : ""}</span>
                </div>
                {nextSess && (
                  <span className="text-[10px] font-bold font-headline text-[#0891b2]">
                    ⏱ {formatRelativeTime(nextSess.start_time)}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black font-headline tracking-tight mb-1 truncate text-[#0F2229] group-hover:text-[#FF6130]">
                {cs.title}
              </h3>
              <p className="text-xs text-[#64748b] truncate mb-3">{cTitle}</p>
              {nextSess && (
                <div className="flex items-center gap-2 text-[10px] text-[#64748b] mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
                  Next: {nextSess.title}
                </div>
              )}
              <span className="text-[10px] font-bold font-headline text-[#FF6130]">Enter Tribe →</span>
            </div>
          </Link>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-16 rounded-2xl border border-dashed" style={{ backgroundColor: "rgba(255,255,255,0.55)", borderColor: "rgba(15,34,41,0.12)" }}>
      <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">No tribes yet</p>
      <p className="text-sm max-w-sm mx-auto text-[#64748b]">Tribes appear when you publish challenges. Each challenge creates a tribe where participants engage together.</p>
    </div>
  );

  return (
    <div className="py-6">
      {/* ── Creator Identity ──────────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link href="/dashboard/profile" className="shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? ""}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{ border: "3px solid rgba(255, 97, 48, 0.25)" }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255, 97, 48, 0.12)", border: "3px solid rgba(255, 97, 48, 0.25)" }}
                >
                  <span className="text-xl font-black font-headline text-[#FF6130]">{initials}</span>
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-black font-headline text-[#0F2229] tracking-tight truncate">
                {profile?.display_name}
              </h1>
              {profile?.tagline && <p className="text-sm text-[#64748b] truncate">{profile.tagline}</p>}
            </div>
          </div>

          {/* Stats (compact) */}
          <div className="flex items-center gap-4 shrink-0">
            {[
              { v: String(publishedSessionCount ?? 0), l: "sessions" },
              { v: String(totalAttendees), l: "attendees" },
              { v: `${earningsCHF}`, l: "CHF" },
            ].map(({ v, l }) => (
              <div key={l} className="text-center">
                <p className="text-lg font-black font-headline text-[#0F2229] leading-none">{v}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider font-headline text-[#94a3b8]">{l}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {(liveSession || goLiveSession) && (
              <Link
                href={`/dashboard/sessions/${(liveSession ?? goLiveSession)!.id}${liveSession ? "/live" : ""}`}
                className="px-4 py-2 rounded-full text-white text-xs font-black font-headline inline-flex items-center gap-1.5"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {liveSession ? "Live" : "Go Live"}
              </Link>
            )}
            <Link
              href="/dashboard/sessions/new"
              className="px-3.5 py-2 rounded-full text-white text-xs font-bold font-headline"
              style={{ backgroundColor: "#FF6130" }}
            >
              + Session
            </Link>
            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-full text-xs font-bold font-headline text-[#FF6130]"
                style={{ border: "1px solid rgba(255, 97, 48, 0.35)" }}
              >
                + Challenge
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Activity Strip ────────────────────────────────── */}
      {activitySignals.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 px-1">
          {activitySignals.map((sig, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-headline font-semibold" style={{ color: sig.color }}>
              <span>{sig.icon}</span>
              <span>{sig.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content: Tabs + Sidebar ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DashboardTabs
            communityContent={communityContent}
            tribesContent={tribesContent}
            tribeCount={tribeCount}
            memberCount={memberCount}
          />
        </div>

        {/* Sidebar: Next Up */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider font-headline text-[#94a3b8]">Next Up</h3>
            <Link href="/dashboard/sessions" className="text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]">All →</Link>
          </div>

          {!hasUpcoming ? (
            <div className="p-5 rounded-2xl border border-dashed text-center" style={{ backgroundColor: "rgba(255,255,255,0.55)", borderColor: "rgba(15,34,41,0.12)" }}>
              <p className="text-xs mb-2 text-[#64748b]">No upcoming sessions</p>
              <Link href="/dashboard/sessions/new" className="text-xs font-bold font-headline text-[#FF6130]">+ Create session</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingSessions!.map((sess: any) => {
                const startTime = new Date(sess.start_time);
                const goLiveOpensAt = new Date(startTime.getTime() - 15 * 60 * 1000);
                const canGoLive = now >= goLiveOpensAt;
                const hasRoom = !!sess.live_room_id;
                const challengeName = challengeMap[sess.id];
                return (
                  <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`} className="group block p-4 rounded-2xl infitra-card-link">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${hasRoom ? "bg-red-500 animate-pulse" : canGoLive ? "bg-[#FF6130]" : ""}`}
                        style={!hasRoom && !canGoLive ? { backgroundColor: "rgba(15,34,41,0.20)" } : undefined} />
                      <span className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">{sess.title}</span>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-[10px] text-[#64748b]">
                        {formatRelativeTime(sess.start_time)}
                        {challengeName && <span className="ml-1 text-[#FF6130]/65">· {challengeName}</span>}
                      </span>
                      {hasRoom ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline">Enter</span>
                      ) : canGoLive ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline">Go Live</span>
                      ) : (
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0 opacity-0 group-hover:opacity-50 text-[#0F2229]">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
