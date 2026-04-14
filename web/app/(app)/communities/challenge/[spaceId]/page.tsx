import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PostFeed } from "@/app/components/community/PostFeed";
import { TribeCoverEditor } from "./TribeCoverEditor";

export const metadata = { title: "Tribe — INFITRA" };

export default async function ChallengeTribePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: space } = await supabase.from("app_challenge_space").select("id, title, description, owner_id, source_challenge_id, cover_image_url").eq("id", spaceId).single();
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

  const { data: owner } = await supabase.from("app_profile").select("id, display_name, avatar_url, cover_image_url, tagline, bio, username").eq("id", space.owner_id).single();

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
    const { data: links } = await supabase.from("app_challenge_session").select("session_id, app_session(id, title, description, start_time, duration_minutes, status, live_room_id, image_url)").eq("challenge_id", space.source_challenge_id);
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
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(8, 18, 24, 0.92)" }} />
      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20">

          {/* Back to tribe */}
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <Link href="/dashboard" className="text-xs font-bold font-headline text-[#9CF0FF]/60 hover:text-[#9CF0FF]">
              ← Back to {owner?.display_name ?? "Creator"}&apos;s Tribe
            </Link>
          </div>

          {/* 1. TRIBE SPACE IDENTITY */}
          <div className="relative overflow-hidden">
            {/* Tribe cover image */}
            {space.cover_image_url && (
              <div className="absolute inset-0">
                <img src={space.cover_image_url} alt="" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(8,18,24,1) 85%)" }} />
              </div>
            )}

            {/* Owner-only: edit cover */}
            {isOwner && (
              <TribeCoverEditor spaceId={spaceId} currentCoverUrl={space.cover_image_url ?? null} tribeName={space.title} />
            )}

            <div className="relative px-6 md:px-10 lg:px-16 pt-10 pb-10">
              <div className="max-w-7xl mx-auto">
                <Link href={backPath} className="text-xs mb-8 flex items-center gap-1.5 font-headline text-[#9CF0FF]/50 hover:text-white">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Back
                </Link>

                {/* INFITRA logo mark — subtle, positioned */}
                <div className="absolute top-10 right-16 opacity-[0.025] pointer-events-none hidden lg:block">
                  <img src="/logo-mark.png" alt="" width={200} height={200} />
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black font-headline text-white tracking-tight leading-none mb-5">{space.title}</h1>
                {space.description && <p className="text-lg text-[#9CF0FF]/70 max-w-2xl mb-6 leading-relaxed">{space.description}</p>}

                <div className="flex items-center gap-5">
                  <Link href={owner?.username ? `/creators/${owner.username}` : "#"} className="flex items-center gap-3 group">
                    {owner?.avatar_url ? (
                      <img src={owner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid #FF6130" }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF6130" }}>
                        <span className="text-sm font-black text-white">{(owner?.display_name ?? "?")[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-black font-headline text-white group-hover:text-[#FF6130]">{owner?.display_name}</p>
                      {owner?.tagline && <p className="text-xs text-[#9CF0FF]/50">{owner.tagline}</p>}
                    </div>
                  </Link>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {allMemberProfiles.slice(0, 5).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-7 h-7" />)}
                    </div>
                    <p className="text-sm font-bold font-headline text-white">{totalMemberCount} <span className="text-white/50 font-normal text-xs">member{totalMemberCount !== 1 ? "s" : ""}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand gradient line */}
            <div className="h-px" style={{ background: "linear-gradient(90deg, #9CF0FF44, #FF613066, #9CF0FF44)" }} />
          </div>

          {/* 2. ACTIVE CHALLENGE — one unified block */}
          {challenge && (
            <div className="px-6 md:px-10 lg:px-16 py-8">
              <div
                className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative"
                style={{
                  backgroundColor: "#0d1f28",
                  border: isActive ? "1px solid #1a3340" : "1px solid #1a3340",
                  boxShadow: isActive ? "0 4px 30px rgba(0,0,0,0.4)" : "none",
                }}
              >
                {/* Brand watermark in challenge card */}
                <div className="absolute bottom-4 right-6 opacity-[0.03] pointer-events-none">
                  <img src="/logo-mark.png" alt="" width={180} height={180} />
                </div>
                {/* ── Top: Progress bar + badge ──────────────── */}
                <div className="px-8 pt-6 pb-5" style={{ borderBottom: "1px solid #1a334066" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isActive && <span className="w-3 h-3 rounded-full bg-[#FF6130] animate-pulse" />}
                      <span className="text-xs font-bold font-headline uppercase tracking-wider text-[#FF6130]">{isActive ? "Active Challenge" : "Challenge"}</span>
                    </div>
                    {totalSessions > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black font-headline text-white">{completedSessions}/{totalSessions}</span>
                        <span className="text-xs text-[#9CF0FF]/50">sessions</span>
                        <span className="text-sm font-black font-headline text-[#FF6130]">{progressPct}%</span>
                      </div>
                    )}
                  </div>
                  {/* Full-width progress bar */}
                  {totalSessions > 0 && (
                    <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#0a1218" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(progressPct, 2)}%`, background: "linear-gradient(90deg, #FF6130, #ff8c5a)", boxShadow: "0 0 20px rgba(255, 97, 48, 0.6), 0 0 40px rgba(255, 97, 48, 0.2)" }} />
                    </div>
                  )}
                </div>

                {/* ── Middle: Challenge info + hot session ──── */}
                <div className="px-8 py-6" style={{ borderBottom: "1px solid #1a334066" }}>
                  <h2 className="text-3xl md:text-4xl font-black font-headline text-white tracking-tight mb-3">{challenge.title}</h2>
                  {challenge.description && <p className="text-base text-[#9CF0FF]/70 mb-5 max-w-2xl leading-relaxed">{challenge.description}</p>}

                  {/* Meta blocks — visible, not invisible */}
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    {challenge.start_date && challenge.end_date && (
                      <div className="px-3.5 py-2 rounded-lg" style={{ backgroundColor: "#0a1218", border: "1px solid #9CF0FF33" }}>
                        <span className="text-sm font-bold font-headline text-[#9CF0FF]">{fmtDate(challenge.start_date)} — {fmtDate(challenge.end_date)}</span>
                      </div>
                    )}
                    <div className="px-3.5 py-2 rounded-lg" style={{ backgroundColor: "#0a1218", border: "1px solid #9CF0FF33" }}>
                      <span className="text-sm font-bold font-headline text-white">{totalSessions} session{totalSessions !== 1 ? "s" : ""} to complete</span>
                      <span className="text-sm text-[#9CF0FF]/50 mx-1">·</span>
                      <span className="text-sm font-bold font-headline text-white">{totalMinutes} min</span>
                    </div>
                    {challenge.price_cents > 0 && (
                      <div className="px-3.5 py-2 rounded-lg" style={{ backgroundColor: "#1f1005", border: "1px solid #FF613066" }}>
                        <span className="text-sm font-black font-headline text-[#FF6130]">CHF {(challenge.price_cents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="px-3.5 py-2 rounded-lg" style={{ backgroundColor: "#0a1218" }}>
                      <span className="text-sm font-bold text-[#9CF0FF]/70">{completedMinutes} done</span>
                      <span className="text-sm text-[#9CF0FF]/30 mx-1">·</span>
                      <span className="text-sm font-bold text-[#FF6130]/70">{totalMinutes - completedMinutes} left</span>
                    </div>
                    {activeMemberCount > 0 && (
                      <>
                        <span className="text-[#9CF0FF]/20">·</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1">{activeMemberProfiles.slice(0, 4).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-5 h-5" />)}</div>
                          <span className="text-xs font-bold text-white">{activeMemberCount} active</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Hot session inline */}
                  {hotSession && (
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: tribeState === "live" ? "linear-gradient(90deg, #991b1b, #450a0a)" : "linear-gradient(90deg, #662008, #3d1206)", border: `1px solid ${tribeState === "live" ? "#ef4444" : "#FF6130"}` }}>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl md:text-4xl font-black font-headline leading-none" style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130", textShadow: `0 0 15px ${tribeState === "live" ? "rgba(239,68,68,0.5)" : "rgba(255,97,48,0.4)"}` }}>{tribeState === "live" ? "LIVE" : fmtCountdown(hotSession.start_time)}</span>
                        <div><p className="text-base font-black font-headline text-white">{hotSession.title}</p><p className="text-xs text-white/50">{new Date(hotSession.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {hotSession.duration_minutes} min</p></div>
                      </div>
                      {tribeState === "live" && <Link href={`/sessions/${hotSession.id}/live`} className="px-6 py-2.5 rounded-full text-white text-sm font-black font-headline inline-flex items-center gap-2" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 20px rgba(239,68,68,0.5)" }}><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> JOIN</Link>}
                    </div>
                  )}

                  {tribeState === "new" && (
                    <div className="p-6 rounded-xl text-center" style={{ border: "1px dashed #FF6130" }}>
                      <p className="text-xl font-black font-headline text-white mb-1">{isOwner ? "Your stage is set" : "Coming soon"}</p>
                      <p className="text-sm text-[#9CF0FF]/50">{isOwner ? "Add sessions to bring this alive." : "Sessions will appear here."}</p>
                    </div>
                  )}
                </div>

                {/* ── Hosts row ─────────────────────────────── */}
                <div className="px-8 py-5" style={{ borderBottom: "1px solid #1a334066" }}>
                  <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#FF6130] mb-3">Host{cohosts.length > 0 ? "s & Co-Hosts" : ""}</p>
                  <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <Link href={owner?.username ? `/creators/${owner.username}` : "#"} className="shrink-0 flex items-center gap-3 p-3 rounded-xl group" style={{ backgroundColor: "#0a1218", border: "2px solid #FF6130", minWidth: "220px" }}>
                      {owner?.avatar_url ? <img src={owner.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" style={{ border: "2px solid #FF6130" }} /> : <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "#662008", border: "2px solid #FF6130" }}><span className="text-base font-black font-headline text-white">{(owner?.display_name ?? "?")[0].toUpperCase()}</span></div>}
                      <div className="min-w-0"><p className="text-sm font-black font-headline text-white truncate group-hover:text-[#FF6130]">{owner?.display_name}</p><p className="text-[10px] text-[#FF6130] font-bold font-headline">Lead Host</p></div>
                    </Link>
                    {cohosts.map((ch, i) => (
                      <div key={ch.id} className="shrink-0 flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#0a1218", border: "1px solid #1a3340", minWidth: "200px" }}>
                        <Avatar src={ch.avatar} name={ch.name} i={i + 1} size="w-10 h-10" />
                        <div className="min-w-0"><p className="text-sm font-bold font-headline text-white truncate">{ch.name}</p><p className="text-[10px] text-[#9CF0FF]/60">Co-Host · {ch.splitPct}%</p></div>
                      </div>
                    ))}
                    {cohosts.length === 0 && <div className="shrink-0 p-3 rounded-xl flex items-center" style={{ backgroundColor: "#0a1218", border: "1px dashed #1a3340", minWidth: "160px" }}><p className="text-xs text-[#9CF0FF]/30">+ Collaborators</p></div>}
                  </div>
                </div>

                {/* ── Sessions scroll ───────────────────────── */}
                {allSessions.length > 0 && (
                  <div className="px-8 py-5">
                    <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/50 mb-3">Sessions</p>
                    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {allSessions.map((sess: any, idx: number) => {
                        const isLive = !!sess.live_room_id && sess.status !== "ended"; const isEnded = sess.status === "ended"; const isHot = hotSession?.id === sess.id; const sd = new Date(sess.start_time);
                        return (
                          <div key={sess.id} className="shrink-0 w-56 rounded-xl overflow-hidden" style={{ boxShadow: isHot ? `0 0 15px ${isLive ? "rgba(239,68,68,0.3)" : "rgba(255,97,48,0.2)"}` : "0 2px 8px rgba(0,0,0,0.3)" }}>
                            {/* Session image or branded default */}
                            {sess.image_url ? (
                              <div className="h-28 relative">
                                <img src={sess.image_url} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
                                <div className="absolute bottom-2 left-3 right-3">
                                  <p className="text-sm font-black font-headline text-white line-clamp-1">{sess.title}</p>
                                </div>
                                <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
                                  <span className="text-[10px] font-black text-white/50">#{idx + 1}</span>
                                  <span className={`text-[10px] font-bold font-headline uppercase ${isLive ? "animate-pulse" : ""}`} style={{ color: isLive ? "#ef4444" : isEnded ? "#9CF0FF" : isHot ? "#FF6130" : "white" }}>
                                    {isLive ? "● LIVE" : isEnded ? "✓" : isHot ? fmtCountdown(sess.start_time) : sd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-1.5" style={{ backgroundColor: isLive ? "#ef4444" : isEnded ? "#9CF0FF" : isHot ? "#FF6130" : "#1a3340" }} />
                            )}
                            <div className="p-3.5" style={{ backgroundColor: isLive ? "#7f1d1d" : isEnded ? "#0d3040" : isHot ? "#662008" : "#0a1218" }}>
                              {!sess.image_url && (
                                <>
                                  <div className="flex items-center justify-between mb-1.5"><span className="text-[10px] font-black text-white/30">#{idx + 1}</span><span className={`text-[10px] font-bold font-headline uppercase ${isLive ? "animate-pulse" : ""}`} style={{ color: isLive ? "#ef4444" : isEnded ? "#9CF0FF" : isHot ? "#FF6130" : "#9CF0FF50" }}>{isLive ? "● LIVE" : isEnded ? "✓" : isHot ? fmtCountdown(sess.start_time) : sd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></div>
                                  <p className="text-sm font-black font-headline text-white mb-1.5 line-clamp-1">{sess.title}</p>
                                </>
                              )}
                              <p className="text-[10px] text-white/50">{sd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {sess.duration_minutes}m · {sd.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</p>
                              {isLive && <Link href={`/sessions/${sess.id}/live`} className="mt-2 block text-center py-1.5 rounded-full text-[10px] font-black text-white" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 10px rgba(239,68,68,0.5)" }}>JOIN</Link>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand gradient divider */}
          <div className="h-[2px] mx-6 md:mx-10 lg:mx-16" style={{ background: "linear-gradient(90deg, #9CF0FF33, #FF613066, #9CF0FF33)" }} />

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
