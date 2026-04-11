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
    const { data: ch } = await supabase.from("app_challenge").select("id, title, description, start_date, end_date, price_cents, status").eq("id", space.source_challenge_id).single();
    challenge = ch;
  }

  const { data: canPostResult } = await supabase.rpc("can_post_in_challenge_space", { p_space: spaceId, p_user: user.id });
  const canPost = canPostResult === true;

  const { data: spaceMemberRows } = await supabase.from("app_challenge_space_member").select("user_id").eq("space_id", spaceId).limit(30);
  const spaceMemberIds = (spaceMemberRows ?? []).map((m: any) => m.user_id);
  let allMemberProfiles: { id: string; name: string; avatar?: string }[] = [];
  if (spaceMemberIds.length > 0) {
    const { data: profiles } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", spaceMemberIds);
    allMemberProfiles = (profiles ?? []).map(p => ({ id: p.id, name: p.display_name ?? "User", avatar: p.avatar_url ?? undefined }));
  }
  const totalMemberCount = spaceMemberIds.length;

  let activeMemberProfiles: typeof allMemberProfiles = [];
  if (space.source_challenge_id) {
    const { data: cmRows } = await supabase.from("app_challenge_member").select("user_id").eq("challenge_id", space.source_challenge_id).limit(30);
    const cmIds = (cmRows ?? []).map((m: any) => m.user_id);
    activeMemberProfiles = allMemberProfiles.filter(m => cmIds.includes(m.id));
  }
  const activeMemberCount = activeMemberProfiles.length;

  const { data: owner } = await supabase.from("app_profile").select("id, display_name, avatar_url, tagline, bio, username").eq("id", space.owner_id).single();

  let cohosts: { id: string; name: string; avatar?: string; splitPct: number }[] = [];
  if (space.source_challenge_id) {
    const { data: cohostRows } = await supabase.from("app_challenge_cohost").select("cohost_id, split_percent").eq("challenge_id", space.source_challenge_id);
    if (cohostRows && cohostRows.length > 0) {
      const cohostIds = cohostRows.map((c: any) => c.cohost_id);
      const { data: cp } = await supabase.from("app_profile").select("id, display_name, avatar_url").in("id", cohostIds);
      for (const cr of cohostRows) {
        const p = (cp ?? []).find((pr: any) => pr.id === (cr as any).cohost_id);
        if (p) cohosts.push({ id: p.id, name: p.display_name ?? "User", avatar: p.avatar_url ?? undefined, splitPct: (cr as any).split_percent });
      }
    }
  }

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
  const nextSession = allSessions.filter((s: any) => !s.live_room_id && s.status !== "ended" && new Date(s.start_time) > now)[0];
  const pastSessions = allSessions.filter((s: any) => s.status === "ended");
  const hotSession = liveSession ?? nextSession;
  const totalSessions = allSessions.length;
  const completedSessions = pastSessions.length;
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const totalMinutes = allSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0);
  const completedMinutes = pastSessions.reduce((a: number, s: any) => a + (s.duration_minutes ?? 0), 0);
  const tribeState = liveSession ? "live" : nextSession ? "upcoming" : allSessions.length > 0 ? "between" : "new";
  const isActive = challenge?.status === "published";

  function fmtCountdown(dateStr: string) {
    const diffMs = new Date(dateStr).getTime() - now.getTime(); const m = Math.floor(diffMs / 60000); const h = Math.floor(m / 60); const d = Math.floor(h / 24);
    if (m < 0) return "NOW"; if (m < 60) return `${m}m`; if (h < 24) return `${h}h`; return `${d}d`;
  }
  function fmtDate(s: string) { return new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

  const avatarColors = ["#FF6130", "#9CF0FF", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

  function Avatar({ src, name, i, size = "w-10 h-10" }: { src?: string; name: string; i: number; size?: string }) {
    return src ? (
      <img src={src} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
      <div className={`${size} rounded-full flex items-center justify-center text-xs font-black text-white`} style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
        {name[0].toUpperCase()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(8, 18, 24, 0.94)" }} />
      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20">

          {/* 1. TRIBE SPACE IDENTITY */}
          <div className="px-6 md:px-10 lg:px-16 pt-8 pb-6">
            <div className="max-w-7xl mx-auto">
              <Link href={backPath} className="text-xs mb-6 flex items-center gap-1.5 font-headline text-[#9CF0FF]/50 hover:text-white">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Back
              </Link>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-headline text-white tracking-tight leading-none mb-4">{space.title}</h1>
              {space.description && <p className="text-base text-[#9CF0FF]/70 max-w-2xl mb-5">{space.description}</p>}

              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Avatar src={owner?.avatar_url ?? undefined} name={owner?.display_name ?? "?"} i={0} size="w-8 h-8" />
                  <div>
                    <p className="text-xs text-[#9CF0FF]/50">Owner</p>
                    <p className="text-sm font-bold font-headline text-white">{owner?.display_name}</p>
                  </div>
                </div>
                <div className="h-6 w-px" style={{ backgroundColor: "#1a3340" }} />
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {allMemberProfiles.slice(0, 5).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-6 h-6" />)}
                  </div>
                  <p className="text-sm font-bold font-headline text-white">{totalMemberCount} <span className="text-[#9CF0FF]/50 font-normal text-xs">member{totalMemberCount !== 1 ? "s" : ""}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. ACTIVE CHALLENGE */}
          {challenge && (
            <div className="px-6 md:px-10 lg:px-16 py-8" style={{ background: isActive ? "linear-gradient(135deg, rgba(255, 97, 48, 0.12) 0%, rgba(8, 18, 24, 1) 60%)" : "#0a1218", borderTop: isActive ? "2px solid #FF6130" : "1px solid #1a3340", borderBottom: "1px solid #1a3340" }}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  {isActive && <span className="w-3 h-3 rounded-full bg-[#FF6130] animate-pulse" />}
                  <span className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130]">{isActive ? "Active Challenge" : "Challenge"}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2">
                    <h2 className="text-3xl font-black font-headline text-white tracking-tight mb-2">{challenge.title}</h2>
                    {challenge.description && <p className="text-sm text-[#9CF0FF]/60 mb-4 max-w-xl">{challenge.description}</p>}

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      {challenge.start_date && challenge.end_date && (
                        <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#0d2a36", border: "1px solid #1a3340" }}>
                          <span className="text-xs font-bold font-headline text-[#9CF0FF]">{fmtDate(challenge.start_date)} — {fmtDate(challenge.end_date)}</span>
                        </div>
                      )}
                      {challenge.price_cents > 0 && (
                        <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#1f1005", border: "1px solid #FF6130" }}>
                          <span className="text-xs font-bold font-headline text-[#FF6130]">CHF {(challenge.price_cents / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#0d2a36", border: "1px solid #1a3340" }}>
                        <span className="text-xs font-bold font-headline text-[#9CF0FF]">{totalSessions} session{totalSessions !== 1 ? "s" : ""} · {totalMinutes} min</span>
                      </div>
                    </div>

                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-2">Host{cohosts.length > 0 ? "s" : ""}</p>
                    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      <Link href={owner?.username ? `/creators/${owner.username}` : "#"} className="shrink-0 flex items-center gap-3 p-3 rounded-xl group" style={{ backgroundColor: "#0d1f28", border: "2px solid #FF6130", minWidth: "220px", boxShadow: "0 0 15px rgba(255, 97, 48, 0.2)" }}>
                        {owner?.avatar_url ? <img src={owner.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #FF6130" }} /> : <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#662008", border: "2px solid #FF6130" }}><span className="text-lg font-black font-headline text-white">{(owner?.display_name ?? "?")[0].toUpperCase()}</span></div>}
                        <div className="min-w-0">
                          <p className="text-sm font-black font-headline text-white truncate group-hover:text-[#FF6130]">{owner?.display_name}</p>
                          <p className="text-[10px] text-[#FF6130] font-bold font-headline">Lead Host</p>
                        </div>
                      </Link>
                      {cohosts.map((ch, i) => (
                        <div key={ch.id} className="shrink-0 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340", minWidth: "200px" }}>
                          <Avatar src={ch.avatar} name={ch.name} i={i + 1} size="w-10 h-10" />
                          <div className="min-w-0"><p className="text-sm font-bold font-headline text-white truncate">{ch.name}</p><p className="text-[10px] text-[#9CF0FF]/60">Co-Host · {ch.splitPct}%</p></div>
                        </div>
                      ))}
                      {cohosts.length === 0 && !isOwner && <div className="shrink-0 p-3 rounded-xl flex items-center" style={{ backgroundColor: "#0a1218", border: "1px dashed #1a3340", minWidth: "180px" }}><p className="text-xs text-[#9CF0FF]/30">Collaboration slots</p></div>}
                    </div>
                  </div>

                  {totalSessions > 0 && (
                    <div className="p-5 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}>
                      <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-4">Progress</p>
                      <div className="flex items-center gap-5 mb-4">
                        <div className="relative w-20 h-20 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                            <path d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" fill="none" stroke="#1a3340" strokeWidth="4" />
                            <path d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831" fill="none" stroke="#FF6130" strokeWidth="4" strokeDasharray={`${progressPct}, 100`} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 8px rgba(255, 97, 48, 0.7))" }} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-black font-headline text-white">{progressPct}%</span></div>
                        </div>
                        <div>
                          <p className="text-3xl font-black font-headline text-white leading-none">{completedSessions}<span className="text-white/30 text-lg">/{totalSessions}</span></p>
                          <p className="text-xs text-[#9CF0FF]/60 mt-1">sessions</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: "#0d2a36", border: "1px solid #9CF0FF33" }}><p className="text-lg font-black font-headline text-[#9CF0FF]">{completedMinutes}</p><p className="text-[9px] text-[#9CF0FF]/50 font-bold font-headline">MIN DONE</p></div>
                        <div className="p-2.5 rounded-lg" style={{ backgroundColor: "#1f1005", border: "1px solid #FF613033" }}><p className="text-lg font-black font-headline text-[#FF6130]">{totalMinutes - completedMinutes}</p><p className="text-[9px] text-[#FF6130]/50 font-bold font-headline">MIN LEFT</p></div>
                      </div>
                      {activeMemberCount > 0 && (
                        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #1a3340" }}>
                          <p className="text-[10px] font-bold font-headline text-[#9CF0FF]/50 mb-2">{activeMemberCount} active</p>
                          <div className="flex -space-x-1.5">{activeMemberProfiles.slice(0, 8).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-7 h-7" />)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {hotSession && (
                  <div className="mt-6 flex items-center justify-between p-5 rounded-xl" style={{ background: tribeState === "live" ? "linear-gradient(90deg, #991b1b, #450a0a)" : "linear-gradient(90deg, #662008, #3d1206)", border: `2px solid ${tribeState === "live" ? "#ef4444" : "#FF6130"}`, boxShadow: `0 0 30px ${tribeState === "live" ? "rgba(239,68,68,0.3)" : "rgba(255,97,48,0.25)"}` }}>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl md:text-5xl font-black font-headline leading-none" style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130", textShadow: `0 0 20px ${tribeState === "live" ? "rgba(239,68,68,0.5)" : "rgba(255,97,48,0.4)"}` }}>{tribeState === "live" ? "LIVE" : fmtCountdown(hotSession.start_time)}</span>
                      <div><p className="text-lg font-black font-headline text-white">{hotSession.title}</p><p className="text-xs text-white/50">{new Date(hotSession.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {hotSession.duration_minutes} min</p></div>
                    </div>
                    {tribeState === "live" && <Link href={`/sessions/${hotSession.id}/live`} className="px-8 py-3 rounded-full text-white text-sm font-black font-headline inline-flex items-center gap-2" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 25px rgba(239,68,68,0.5)" }}><span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> JOIN NOW</Link>}
                  </div>
                )}

                {allSessions.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-3">Sessions</p>
                    <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
                      {allSessions.map((sess: any, idx: number) => {
                        const isLive = !!sess.live_room_id && sess.status !== "ended"; const isEnded = sess.status === "ended"; const isHot = hotSession?.id === sess.id; const sd = new Date(sess.start_time);
                        return (
                          <div key={sess.id} className="shrink-0 w-56 rounded-xl overflow-hidden" style={{ boxShadow: isHot ? `0 0 20px ${isLive ? "rgba(239,68,68,0.3)" : "rgba(255,97,48,0.25)"}` : "0 2px 8px rgba(0,0,0,0.3)" }}>
                            <div className="h-1.5" style={{ backgroundColor: isLive ? "#ef4444" : isEnded ? "#9CF0FF" : isHot ? "#FF6130" : "#1a3340" }} />
                            <div className="p-4" style={{ backgroundColor: isLive ? "#7f1d1d" : isEnded ? "#0d3040" : isHot ? "#662008" : "#0d1f28" }}>
                              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-black text-white/30">#{idx + 1}</span><span className={`text-[10px] font-bold font-headline uppercase ${isLive ? "animate-pulse" : ""}`} style={{ color: isLive ? "#ef4444" : isEnded ? "#9CF0FF" : isHot ? "#FF6130" : "#9CF0FF50" }}>{isLive ? "● LIVE" : isEnded ? "✓" : isHot ? fmtCountdown(sess.start_time) : sd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>
                              <p className="text-sm font-black font-headline text-white mb-2 line-clamp-2 leading-tight">{sess.title}</p>
                              <p className="text-[10px] text-white/40">{sd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {sess.duration_minutes}m · {sd.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                              {isLive && <Link href={`/sessions/${sess.id}/live`} className="mt-3 block text-center py-2 rounded-full text-xs font-black text-white" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 12px rgba(239,68,68,0.5)" }}>JOIN</Link>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tribeState === "new" && <div className="mt-6 p-8 rounded-xl text-center" style={{ background: "linear-gradient(135deg, #1f1005, #0a1218)", border: "2px solid #FF6130" }}><p className="text-2xl font-black font-headline text-white mb-2">{isOwner ? "Your stage is set" : "Something is about to begin"}</p><p className="text-sm text-[#9CF0FF]/60">{isOwner ? "Add sessions to bring this space alive." : "Sessions will drop here soon."}</p></div>}
              </div>
            </div>
          )}

          {/* 3. TRIBE FEED + SIDEBAR */}
          <div className="px-6 md:px-10 lg:px-16 py-10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6"><div className="w-3 h-3 rounded-full bg-[#FF6130]" /><h2 className="text-base font-bold font-headline uppercase tracking-wider text-white">Tribe Feed</h2></div>
                <PostFeed spaceId={spaceId} communityType="challenge" currentUserId={user.id} canPost={canPost} />
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF] mb-3">Tribe Leaderboard</p>
                  {allMemberProfiles.length > 0 ? (
                    <div className="space-y-2">{allMemberProfiles.slice(0, 5).map((m, i) => <div key={m.id} className="flex items-center gap-3"><span className="text-sm font-black font-headline text-white/30 w-5">{i + 1}</span><Avatar src={m.avatar} name={m.name} i={i} size="w-7 h-7" /><span className="text-sm font-bold font-headline text-white truncate flex-1">{m.name}</span></div>)}</div>
                  ) : <p className="text-xs text-[#9CF0FF]/30">Members will appear here</p>}
                </div>

                <div className="p-5 rounded-xl" style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/60 mb-3">All Members · {totalMemberCount}</p>
                  {totalMemberCount > 0 ? (
                    <div className="flex flex-wrap gap-2">{allMemberProfiles.map((m, i) => <div key={m.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg" style={{ backgroundColor: "#0a1218" }}><Avatar src={m.avatar} name={m.name} i={i} size="w-5 h-5" /><span className="text-[11px] text-white font-headline">{m.name}</span></div>)}</div>
                  ) : <p className="text-xs text-[#9CF0FF]/30">{isOwner ? "Share your challenge" : "Be the first"}</p>}
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: "#0a1218", border: "1px dashed #1a3340" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130]/50 mb-1">Collaborators</p>
                  <p className="text-xs text-[#9CF0FF]/30">Co-host and split revenue — coming soon</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
