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

  // Challenge details
  let challenge: any = null;
  if (space.source_challenge_id) {
    const { data: ch } = await supabase
      .from("app_challenge")
      .select("id, title, description, start_date, end_date, price_cents")
      .eq("id", space.source_challenge_id)
      .single();
    challenge = ch;
  }

  const { data: canPostResult } = await supabase.rpc("can_post_in_challenge_space", { p_space: spaceId, p_user: user.id });
  const canPost = canPostResult === true;

  // Members with profiles
  const { data: memberRows } = await supabase
    .from("app_challenge_space_member")
    .select("user_id")
    .eq("space_id", spaceId)
    .limit(12);
  const memberIds = (memberRows ?? []).map((m: any) => m.user_id);
  const memberProfiles: { id: string; name: string; avatar?: string }[] = [];
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", memberIds);
    for (const p of profiles ?? []) {
      memberProfiles.push({ id: p.id, name: p.display_name ?? "User", avatar: p.avatar_url ?? undefined });
    }
  }
  const memberCount = memberIds.length;

  // Owner profile (full)
  const { data: owner } = await supabase
    .from("app_profile")
    .select("id, display_name, avatar_url, tagline, bio, username")
    .eq("id", space.owner_id)
    .single();

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
  const totalMinutes = allSessions.reduce((acc: number, s: any) => acc + (s.duration_minutes ?? 0), 0);
  const completedMinutes = pastSessions.reduce((acc: number, s: any) => acc + (s.duration_minutes ?? 0), 0);

  const tribeState = liveSession ? "live" : nextSession ? "upcoming" : allSessions.length > 0 ? "between" : "new";

  function formatCountdown(dateStr: string) {
    const d = new Date(dateStr);
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 0) return { value: "NOW", unit: "" };
    if (diffMin < 60) return { value: String(diffMin), unit: "min" };
    if (diffH < 24) return { value: String(diffH), unit: diffH === 1 ? "hour" : "hours" };
    return { value: String(diffD), unit: diffD === 1 ? "day" : "days" };
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  const countdown = hotSession ? formatCountdown(hotSession.start_time) : null;
  const avatarColors = ["#FF6130", "#0891b2", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Deep dark overlay — waves still hint through at the edges */}
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(8, 18, 24, 0.94)" }} />

      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20 px-6">
          <div className="max-w-4xl mx-auto py-8">

            <Link href={backPath} className="text-xs mb-6 flex items-center gap-1.5 font-headline text-[#9CF0FF]/60 hover:text-white">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Link>

            {/* ══════════════════════════════════════════════════
                TRIBE HEADER
                ══════════════════════════════════════════════════ */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight leading-none mb-3">
                {space.title}
              </h1>
              {space.description && (
                <p className="text-base text-[#9CF0FF]/70 max-w-xl mb-4">{space.description}</p>
              )}
              {challenge && (
                <div className="flex items-center gap-3 text-xs text-[#9CF0FF]/50">
                  {challenge.start_date && challenge.end_date && (
                    <span>{formatDate(challenge.start_date)} — {formatDate(challenge.end_date)}</span>
                  )}
                  {challenge.price_cents > 0 && (
                    <span>· CHF {(challenge.price_cents / 100).toFixed(2)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── LEFT COLUMN (2/3) ─────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">

                {/* THE HOT SESSION */}
                {hotSession && (
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: tribeState === "live"
                        ? "linear-gradient(135deg, #991b1b 0%, #450a0a 100%)"
                        : "linear-gradient(135deg, #9a3412 0%, #431407 100%)",
                      border: `2px solid ${tribeState === "live" ? "#ef4444" : "#FF6130"}`,
                      boxShadow: tribeState === "live"
                        ? "0 0 60px rgba(239,68,68,0.35), 0 0 120px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "0 0 60px rgba(255,97,48,0.30), 0 0 120px rgba(255,97,48,0.10), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="p-8 md:p-10">
                      <div className="flex items-end gap-3 mb-5">
                        <span
                          className="text-7xl md:text-8xl font-black font-headline leading-none"
                          style={{
                            color: tribeState === "live" ? "#ef4444" : "#FF6130",
                            textShadow: tribeState === "live" ? "0 0 40px rgba(239,68,68,0.7), 0 0 80px rgba(239,68,68,0.3)" : "0 0 40px rgba(255,97,48,0.6), 0 0 80px rgba(255,97,48,0.2)",
                          }}
                        >
                          {tribeState === "live" ? "LIVE" : countdown?.value}
                        </span>
                        {countdown?.unit && (
                          <span className="text-2xl font-bold font-headline mb-3" style={{ color: tribeState === "live" ? "#fca5a5" : "#fdba74" }}>
                            {countdown.unit}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black font-headline text-white tracking-tight mb-2">
                        {hotSession.title}
                      </h2>
                      <p className="text-sm text-white/60 mb-6">
                        {formatSessionTime(hotSession.start_time)} · {hotSession.duration_minutes} min
                      </p>
                      {tribeState === "live" ? (
                        <Link
                          href={`/sessions/${hotSession.id}/live`}
                          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-white text-base font-black font-headline"
                          style={{ backgroundColor: "#ef4444", boxShadow: "0 0 30px rgba(239,68,68,0.6), 0 4px 14px rgba(239,68,68,0.4)" }}
                        >
                          <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                          Join Now
                        </Link>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* New/empty tribe — full potential */}
                {tribeState === "new" && (
                  <div className="rounded-2xl p-10 text-center" style={{ background: "linear-gradient(135deg, #2a1508 0%, #0c2933 100%)", border: "2px solid #9a3412" }}>
                    <p className="text-3xl font-black font-headline text-white mb-3">
                      {isOwner ? "Your stage is set" : "Something is about to begin"}
                    </p>
                    <p className="text-sm text-[#9CF0FF]/70 max-w-md mx-auto">
                      {isOwner
                        ? "Add sessions to your challenge. When they go live, this space ignites."
                        : "Sessions will drop here soon. Stay — this is where it happens."
                      }
                    </p>
                  </div>
                )}

                {tribeState === "between" && !hotSession && (
                  <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0c2933 0%, #152830 100%)", border: "1px solid #0e7490" }}>
                    <p className="text-lg font-bold font-headline text-[#9CF0FF]/70 mb-1">
                      {completedSessions} session{completedSessions !== 1 ? "s" : ""} done. Keep moving.
                    </p>
                    <p className="text-sm text-[#9CF0FF]/50">
                      Share your progress below. Your tribe is watching.
                    </p>
                  </div>
                )}

                {/* ALL SESSIONS — horizontal scrollable */}
                {allSessions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/50 mb-3">All Sessions</p>
                    <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                      {allSessions.map((sess: any, idx: number) => {
                        const isLive = !!sess.live_room_id && sess.status !== "ended";
                        const isEnded = sess.status === "ended";
                        const isHot = hotSession?.id === sess.id;
                        const cd = formatCountdown(sess.start_time);
                        const sessDate = new Date(sess.start_time);

                        return (
                          <div
                            key={sess.id}
                            className="shrink-0 w-56 rounded-xl overflow-hidden"
                            style={{
                              boxShadow: isHot
                                ? `0 0 30px ${isLive ? "rgba(239,68,68,0.4)" : "rgba(255,97,48,0.35)"}`
                                : "0 4px 12px rgba(0,0,0,0.4)",
                            }}
                          >
                            {/* Top color bar — solid, bold */}
                            <div
                              className="h-2"
                              style={{
                                backgroundColor: isLive ? "#ef4444" : isEnded ? "#0891b2" : isHot ? "#FF6130" : "#1a3340",
                              }}
                            />

                            <div
                              className="p-4"
                              style={{
                                backgroundColor: isLive ? "#7f1d1d" : isEnded ? "#0c4a6e" : isHot ? "#7c2d12" : "#0f2d3a",
                              }}
                            >
                              {/* Session number + status */}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black font-headline text-white/40">
                                  #{idx + 1}
                                </span>
                                <span
                                  className={`text-[10px] font-bold font-headline uppercase tracking-wider ${isLive ? "animate-pulse" : ""}`}
                                  style={{
                                    color: isLive ? "#fca5a5" : isEnded ? "#67e8f9" : isHot ? "#fdba74" : "#9CF0FF80",
                                  }}
                                >
                                  {isLive ? "● LIVE" : isEnded ? "✓ DONE" : isHot ? `IN ${cd.value}${cd.unit ? cd.unit[0].toUpperCase() : ""}` : sessDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                              </div>

                              {/* Title — bold */}
                              <p className="text-base font-black font-headline text-white mb-3 line-clamp-2 leading-tight">{sess.title}</p>

                              {/* Time block */}
                              <div className="flex items-center gap-3">
                                <div className="px-2 py-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
                                  <p className="text-xs font-black font-headline text-white">{sessDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                                <span className="text-xs font-bold text-white/60">{sess.duration_minutes} min</span>
                              </div>
                              <p className="text-[10px] text-white/40 mt-2">
                                {sessDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                              </p>

                              {/* Action */}
                              {isLive && (
                                <Link
                                  href={`/sessions/${sess.id}/live`}
                                  className="mt-3 block text-center py-2.5 rounded-full text-sm font-black font-headline text-white"
                                  style={{ backgroundColor: "#ef4444", boxShadow: "0 0 20px rgba(239,68,68,0.6)" }}
                                >
                                  JOIN NOW
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TRIBE ACTIVITY */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6130]" />
                    <h2 className="text-sm font-bold font-headline uppercase tracking-wider text-white">Tribe Activity</h2>
                  </div>
                  <PostFeed spaceId={spaceId} communityType="challenge" currentUserId={user.id} canPost={canPost} />
                </div>
              </div>

              {/* ── RIGHT SIDEBAR ─────────────────────────────── */}
              <div className="space-y-6">

                {/* Active Challenge Progress */}
                {totalSessions > 0 && (
                  <div className="rounded-2xl p-5" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-4">Active Challenge Progress</p>

                    {/* Progress ring (simplified as arc) */}
                    <div className="flex items-center gap-5 mb-5">
                      <div className="relative w-20 h-20 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#1a3340"
                            strokeWidth="3.5"
                          />
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#FF6130"
                            strokeWidth="3.5"
                            strokeDasharray={`${progressPct}, 100`}
                            strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 0 8px rgba(255,97,48,0.7)) drop-shadow(0 0 20px rgba(255,97,48,0.3))" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black font-headline text-white">{progressPct}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-2xl font-black font-headline text-white leading-none">{completedSessions}<span className="text-[#9CF0FF]/50 text-sm font-normal">/{totalSessions}</span></p>
                        <p className="text-xs text-[#9CF0FF]/60 mt-1">sessions</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: "#0c2933", border: "1px solid #0e7490" }}>
                        <p className="text-xl font-black font-headline text-[#9CF0FF] leading-none">{completedMinutes}</p>
                        <p className="text-[10px] text-[#9CF0FF]/60 mt-1 font-headline font-bold">MIN DONE</p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ backgroundColor: "#2a1508", border: "1px solid #9a3412" }}>
                        <p className="text-xl font-black font-headline text-[#FF6130] leading-none">{totalMinutes - completedMinutes}</p>
                        <p className="text-[10px] text-[#FF6130]/60 mt-1 font-headline font-bold">MIN LEFT</p>
                      </div>
                    </div>

                    {/* Session timeline dots */}
                    {totalSessions <= 20 && (
                      <div className="flex items-center gap-1 mt-4 flex-wrap">
                        {allSessions.map((sess: any) => {
                          const isLive = !!sess.live_room_id && sess.status !== "ended";
                          const isEnded = sess.status === "ended";
                          const isNext = hotSession?.id === sess.id;
                          return (
                            <div
                              key={sess.id}
                              className={`rounded-full ${isLive || isNext ? "w-3 h-3" : "w-2.5 h-2.5"}`}
                              style={{
                                backgroundColor: isLive ? "#ef4444" : isNext ? "#FF6130" : isEnded ? "#9CF0FF" : "rgba(156,240,255,0.12)",
                                border: isNext && !isLive ? "2px solid rgba(255,97,48,0.5)" : undefined,
                                animation: isLive ? "pulse 2s ease-in-out infinite" : undefined,
                              }}
                              title={sess.title}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Host */}
                <div className="rounded-2xl p-5" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-4">Your Host</p>
                  <div className="flex items-center gap-3 mb-3">
                    {owner?.avatar_url ? (
                      <img src={owner.avatar_url} alt={owner.display_name ?? ""} className="w-14 h-14 rounded-full object-cover" style={{ border: "3px solid #FF6130", boxShadow: "0 0 15px rgba(255,97,48,0.3)" }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#7c2d12", border: "3px solid #FF6130" }}>
                        <span className="text-xl font-black font-headline text-white">{(owner?.display_name ?? "?")[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-base font-black font-headline text-white truncate">{owner?.display_name}</p>
                      {owner?.tagline && <p className="text-xs text-[#9CF0FF]/70 truncate">{owner.tagline}</p>}
                    </div>
                  </div>
                  {owner?.bio && <p className="text-xs text-[#9CF0FF]/50 line-clamp-3 leading-relaxed">{owner.bio}</p>}
                  {owner?.username && (
                    <Link href={`/creators/${owner.username}`} className="block mt-3 text-[10px] font-bold font-headline text-[#FF6130]">
                      View Profile →
                    </Link>
                  )}
                </div>

                {/* Members */}
                <div className="rounded-2xl p-5" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/50 mb-4">
                    {memberCount === 0 ? "Members" : `${memberCount} Member${memberCount !== 1 ? "s" : ""}`}
                  </p>
                  {memberCount > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {memberProfiles.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-2 py-1.5 px-3 rounded-full" style={{ backgroundColor: "#0a1a22" }}>
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                              {m.name[0].toUpperCase()}
                            </div>
                          )}
                          <span className="text-[11px] text-white font-headline">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#9CF0FF]/20">
                      {isOwner ? "Share your challenge to grow your tribe" : "Be the first to join this tribe"}
                    </p>
                  )}
                </div>

                {/* Collaborators placeholder — for later */}
                <div className="rounded-2xl p-5" style={{ backgroundColor: "#12222b", border: "1px dashed #1a3340" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]/60 mb-2">Collaborators</p>
                  <p className="text-xs text-[#9CF0FF]/40">
                    Invite creators to co-host sessions and split revenue — coming soon
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
