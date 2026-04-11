import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = {
  title: "Tribe — INFITRA",
};

export default async function ChallengeTribePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: space } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, owner_id, source_challenge_id")
    .eq("id", spaceId)
    .single();
  if (!space) notFound();

  let challengeTitle: string | null = null;
  if (space.source_challenge_id) {
    const { data: ch } = await supabase.from("app_challenge").select("title").eq("id", space.source_challenge_id).single();
    challengeTitle = ch?.title ?? null;
  }

  const { data: canPostResult } = await supabase.rpc("can_post_in_challenge_space", { p_space: spaceId, p_user: user.id });
  const canPost = canPostResult === true;

  // Members with names for avatars
  const { data: memberRows } = await supabase
    .from("app_challenge_space_member")
    .select("user_id")
    .eq("space_id", spaceId)
    .limit(8);
  const memberIds = (memberRows ?? []).map((m: any) => m.user_id);
  const memberProfiles: { id: string; name: string; avatar?: string }[] = [];
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url")
      .in("id", memberIds);
    for (const p of profiles ?? []) {
      memberProfiles.push({ id: p.id, name: p.display_name ?? "User", avatar: p.avatar_url ?? undefined });
    }
  }
  const memberCount = memberIds.length;

  const { data: owner } = await supabase.from("app_profile").select("display_name, avatar_url").eq("id", space.owner_id).single();
  const { data: myProfile } = await supabase.from("app_profile").select("display_name, role").eq("id", user.id).single();

  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/discover";
  const isOwner = user.id === space.owner_id;

  // Sessions
  let allSessions: any[] = [];
  const now = new Date();
  if (space.source_challenge_id) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id)")
      .eq("challenge_id", space.source_challenge_id);
    allSessions = (links ?? []).map((l: any) => l.app_session).filter(Boolean)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  const liveSession = allSessions.find((s: any) => !!s.live_room_id && s.status !== "ended");
  const upcomingSessions = allSessions.filter((s: any) => !s.live_room_id && s.status !== "ended" && new Date(s.start_time) > now);
  const nextSession = upcomingSessions[0];
  const pastSessions = allSessions.filter((s: any) => s.status === "ended");
  const hotSession = liveSession ?? nextSession;
  const totalSessions = allSessions.length;
  const completedSessions = pastSessions.length;
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const tribeState = liveSession ? "live" : nextSession ? "upcoming" : allSessions.length > 0 ? "between" : "new";

  // Countdown helpers
  function formatCountdown(dateStr: string) {
    const d = new Date(dateStr);
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 0) return { value: "Now", unit: "" };
    if (diffMin < 60) return { value: String(diffMin), unit: "min" };
    if (diffH < 24) return { value: String(diffH), unit: diffH === 1 ? "hour" : "hours" };
    return { value: String(diffD), unit: diffD === 1 ? "day" : "days" };
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  const countdown = hotSession ? formatCountdown(hotSession.start_time) : null;

  // Avatar colors for members without photos
  const avatarColors = ["#FF6130", "#0891b2", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(15, 34, 41, 0.88)" }} />

      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20 px-6">
          <div className="max-w-3xl mx-auto py-8">

            <Link href={backPath} className="text-xs mb-6 flex items-center gap-1.5 font-headline text-[#9CF0FF]/40 hover:text-white">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Link>

            {/* ══════════════════════════════════════════════════
                HEADER — tribe name + progress + members
                ══════════════════════════════════════════════════ */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight leading-none mb-5">
                {space.title}
              </h1>

              {/* Progress bar */}
              {totalSessions > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-headline text-[#9CF0FF]/60">
                      {completedSessions} of {totalSessions} sessions
                    </span>
                    <span className="text-xs font-black font-headline text-[#FF6130]">{progressPct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(156,240,255,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(progressPct, 2)}%`,
                        background: progressPct === 100
                          ? "linear-gradient(90deg, #10b981, #059669)"
                          : "linear-gradient(90deg, #FF6130, #FF6130cc)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Session timeline dots */}
              {totalSessions > 0 && totalSessions <= 20 && (
                <div className="flex items-center gap-1.5 mb-5">
                  {allSessions.map((sess: any, i: number) => {
                    const isLive = !!sess.live_room_id && sess.status !== "ended";
                    const isEnded = sess.status === "ended";
                    const isNext = hotSession?.id === sess.id;
                    return (
                      <div
                        key={sess.id}
                        className={`rounded-full ${isLive || isNext ? "w-3.5 h-3.5" : "w-2.5 h-2.5"}`}
                        style={{
                          backgroundColor: isLive
                            ? "#ef4444"
                            : isNext
                              ? "#FF6130"
                              : isEnded
                                ? "#9CF0FF"
                                : "rgba(156,240,255,0.15)",
                          border: isNext && !isLive ? "2px solid rgba(255,97,48,0.5)" : undefined,
                          animation: isLive ? "pulse 2s ease-in-out infinite" : undefined,
                        }}
                        title={sess.title}
                      />
                    );
                  })}
                </div>
              )}

              {/* Member avatars */}
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  {/* Owner avatar always first */}
                  {owner?.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt={owner.display_name ?? ""}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0F2229]"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-[#0F2229] text-[10px] font-black font-headline text-white"
                      style={{ backgroundColor: avatarColors[0] }}
                    >
                      {(owner?.display_name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {/* Member avatars */}
                  {memberProfiles.filter(m => m.id !== space.owner_id).slice(0, 5).map((m, i) => (
                    m.avatar ? (
                      <img
                        key={m.id}
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0F2229]"
                      />
                    ) : (
                      <div
                        key={m.id}
                        className="w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-[#0F2229] text-[10px] font-black font-headline text-white"
                        style={{ backgroundColor: avatarColors[(i + 1) % avatarColors.length] }}
                      >
                        {m.name[0].toUpperCase()}
                      </div>
                    )
                  ))}
                </div>
                <span className="text-xs text-[#9CF0FF]/40">
                  {memberCount === 0
                    ? "No members yet — be the first"
                    : `${memberCount} member${memberCount !== 1 ? "s" : ""}`}
                </span>
                <span className="text-[10px] text-[#9CF0FF]/20">·</span>
                <span className="text-xs text-[#9CF0FF]/30">
                  by {owner?.display_name}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                THE HOT SESSION — visual weight, color-filled
                ══════════════════════════════════════════════════ */}
            {hotSession && (
              <div
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                  background: tribeState === "live"
                    ? "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)"
                    : "linear-gradient(135deg, rgba(255,97,48,0.12) 0%, rgba(255,97,48,0.03) 100%)",
                  border: `1px solid ${tribeState === "live" ? "rgba(239,68,68,0.25)" : "rgba(255,97,48,0.20)"}`,
                }}
              >
                <div className="p-6 md:p-8">
                  {/* Countdown block */}
                  {countdown && (
                    <div className="flex items-end gap-2 mb-4">
                      <span
                        className="text-5xl md:text-6xl font-black font-headline leading-none"
                        style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130" }}
                      >
                        {tribeState === "live" ? "LIVE" : countdown.value}
                      </span>
                      {countdown.unit && (
                        <span
                          className="text-lg font-bold font-headline mb-1"
                          style={{ color: tribeState === "live" ? "rgba(239,68,68,0.6)" : "rgba(255,97,48,0.6)" }}
                        >
                          {countdown.unit}
                        </span>
                      )}
                    </div>
                  )}

                  <h2 className="text-xl md:text-2xl font-black font-headline text-white tracking-tight mb-2">
                    {hotSession.title}
                  </h2>
                  <p className="text-sm text-[#9CF0FF]/40 mb-5">
                    {formatSessionTime(hotSession.start_time)} · {hotSession.duration_minutes} min
                  </p>

                  {tribeState === "live" ? (
                    <Link
                      href={`/sessions/${hotSession.id}/live`}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-white text-sm font-black font-headline"
                      style={{ backgroundColor: "#ef4444", boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      Join Now
                    </Link>
                  ) : (
                    <p className="text-sm font-bold font-headline text-[#FF6130]">
                      {formatSessionTime(hotSession.start_time)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upcoming sessions — secondary */}
            {upcomingSessions.length > 1 && (
              <div className="mb-6 space-y-1">
                {upcomingSessions.slice(1, 4).map((sess: any) => {
                  const cd = formatCountdown(sess.start_time);
                  return (
                    <div key={sess.id} className="flex items-center justify-between py-2.5 px-4 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#FF6130]/30 shrink-0" />
                        <span className="text-sm text-white font-bold font-headline truncate">{sess.title}</span>
                      </div>
                      <span className="text-xs font-bold font-headline text-[#9CF0FF]/40 shrink-0 ml-3">
                        {cd.value}{cd.unit ? ` ${cd.unit}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty / new tribe state */}
            {tribeState === "new" && (
              <div className="rounded-2xl p-8 md:p-10 mb-6 text-center" style={{ background: "linear-gradient(135deg, rgba(255,97,48,0.06) 0%, rgba(156,240,255,0.04) 100%)", border: "1px solid rgba(255,97,48,0.12)" }}>
                <p className="text-2xl font-black font-headline text-white mb-3">
                  {isOwner ? "Ready to launch" : "Something is about to begin"}
                </p>
                <p className="text-sm text-[#9CF0FF]/50 max-w-md mx-auto">
                  {isOwner
                    ? "Add sessions to your challenge. When it starts, this space comes alive."
                    : "Sessions will appear here soon. Stay — this is where things happen."
                  }
                </p>
              </div>
            )}

            {tribeState === "between" && !hotSession && (
              <div className="rounded-2xl p-6 mb-6" style={{ background: "linear-gradient(135deg, rgba(156,240,255,0.06) 0%, rgba(156,240,255,0.02) 100%)", border: "1px solid rgba(156,240,255,0.10)" }}>
                <p className="text-sm font-bold font-headline text-[#9CF0FF]/70 mb-1">
                  {completedSessions} session{completedSessions !== 1 ? "s" : ""} down. Keep the momentum.
                </p>
                <p className="text-xs text-[#9CF0FF]/30">
                  Share your progress. Celebrate wins. Stay connected.
                </p>
              </div>
            )}

            {/* Completed sessions — faded */}
            {pastSessions.length > 0 && (
              <div className="mb-6">
                <div className="space-y-0.5">
                  {pastSessions.slice(0, 3).map((sess: any) => (
                    <div key={sess.id} className="flex items-center gap-3 py-1.5 px-3 opacity-30">
                      <span className="w-2 h-2 rounded-full bg-[#9CF0FF] shrink-0" />
                      <span className="text-xs text-[#9CF0FF]/60 font-headline truncate">{sess.title}</span>
                      <span className="text-[10px] text-[#9CF0FF]/20 shrink-0">done</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TRIBE ACTIVITY
                ══════════════════════════════════════════════════ */}
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6130]" />
                <h2 className="text-sm font-bold font-headline uppercase tracking-wider text-white">
                  Tribe Activity
                </h2>
              </div>

              <PostFeed
                spaceId={spaceId}
                communityType="challenge"
                currentUserId={user.id}
                canPost={canPost}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
