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
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD === 1)
    return `Tomorrow ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
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
  const nextSession = upcomingSessions?.[0];
  const pulseSession = liveSession ?? goLiveSession ?? nextSession;

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
  const challengeTitleMap: Record<string, string> = {};
  if (challengeIds.length > 0) {
    const { data: chs } = await supabase.from("app_challenge").select("id, title").in("id", challengeIds);
    for (const c of chs ?? []) challengeTitleMap[c.id] = c.title;
  }

  // Next session per tribe
  const tribeNextSessions: Record<string, any> = {};
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
      const spaceId = c2s[(link as any).challenge_id];
      if (spaceId && (!tribeNextSessions[spaceId] || new Date(sess.start_time) < new Date(tribeNextSessions[spaceId].start_time))) {
        tribeNextSessions[spaceId] = sess;
      }
    }
  }

  const hasTribes = (challengeSpaces ?? []).length > 0;
  const tribeCount = challengeSpaces?.length ?? 0;
  const totalTribeMembers = Object.values(tribeMemberCounts).reduce((a, b) => a + b, 0);
  const activeTribeSessions = Object.keys(tribeNextSessions).length;
  const initials = (profile?.display_name ?? "?")[0].toUpperCase();

  return (
    <div className="py-6 space-y-8">

      {/* ── THE PULSE ─────────────────────────────────────── */}
      {pulseSession && (
        <div className="rounded-2xl infitra-card overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="min-w-0">
              {liveSession ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold font-headline uppercase tracking-wider text-red-500">Live Now</span>
                </div>
              ) : goLiveSession ? (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6130] animate-pulse" />
                  <span className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130]">Ready to go live</span>
                </div>
              ) : (
                <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#0891b2] mb-2">
                  Next up · {formatRelativeTime(pulseSession.start_time)}
                </p>
              )}
              <h2 className="text-xl font-black font-headline text-[#0F2229] tracking-tight truncate">
                {pulseSession.title}
              </h2>
              {challengeMap[pulseSession.id] && (
                <p className="text-xs text-[#64748b] mt-1">{challengeMap[pulseSession.id]}</p>
              )}
            </div>
            <Link
              href={liveSession ? `/dashboard/sessions/${liveSession.id}/live` : `/dashboard/sessions/${pulseSession.id}`}
              className="px-6 py-3 rounded-full text-white text-sm font-black font-headline shrink-0"
              style={{
                backgroundColor: liveSession || goLiveSession ? "#FF6130" : "#0F2229",
                boxShadow: liveSession || goLiveSession ? "0 4px 14px rgba(255,97,48,0.35)" : "0 4px 14px rgba(15,34,41,0.15)",
              }}
            >
              {liveSession ? "Enter Session" : goLiveSession ? "Go Live" : "View"}
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HOME BASE — Your identity. Your loyal community.
          ══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl infitra-card overflow-hidden">
        {/* Creator identity header */}
        <div className="px-6 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-4 mb-3">
            <Link href="/dashboard/profile" className="shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name ?? ""}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{ border: "2px solid rgba(8, 145, 178, 0.25)" }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(8, 145, 178, 0.10)", border: "2px solid rgba(8, 145, 178, 0.25)" }}
                >
                  <span className="text-lg font-black font-headline text-[#0891b2]">{initials}</span>
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-headline text-[#0F2229] tracking-tight truncate">
                  {profile?.display_name}
                </h2>
                <span className="text-[10px] text-[#94a3b8]">·</span>
                <span className="text-[10px] text-[#94a3b8]">{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
              </div>
              {profile?.tagline && (
                <p className="text-xs text-[#64748b] truncate">{profile.tagline}</p>
              )}
            </div>
            <Link href="/dashboard/profile" className="text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229] shrink-0">
              Edit
            </Link>
          </div>

          <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#0891b2]">
            Home Base
          </p>
          <p className="text-[11px] text-[#64748b] mt-0.5">
            Your identity. Your loyal community. Where you build long-term.
          </p>

          {/* Tribe bridge — hints at connected tribes */}
          {hasTribes && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {(challengeSpaces ?? []).slice(0, 3).map((_: any, i: number) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#FF6130]" style={{ opacity: 1 - i * 0.25 }} />
                ))}
              </div>
              <a href="#tribes-zone" className="text-[10px] font-bold font-headline text-[#FF6130]">
                {tribeCount} active tribe{tribeCount !== 1 ? "s" : ""} connected →
              </a>
            </div>
          )}
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
                It appears automatically when someone purchases from you. This is where your community lives.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TRIBES — The engagement layer. Where communities thrive.
          ══════════════════════════════════════════════════════ */}
      <div id="tribes-zone">
        {/* Tribes declaration header */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black font-headline text-[#0F2229] tracking-tight">
                Your Tribes
              </h2>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                {hasTribes
                  ? `${totalTribeMembers} member${totalTribeMembers !== 1 ? "s" : ""} across ${tribeCount} tribe${tribeCount !== 1 ? "s" : ""}${activeTribeSessions > 0 ? ` · ${activeTribeSessions} upcoming session${activeTribeSessions !== 1 ? "s" : ""}` : ""}`
                  : "The engagement and activity layer — where communities thrive"
                }
              </p>
            </div>
            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-4 py-2 rounded-full text-xs font-bold font-headline text-white"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 2px 8px rgba(255,97,48,0.25)" }}
              >
                + New Tribe
              </button>
            </form>
          </div>
        </div>

        {hasTribes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challengeSpaces!.map((cs: any) => {
              const mCount = tribeMemberCounts[cs.id] ?? 0;
              const cTitle = challengeTitleMap[cs.source_challenge_id] ?? "";
              const nextSess = tribeNextSessions[cs.id];
              return (
                <Link key={cs.id} href={`/communities/challenge/${cs.id}`} className="group block rounded-2xl infitra-card-link overflow-hidden">
                  {/* Orange energy bar */}
                  <div className="h-1" style={{ background: "linear-gradient(90deg, #FF6130 0%, rgba(255,97,48,0.3) 100%)" }} />
                  <div className="p-5">
                    <h3 className="text-base font-black font-headline tracking-tight mb-1 text-[#0F2229] group-hover:text-[#FF6130]">
                      {cs.title}
                    </h3>
                    {cTitle && <p className="text-[10px] text-[#64748b] mb-3">{cTitle}</p>}

                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold font-headline text-[#0F2229]">
                        {mCount} <span className="text-[#94a3b8] font-normal">member{mCount !== 1 ? "s" : ""}</span>
                      </span>
                    </div>

                    {nextSess ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(8, 145, 178, 0.06)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0891b2] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold font-headline text-[#0891b2]">{formatRelativeTime(nextSess.start_time)}</p>
                          <p className="text-[10px] text-[#64748b] truncate">{nextSess.title}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#94a3b8]">No upcoming sessions</p>
                    )}

                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <span className="text-[10px] font-bold font-headline text-[#FF6130]">Enter Tribe →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl infitra-card p-8 text-center">
            <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">Create your first tribe</p>
            <p className="text-sm max-w-md mx-auto text-[#64748b] mb-4">
              Publish a challenge and a tribe is born — a community of participants who commit, show up, and engage together.
            </p>
            <form action={createDraftChallenge} className="inline-block">
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-white text-sm font-bold font-headline"
                style={{ backgroundColor: "#FF6130", boxShadow: "0 4px 14px rgba(255,97,48,0.35)" }}
              >
                + Create Challenge
              </button>
            </form>
          </div>
        )}

        {/* Sessions under tribes — the scheduled action layer */}
        {(upcomingSessions ?? []).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-headline uppercase tracking-wider text-[#94a3b8]">Upcoming Sessions</h3>
              <Link href="/dashboard/sessions/new" className="text-[10px] font-bold font-headline text-[#FF6130]">+ New Session</Link>
            </div>
            <div className="space-y-2">
              {(upcomingSessions ?? []).slice(pulseSession ? 1 : 0, 4).map((sess: any) => {
                const hasRoom = !!sess.live_room_id;
                const challengeName = challengeMap[sess.id];
                return (
                  <Link key={sess.id} href={`/dashboard/sessions/${sess.id}`} className="group flex items-center justify-between p-3 rounded-xl infitra-card-link">
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">{sess.title}</p>
                      <p className="text-[10px] text-[#64748b]">
                        {formatRelativeTime(sess.start_time)}
                        {challengeName && <span className="ml-1 text-[#FF6130]/65">· {challengeName}</span>}
                      </p>
                    </div>
                    {hasRoom && <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline shrink-0">Live</span>}
                  </Link>
                );
              })}
            </div>
            <Link href="/dashboard/sessions" className="block mt-3 text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]">
              All sessions →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
