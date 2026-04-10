import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { PostFeed } from "@/app/components/community/PostFeed";
import { CommunityContainer } from "@/app/components/community/CommunityContainer";
import { CommunityCard } from "@/app/components/community/CommunityCard";

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
  if (diffD === 1) {
    return `Tomorrow ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
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
    .select("display_name, tagline, bio, avatar_url")
    .eq("id", user!.id)
    .single();

  // ── Stats ──────────────────────────────────────────────
  const { data: summary } = await supabase
    .from("vw_my_creator_summary")
    .select("*")
    .single();

  const totalAttendees = Number(summary?.total_attendees ?? 0);
  const earningsCHF = (Number(summary?.creator_cut_cents ?? 0) / 100).toFixed(
    2
  );

  const { count: publishedSessionCount } = await supabase
    .from("app_session")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .neq("status", "draft");

  // ── Community ──────────────────────────────────────────
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

  // ── Next Up: upcoming sessions ─────────────────────────
  const now = new Date();
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  // Challenge names for linked sessions
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

  // Check if any session is within go-live window
  const goLiveSession = (upcomingSessions ?? []).find((s: any) => {
    const st = new Date(s.start_time);
    return now >= new Date(st.getTime() - 15 * 60 * 1000) && !s.live_room_id;
  });
  const liveSession = (upcomingSessions ?? []).find(
    (s: any) => !!s.live_room_id
  );

  // ── Active Tribes ──────────────────────────────────────
  const { data: challengeSpaces } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, source_challenge_id")
    .eq("owner_id", user!.id);

  const tribeMemberCounts: Record<string, number> = {};
  const challengeIds = (challengeSpaces ?? [])
    .map((s: any) => s.source_challenge_id)
    .filter(Boolean);
  if (challengeIds.length > 0) {
    const { data: members } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .in("challenge_id", challengeIds);
    const challengeToSpace: Record<string, string> = {};
    for (const cs of challengeSpaces ?? []) {
      if (cs.source_challenge_id)
        challengeToSpace[cs.source_challenge_id] = cs.id;
    }
    for (const m of members ?? []) {
      const spaceId = challengeToSpace[m.challenge_id];
      if (spaceId)
        tribeMemberCounts[spaceId] = (tribeMemberCounts[spaceId] ?? 0) + 1;
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

  const hasUpcoming = (upcomingSessions ?? []).length > 0;
  const hasTribes = (challengeSpaces ?? []).length > 0;
  const initials = (profile?.display_name ?? "?")[0].toUpperCase();

  return (
    <div className="py-8">
      {/* ── Hero: YOUR STUDIO ─────────────────────────────── */}
      <div className="rounded-2xl infitra-card p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Avatar + Identity */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(255, 97, 48, 0.12)",
                border: "2px solid rgba(255, 97, 48, 0.30)",
              }}
            >
              <span className="text-xl font-black font-headline text-[#FF6130]">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black font-headline text-[#0F2229] tracking-tight truncate">
                {profile?.display_name}
              </h1>
              {profile?.tagline && (
                <p className="text-sm text-[#64748b] truncate">
                  {profile.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {liveSession ? (
              <Link
                href={`/dashboard/sessions/${liveSession.id}/live`}
                className="px-5 py-2.5 rounded-full text-white text-xs font-black font-headline inline-flex items-center gap-2"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Enter Live
              </Link>
            ) : goLiveSession ? (
              <Link
                href={`/dashboard/sessions/${goLiveSession.id}`}
                className="px-5 py-2.5 rounded-full text-white text-xs font-black font-headline inline-flex items-center gap-2"
                style={{
                  backgroundColor: "#FF6130",
                  boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Go Live
              </Link>
            ) : null}
            <Link
              href="/dashboard/sessions/new"
              className="px-4 py-2.5 rounded-full text-white text-xs font-bold font-headline"
              style={{
                backgroundColor: "#FF6130",
                boxShadow: "0 2px 8px rgba(255,97,48,0.25)",
              }}
            >
              + Session
            </Link>
            <form action={createDraftChallenge}>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-full text-xs font-bold font-headline text-[#FF6130]"
                style={{
                  border: "1px solid rgba(255, 97, 48, 0.35)",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                }}
              >
                + Challenge
              </button>
            </form>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-6 mt-5 pt-5"
          style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}
        >
          {[
            { label: "Sessions", value: String(publishedSessionCount ?? 0) },
            { label: "Members", value: String(memberCount) },
            { label: "Attendees", value: String(totalAttendees) },
            { label: "Earnings", value: `CHF ${earningsCHF}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-lg font-black font-headline text-[#0F2229]">
                {value}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest font-headline text-[#94a3b8]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Community (main column) */}
        <div className="lg:col-span-2">
          {space ? (
            <CommunityContainer
              type="creator"
              title={space.title}
              creatorName={profile?.display_name ?? undefined}
              memberCount={memberCount}
              spaceId={space.id}
            >
              <PostFeed
                spaceId={space.id}
                communityType="creator"
                currentUserId={user!.id}
                canPost={true}
              />
            </CommunityContainer>
          ) : (
            <div
              className="text-center py-20 rounded-2xl border border-dashed"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.55)",
                borderColor: "rgba(15, 34, 41, 0.12)",
              }}
            >
              <p className="text-base font-bold font-headline mb-2 text-[#0F2229]">
                No community yet
              </p>
              <p className="text-sm max-w-sm mx-auto text-[#64748b]">
                Your community space appears automatically when someone
                purchases a session or challenge from you.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Next Up */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-headline text-[#94a3b8]">
                Next Up
              </h3>
              <Link
                href="/dashboard/sessions"
                className="text-[10px] font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
              >
                All →
              </Link>
            </div>

            {!hasUpcoming ? (
              <div
                className="p-5 rounded-2xl border border-dashed text-center"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.55)",
                  borderColor: "rgba(15, 34, 41, 0.12)",
                }}
              >
                <p className="text-xs mb-2 text-[#64748b]">
                  No upcoming sessions
                </p>
                <Link
                  href="/dashboard/sessions/new"
                  className="text-xs font-bold font-headline text-[#FF6130]"
                >
                  + Create session
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSessions!.map((sess: any) => {
                  const startTime = new Date(sess.start_time);
                  const goLiveOpensAt = new Date(
                    startTime.getTime() - 15 * 60 * 1000
                  );
                  const canGoLive = now >= goLiveOpensAt;
                  const hasRoom = !!sess.live_room_id;
                  const challengeName = challengeMap[sess.id];

                  return (
                    <Link
                      key={sess.id}
                      href={`/dashboard/sessions/${sess.id}`}
                      className="group block p-4 rounded-2xl infitra-card-link"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            hasRoom
                              ? "bg-red-500 animate-pulse"
                              : canGoLive
                                ? "bg-[#FF6130]"
                                : ""
                          }`}
                          style={
                            !hasRoom && !canGoLive
                              ? {
                                  backgroundColor: "rgba(15, 34, 41, 0.20)",
                                }
                              : undefined
                          }
                        />
                        <span className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]">
                          {sess.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-4">
                        <span className="text-[10px] text-[#64748b]">
                          {formatRelativeTime(sess.start_time)}
                          {challengeName && (
                            <span className="ml-1 text-[#FF6130]/65">
                              · {challengeName}
                            </span>
                          )}
                        </span>
                        {hasRoom ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline">
                            Enter
                          </span>
                        ) : canGoLive ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#FF6130] text-white text-[9px] font-bold font-headline">
                            Go Live
                          </span>
                        ) : (
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            className="shrink-0 opacity-0 group-hover:opacity-50 text-[#0F2229]"
                          >
                            <path
                              d="M9 18l6-6-6-6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Tribes */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-headline mb-3 text-[#94a3b8]">
              Your Tribes
            </h3>

            {!hasTribes ? (
              <div
                className="p-5 rounded-2xl border border-dashed text-center"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.55)",
                  borderColor: "rgba(15, 34, 41, 0.12)",
                }}
              >
                <p className="text-xs text-[#64748b]">
                  Tribes appear when you publish challenges.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {challengeSpaces!.map((cs: any) => (
                  <CommunityCard
                    key={cs.id}
                    type="challenge"
                    spaceId={cs.id}
                    title={cs.title}
                    subtitle={
                      challengeTitleMap[cs.source_challenge_id] ?? "Challenge"
                    }
                    memberCount={tribeMemberCounts[cs.id] ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
