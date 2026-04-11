import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";

export const metadata = { title: "Tribe — INFITRA" };

export default async function ChallengeTribePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: space } = await supabase.from("app_challenge_space").select("id, title, description, owner_id, source_challenge_id").eq("id", spaceId).single();
  if (!space) notFound();

  let challenge: any = null;
  if (space.source_challenge_id) {
    const { data: ch } = await supabase.from("app_challenge").select("id, title, description, start_date, end_date, price_cents").eq("id", space.source_challenge_id).single();
    challenge = ch;
  }

  const { data: canPostResult } = await supabase.rpc("can_post_in_challenge_space", { p_space: spaceId, p_user: user.id });
  const canPost = canPostResult === true;

  const { data: memberRows } = await supabase.from("app_challenge_space_member").select("user_id").eq("space_id", spaceId).limit(20);
  const memberIds = (memberRows ?? []).map((m: any) => m.user_id);
  const memberProfiles: { id: string; name: string; avatar?: string }[] = [];
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", memberIds);
    for (const p of profiles ?? []) memberProfiles.push({ id: p.id, name: p.display_name ?? "User", avatar: p.avatar_url ?? undefined });
  }
  const memberCount = memberIds.length;

  const { data: owner } = await supabase.from("app_profile").select("id, display_name, avatar_url, tagline, bio, username").eq("id", space.owner_id).single();
  const { data: myProfile } = await supabase.from("app_profile").select("display_name, role").eq("id", user.id).single();
  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/discover";
  const isOwner = user.id === space.owner_id;

  let allSessions: any[] = [];
  const now = new Date();
  if (space.source_challenge_id) {
    const { data: links } = await supabase.from("app_challenge_session").select("session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id)").eq("challenge_id", space.source_challenge_id);
    allSessions = (links ?? []).map((l: any) => l.app_session).filter(Boolean).sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  const liveSession = allSessions.find((s: any) => !!s.live_room_id && s.status !== "ended");
  const upcomingSessions = allSessions.filter((s: any) => !s.live_room_id && s.status !== "ended" && new Date(s.start_time) > now);
  const nextSession = upcomingSessions[0];
  const pastSessions = allSessions.filter((s: any) => s.status === "ended");
  const hotSession = liveSession ?? nextSession;
  const totalSessions = allSessions.length;
  const completedSessions = pastSessions.length;
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const totalMinutes = allSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0);
  const completedMinutes = pastSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0);
  const tribeState = liveSession ? "live" : nextSession ? "upcoming" : allSessions.length > 0 ? "between" : "new";

  function formatCountdown(dateStr: string) {
    const d = new Date(dateStr); const diffMs = d.getTime() - now.getTime(); const diffMin = Math.floor(diffMs / 60000); const diffH = Math.floor(diffMin / 60); const diffD = Math.floor(diffH / 24);
    if (diffMin < 0) return { value: "NOW", unit: "" }; if (diffMin < 60) return { value: String(diffMin), unit: "min" }; if (diffH < 24) return { value: String(diffH), unit: diffH === 1 ? "hour" : "hours" }; return { value: String(diffD), unit: diffD === 1 ? "day" : "days" };
  }
  function formatDate(dateStr: string) { return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }

  const countdown = hotSession ? formatCountdown(hotSession.start_time) : null;
  const avatarColors = ["#FF6130", "#0891b2", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(8, 18, 24, 0.94)" }} />
      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20">

          {/* ══════════════════════════════════════════════════
              HERO HEADER — full width, rich, immersive
              ══════════════════════════════════════════════════ */}
          <div className="px-6 md:px-10 lg:px-16 py-10" style={{ borderBottom: "1px solid #1a3340" }}>
            <div className="max-w-7xl mx-auto">
              <Link href={backPath} className="text-xs mb-6 flex items-center gap-1.5 font-headline text-[#9CF0FF]/50 hover:text-white">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back
              </Link>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: title + description + meta */}
                <div className="lg:col-span-2">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-headline text-white tracking-tight leading-none mb-4">
                    {space.title}
                  </h1>
                  {space.description && (
                    <p className="text-lg text-[#9CF0FF]/70 max-w-2xl mb-5 leading-relaxed">{space.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    {challenge?.start_date && challenge?.end_date && (
                      <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#0f2d3a" }}>
                        <span className="text-xs font-bold font-headline text-[#9CF0FF]">{formatDate(challenge.start_date)} — {formatDate(challenge.end_date)}</span>
                      </div>
                    )}
                    {challenge?.price_cents > 0 && (
                      <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#2a1508" }}>
                        <span className="text-xs font-bold font-headline text-[#FF6130]">CHF {(challenge.price_cents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#0f2d3a" }}>
                      <span className="text-xs font-bold font-headline text-[#9CF0FF]">{totalSessions} session{totalSessions !== 1 ? "s" : ""} · {totalMinutes} min total</span>
                    </div>
                  </div>

                  {/* Member avatars */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                      {owner?.avatar_url ? (
                        <img src={owner.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0a1218]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-[#0a1218] text-xs font-black text-white" style={{ backgroundColor: "#FF6130" }}>
                          {(owner?.display_name ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      {memberProfiles.filter(m => m.id !== space.owner_id).slice(0, 6).map((m, i) => (
                        m.avatar ? (
                          <img key={m.id} src={m.avatar} alt={m.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0a1218]" />
                        ) : (
                          <div key={m.id} className="w-9 h-9 rounded-full flex items-center justify-center ring-2 ring-[#0a1218] text-xs font-black text-white" style={{ backgroundColor: avatarColors[(i + 1) % avatarColors.length] }}>
                            {m.name[0].toUpperCase()}
                          </div>
                        )
                      ))}
                    </div>
                    <span className="text-sm text-white font-bold font-headline">
                      {memberCount === 0 ? "Be the first to join" : `${memberCount} member${memberCount !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>

                {/* Right: host card + progress */}
                <div className="space-y-4">
                  {/* Host — scrollable row for future collaborators */}
                  <div>
                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-3">Host</p>
                    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      <Link
                        href={owner?.username ? `/creators/${owner.username}` : "#"}
                        className="shrink-0 flex items-center gap-3 p-3 rounded-xl group"
                        style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340", minWidth: "200px" }}
                      >
                        {owner?.avatar_url ? (
                          <img src={owner.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: "3px solid #FF6130", boxShadow: "0 0 12px rgba(255,97,48,0.3)" }} />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#7c2d12", border: "3px solid #FF6130" }}>
                            <span className="text-lg font-black font-headline text-white">{(owner?.display_name ?? "?")[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-black font-headline text-white truncate group-hover:text-[#FF6130]">{owner?.display_name}</p>
                          {owner?.tagline && <p className="text-[10px] text-[#9CF0FF]/60 truncate">{owner.tagline}</p>}
                        </div>
                      </Link>
                      {/* Future collaborators would go here as additional cards */}
                    </div>
                  </div>

                  {/* Progress compact */}
                  {totalSessions > 0 && (
                    <div className="p-4 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}>
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1a3340" strokeWidth="4" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#FF6130" strokeWidth="4" strokeDasharray={`${progressPct}, 100`} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,97,48,0.7))" }} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black font-headline text-white">{progressPct}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-black font-headline text-white leading-none">{completedSessions}<span className="text-white/40 text-sm">/{totalSessions}</span></p>
                          <p className="text-xs text-[#9CF0FF]/60">sessions done</p>
                          <p className="text-[10px] text-[#FF6130] font-bold font-headline mt-1">{completedMinutes} min done · {totalMinutes - completedMinutes} left</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              HOT SESSION — full width banner
              ══════════════════════════════════════════════════ */}
          {hotSession && (
            <div
              className="px-6 md:px-10 lg:px-16 py-8"
              style={{
                background: tribeState === "live"
                  ? "linear-gradient(135deg, #991b1b 0%, #450a0a 50%, #0a1218 100%)"
                  : "linear-gradient(135deg, #9a3412 0%, #431407 50%, #0a1218 100%)",
                borderBottom: `2px solid ${tribeState === "live" ? "#ef4444" : "#FF6130"}`,
              }}
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-7xl md:text-8xl font-black font-headline leading-none" style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130", textShadow: `0 0 40px ${tribeState === "live" ? "rgba(239,68,68,0.6)" : "rgba(255,97,48,0.5)"}` }}>
                      {tribeState === "live" ? "LIVE" : countdown?.value}
                    </span>
                    {countdown?.unit && <span className="text-2xl font-bold font-headline mb-3" style={{ color: tribeState === "live" ? "#fca5a5" : "#fdba74" }}>{countdown.unit}</span>}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black font-headline text-white tracking-tight mb-1">{hotSession.title}</h2>
                  <p className="text-sm text-white/50">{new Date(hotSession.start_time).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · {hotSession.duration_minutes} min</p>
                </div>
                {tribeState === "live" && (
                  <Link href={`/sessions/${hotSession.id}/live`} className="px-10 py-4 rounded-full text-white text-lg font-black font-headline inline-flex items-center gap-3" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 30px rgba(239,68,68,0.6)" }}>
                    <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    JOIN NOW
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* States when no hot session */}
          {tribeState === "new" && (
            <div className="px-6 md:px-10 lg:px-16 py-12 text-center" style={{ background: "linear-gradient(135deg, #2a1508 0%, #0a1218 100%)", borderBottom: "2px solid #9a3412" }}>
              <div className="max-w-xl mx-auto">
                <p className="text-3xl font-black font-headline text-white mb-3">{isOwner ? "Your stage is set" : "Something is about to begin"}</p>
                <p className="text-base text-[#9CF0FF]/60">{isOwner ? "Add sessions to your challenge. When they go live, this space ignites." : "Sessions will drop here soon. This is where it happens."}</p>
              </div>
            </div>
          )}

          {tribeState === "between" && !hotSession && (
            <div className="px-6 md:px-10 lg:px-16 py-8" style={{ background: "linear-gradient(135deg, #0c2933 0%, #0a1218 100%)", borderBottom: "1px solid #0e7490" }}>
              <div className="max-w-7xl mx-auto">
                <p className="text-xl font-bold font-headline text-[#9CF0FF] mb-1">{completedSessions} session{completedSessions !== 1 ? "s" : ""} done. Keep moving.</p>
                <p className="text-sm text-[#9CF0FF]/50">Share your progress. Your tribe is watching.</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SESSIONS — full width horizontal scroll
              ══════════════════════════════════════════════════ */}
          {allSessions.length > 0 && (
            <div className="px-6 md:px-10 lg:px-16 py-8" style={{ borderBottom: "1px solid #1a3340" }}>
              <div className="max-w-7xl mx-auto">
                <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-4">All Sessions</p>
                <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                  {allSessions.map((sess: any, idx: number) => {
                    const isLive = !!sess.live_room_id && sess.status !== "ended";
                    const isEnded = sess.status === "ended";
                    const isHot = hotSession?.id === sess.id;
                    const cd = formatCountdown(sess.start_time);
                    const sessDate = new Date(sess.start_time);
                    return (
                      <div key={sess.id} className="shrink-0 w-64 rounded-xl overflow-hidden" style={{ boxShadow: isHot ? `0 0 30px ${isLive ? "rgba(239,68,68,0.4)" : "rgba(255,97,48,0.35)"}` : "0 4px 16px rgba(0,0,0,0.4)" }}>
                        <div className="h-2" style={{ backgroundColor: isLive ? "#ef4444" : isEnded ? "#0891b2" : isHot ? "#FF6130" : "#1a3340" }} />
                        <div className="p-5" style={{ backgroundColor: isLive ? "#7f1d1d" : isEnded ? "#0c4a6e" : isHot ? "#7c2d12" : "#0f2d3a" }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black font-headline text-white/30">#{idx + 1}</span>
                            <span className={`text-xs font-bold font-headline uppercase tracking-wider ${isLive ? "animate-pulse" : ""}`} style={{ color: isLive ? "#fca5a5" : isEnded ? "#67e8f9" : isHot ? "#fdba74" : "#9CF0FF60" }}>
                              {isLive ? "● LIVE" : isEnded ? "✓ DONE" : isHot ? `IN ${cd.value}${cd.unit ? cd.unit[0].toUpperCase() : ""}` : sessDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="text-lg font-black font-headline text-white mb-3 line-clamp-2 leading-tight">{sess.title}</p>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="px-2.5 py-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                              <span className="text-sm font-black font-headline text-white">{sessDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <span className="text-sm font-bold text-white/50">{sess.duration_minutes} min</span>
                          </div>
                          <p className="text-xs text-white/30">{sessDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                          {isLive && (
                            <Link href={`/sessions/${sess.id}/live`} className="mt-4 block text-center py-2.5 rounded-full text-sm font-black font-headline text-white" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 20px rgba(239,68,68,0.6)" }}>
                              JOIN NOW
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TRIBE ACTIVITY + MEMBERS — full width
              ══════════════════════════════════════════════════ */}
          <div className="px-6 md:px-10 lg:px-16 py-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Activity feed */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-[#FF6130]" />
                  <h2 className="text-base font-bold font-headline uppercase tracking-wider text-white">Tribe Activity</h2>
                </div>
                <PostFeed spaceId={spaceId} communityType="challenge" currentUserId={user.id} canPost={canPost} />
              </div>

              {/* Members sidebar */}
              <div>
                <p className="text-xs font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/60 mb-4">
                  {memberCount === 0 ? "Members" : `${memberCount} Member${memberCount !== 1 ? "s" : ""}`}
                </p>
                {memberCount > 0 ? (
                  <div className="space-y-2">
                    {memberProfiles.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}>
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                            {m.name[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-white font-headline font-bold">{m.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl text-center" style={{ backgroundColor: "#0d1f28", border: "1px dashed #1a3340" }}>
                    <p className="text-sm text-[#9CF0FF]/40">{isOwner ? "Share your challenge to grow your tribe" : "Be the first to join"}</p>
                  </div>
                )}

                {/* Collaborators placeholder */}
                <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: "#0a1218", border: "1px dashed #1a3340" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]/50 mb-1">Collaborators</p>
                  <p className="text-xs text-[#9CF0FF]/30">Co-host sessions and split revenue — coming soon</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
