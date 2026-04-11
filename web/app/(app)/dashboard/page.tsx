import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
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
    .select("display_name, tagline, bio, avatar_url")
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
    .select("id, title, description, source_challenge_id")
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

  // Most active tribe (highest member count)
  let mostActiveTribe: { title: string; members: number; id: string } | null = null;
  if (challengeSpaces && challengeSpaces.length > 0) {
    let best = challengeSpaces[0];
    let bestCount = tribeMemberCounts[best.id] ?? 0;
    for (const cs of challengeSpaces) {
      const c = tribeMemberCounts[cs.id] ?? 0;
      if (c > bestCount) { best = cs; bestCount = c; }
    }
    mostActiveTribe = { title: best.title, members: bestCount, id: best.id };
  }

  // Next tribe session
  let nextTribeSession: any = null;
  if (challengeIds.length > 0) {
    const c2s: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id) c2s[cs.source_challenge_id] = cs.id;
    }
    const { data: tsLinks } = await supabase
      .from("app_challenge_session")
      .select("challenge_id, app_session(id, title, start_time, status)")
      .in("challenge_id", challengeIds);
    for (const link of tsLinks ?? []) {
      const sess = (link as any).app_session;
      if (!sess || sess.status !== "published" || new Date(sess.start_time) < now) continue;
      if (!nextTribeSession || new Date(sess.start_time) < new Date(nextTribeSession.start_time)) {
        nextTribeSession = sess;
      }
    }
  }

  const hasTribes = (challengeSpaces ?? []).length > 0;
  const tribeCount = challengeSpaces?.length ?? 0;
  const totalTribeMembers = Object.values(tribeMemberCounts).reduce((a, b) => a + b, 0);
  const initials = (profile?.display_name ?? "?")[0].toUpperCase();

  return (
    <div className="py-6 space-y-6">

      {/* ── 1. ACTION STATION ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/sessions/new"
          className="px-5 py-2.5 rounded-full text-white text-xs font-bold font-headline"
          style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.25)" }}
        >
          + Create Session
        </Link>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-xs font-bold font-headline text-[#FF6130]"
            style={{ border: "1px solid rgba(255, 97, 48, 0.35)" }}
          >
            + Create Challenge
          </button>
        </form>
        <Link
          href="/dashboard/sessions"
          className="px-4 py-2.5 rounded-full text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
        >
          All Sessions →
        </Link>
      </div>

      {/* ── 2. THE PULSE (only when urgent) ───────────────── */}
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

      {/* ── 3. TRIBES GATEWAY ─────────────────────────────── */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black font-headline text-[#0F2229] tracking-tight">
                Your Tribes
              </h2>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Where communities engage freely, collaborations happen, and participants thrive together
              </p>
            </div>
            {hasTribes && (
              <Link
                href="/dashboard/tribes"
                className="px-5 py-2.5 rounded-full text-white text-xs font-bold font-headline shrink-0"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.25)" }}
              >
                Enter Tribes →
              </Link>
            )}
          </div>

          {hasTribes ? (
            <>
              {/* Vital signs */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black font-headline text-[#FF6130]">{tribeCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#94a3b8]">
                    tribe{tribeCount !== 1 ? "s" : ""} active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black font-headline text-[#0F2229]">{totalTribeMembers}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider font-headline text-[#94a3b8]">
                    member{totalTribeMembers !== 1 ? "s" : ""}
                  </span>
                </div>
                {nextTribeSession && (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2]" />
                    <span className="text-[10px] font-bold font-headline text-[#0891b2]">
                      Next session {formatRelativeTime(nextTribeSession.start_time)}
                    </span>
                  </div>
                )}
              </div>

              {/* Most active tribe preview */}
              {mostActiveTribe && (
                <Link
                  href={`/communities/challenge/${mostActiveTribe.id}`}
                  className="group flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: "rgba(255, 97, 48, 0.04)", border: "1px solid rgba(255, 97, 48, 0.10)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1 h-8 rounded-full bg-[#FF6130] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-headline text-[#0F2229] truncate group-hover:text-[#FF6130]">
                        {mostActiveTribe.title}
                      </p>
                      <p className="text-[10px] text-[#64748b]">
                        {mostActiveTribe.members} member{mostActiveTribe.members !== 1 ? "s" : ""}
                        {nextTribeSession && <span> · Next: {nextTribeSession.title}</span>}
                      </p>
                    </div>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0 text-[#94a3b8] group-hover:text-[#FF6130]">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-[#64748b] mb-4 max-w-md mx-auto">
                Publish a challenge and a tribe is born — a space where participants commit, engage, and grow together. Freely. Without mixing with your personal community.
              </p>
              <form action={createDraftChallenge} className="inline-block">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full text-white text-sm font-bold font-headline"
                  style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
                >
                  + Create Your First Challenge
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. HOME BASE ──────────────────────────────────── */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Creator identity header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/profile" className="shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? ""}
                  className="w-11 h-11 rounded-full object-cover"
                  style={{ border: "2px solid rgba(8, 145, 178, 0.25)" }}
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(8, 145, 178, 0.10)", border: "2px solid rgba(8, 145, 178, 0.25)" }}
                >
                  <span className="text-base font-black font-headline text-[#0891b2]">{initials}</span>
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black font-headline text-[#0F2229] tracking-tight truncate">
                  {profile?.display_name}
                </h2>
                <span className="text-[10px] text-[#94a3b8]">·</span>
                <span className="text-[10px] text-[#94a3b8]">{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
              </div>
              {profile?.tagline && (
                <p className="text-[11px] text-[#64748b] truncate">{profile.tagline}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {space && (
                <Link href={`/communities/creator/${space.id}`} className="text-[10px] font-bold font-headline text-[#0891b2]">
                  Open →
                </Link>
              )}
              <Link href="/dashboard/profile" className="text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]">
                Edit
              </Link>
            </div>
          </div>
          <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#0891b2] mt-3">
            Home Base
          </p>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Your identity · Your loyal community · Where you build long-term
          </p>
        </div>

        {/* Community feed */}
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
