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
  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/";
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

  const avatarColors = ["#FF6130", "#0891b2", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

  function Avatar({ src, name, i, size = "w-10 h-10" }: { src?: string; name: string; i: number; size?: string }) {
    return src ? (
      <img src={src} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
      <div className={`${size} rounded-full flex items-center justify-center text-xs font-headline text-white`} style={{ backgroundColor: avatarColors[i % avatarColors.length], fontWeight: 700 }}>
        {name[0].toUpperCase()}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

      <div className="flex-1 pt-20">

        {/* Back to dashboard / discover */}
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <Link href={backPath} className="text-xs font-headline transition-colors hover:text-[#0F2229]" style={{ color: "#475569", fontWeight: 700 }}>
            ← Back to {owner?.display_name ?? "Creator"}&apos;s tribe
          </Link>
        </div>

        {/* 1. TRIBE SPACE IDENTITY */}
        <div className="relative overflow-hidden">
          {/* Tribe cover image — sits in a contained frame inside the
              max-width column so it doesn't wash the whole page in cream
              + image. Fades into the cream surface at the bottom. */}
          {space.cover_image_url && (
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
              <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "5 / 1", border: "1px solid rgba(15,34,41,0.08)" }}>
                <img src={space.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,34,41,0.45) 0%, rgba(15,34,41,0) 60%)" }} />
              </div>
            </div>
          )}

          {/* Owner-only: edit cover */}
          {isOwner && (
            <TribeCoverEditor spaceId={spaceId} currentCoverUrl={space.cover_image_url ?? null} tribeName={space.title} />
          )}

          <div className="relative px-6 md:px-10 lg:px-16 pt-8 pb-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline tracking-tight leading-tight mb-4" style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}>
                {space.title}
              </h1>
              {space.description && (
                <p className="text-base md:text-lg max-w-2xl mb-6 leading-relaxed" style={{ color: "#475569", fontWeight: 500 }}>
                  {space.description}
                </p>
              )}

              <div className="flex items-center gap-5 flex-wrap">
                <div className="flex items-center gap-3">
                  {owner?.avatar_url ? (
                    <img src={owner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid #FF6130" }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FF6130" }}>
                      <span className="text-sm font-headline text-white" style={{ fontWeight: 700 }}>{(owner?.display_name ?? "?")[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>{owner?.display_name}</p>
                    {owner?.tagline && <p className="text-xs" style={{ color: "#64748b" }}>{owner.tagline}</p>}
                  </div>
                </div>
                <div className="h-6 w-px" style={{ backgroundColor: "rgba(15,34,41,0.10)" }} />
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {allMemberProfiles.slice(0, 5).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-7 h-7" />)}
                  </div>
                  <p className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>
                    {totalMemberCount} <span className="font-normal text-xs" style={{ color: "#64748b" }}>member{totalMemberCount !== 1 ? "s" : ""}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ACTIVE CHALLENGE — one unified block on cream-on-cream */}
        {challenge && (
          <div className="px-6 md:px-10 lg:px-16 pb-10">
            <div
              className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative"
              style={{
                backgroundColor: "rgba(255,255,255,0.65)",
                border: "1px solid rgba(15,34,41,0.08)",
                boxShadow: isActive ? "0 4px 30px rgba(15,34,41,0.06)" : "none",
              }}
            >
              {/* Top: stage label + progress */}
              <div className="px-8 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isActive && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#FF6130" }} />}
                    <span className="text-[11px] uppercase tracking-widest font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>
                      {isActive ? "Active challenge" : "Challenge"}
                    </span>
                  </div>
                  {totalSessions > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>{completedSessions}/{totalSessions}</span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>sessions</span>
                      <span className="text-sm font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>{progressPct}%</span>
                    </div>
                  )}
                </div>
                {totalSessions > 0 && (
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(15,34,41,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(progressPct, 2)}%`, background: "linear-gradient(90deg, #FF6130, #ff8c5a)" }} />
                  </div>
                )}
              </div>

              {/* Middle: title, description, meta blocks, hot session */}
              <div className="px-8 py-6" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
                <h2 className="text-2xl md:text-3xl font-headline tracking-tight mb-3" style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {challenge.title}
                </h2>
                {challenge.description && (
                  <p className="text-base mb-5 max-w-2xl leading-relaxed" style={{ color: "#475569" }}>
                    {challenge.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {challenge.start_date && challenge.end_date && (
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(8,145,178,0.06)", border: "1px solid rgba(8,145,178,0.18)" }}>
                      <span className="text-sm font-headline" style={{ color: "#0891b2", fontWeight: 700 }}>{fmtDate(challenge.start_date)} — {fmtDate(challenge.end_date)}</span>
                    </div>
                  )}
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)", border: "1px solid rgba(15,34,41,0.08)" }}>
                    <span className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>{totalSessions} session{totalSessions !== 1 ? "s" : ""}</span>
                    <span className="text-sm mx-1" style={{ color: "#94a3b8" }}>·</span>
                    <span className="text-sm font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>{totalMinutes} min</span>
                  </div>
                  {challenge.price_cents > 0 && (
                    <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(255,97,48,0.06)", border: "1px solid rgba(255,97,48,0.20)" }}>
                      <span className="text-sm font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>CHF {(challenge.price_cents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
                    <span className="text-sm" style={{ color: "#475569", fontWeight: 600 }}>{completedMinutes} done</span>
                    <span className="text-sm mx-1" style={{ color: "#94a3b8" }}>·</span>
                    <span className="text-sm" style={{ color: "#FF6130", fontWeight: 600 }}>{totalMinutes - completedMinutes} left</span>
                  </div>
                  {activeMemberCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">{activeMemberProfiles.slice(0, 4).map((m, i) => <Avatar key={m.id} src={m.avatar} name={m.name} i={i} size="w-5 h-5" />)}</div>
                      <span className="text-xs font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>{activeMemberCount} active</span>
                    </div>
                  )}
                </div>

                {/* Hot session callout */}
                {hotSession && (
                  <div
                    className="flex items-center justify-between p-4 rounded-2xl flex-wrap gap-3"
                    style={
                      tribeState === "live"
                        ? { backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.30)" }
                        : { backgroundColor: "rgba(255,97,48,0.05)", border: "1px solid rgba(255,97,48,0.25)" }
                    }
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span
                        className="text-2xl md:text-3xl font-headline leading-none tracking-tight"
                        style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130", fontWeight: 700, letterSpacing: "-0.01em" }}
                      >
                        {tribeState === "live" ? "LIVE" : fmtCountdown(hotSession.start_time)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-headline truncate" style={{ color: "#0F2229", fontWeight: 700 }}>{hotSession.title}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>
                          {new Date(hotSession.start_time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {hotSession.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    {tribeState === "live" && (
                      <Link
                        href={`/sessions/${hotSession.id}/live`}
                        className="px-5 py-2.5 rounded-full text-white text-sm font-headline inline-flex items-center gap-2 shrink-0"
                        style={{ backgroundColor: "#ef4444", fontWeight: 700, boxShadow: "0 2px 8px rgba(239,68,68,0.30)" }}
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Join
                      </Link>
                    )}
                  </div>
                )}

                {tribeState === "new" && (
                  <div className="p-6 rounded-2xl text-center" style={{ border: "1px dashed rgba(255,97,48,0.40)", backgroundColor: "rgba(255,97,48,0.03)" }}>
                    <p className="text-lg font-headline mb-1" style={{ color: "#0F2229", fontWeight: 700 }}>{isOwner ? "Your stage is set" : "Coming soon"}</p>
                    <p className="text-sm" style={{ color: "#64748b" }}>{isOwner ? "Add sessions to bring this alive." : "Sessions will appear here."}</p>
                  </div>
                )}
              </div>

              {/* Hosts row */}
              <div className="px-8 py-5" style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#FF6130", fontWeight: 700 }}>
                  Host{cohosts.length > 0 ? "s & co-hosts" : ""}
                </p>
                <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  <div className="shrink-0 flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1.5px solid rgba(255,97,48,0.30)", minWidth: "220px" }}>
                    {owner?.avatar_url ? (
                      <img src={owner.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" style={{ border: "2px solid #FF6130" }} />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,97,48,0.18)", border: "2px solid #FF6130" }}>
                        <span className="text-base font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>{(owner?.display_name ?? "?")[0].toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-headline truncate" style={{ color: "#0F2229", fontWeight: 700 }}>{owner?.display_name}</p>
                      <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>Lead host</p>
                    </div>
                  </div>
                  {cohosts.map((ch, i) => (
                    <div key={ch.id} className="shrink-0 flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(8,145,178,0.04)", border: "1px solid rgba(8,145,178,0.20)", minWidth: "200px" }}>
                      <Avatar src={ch.avatar} name={ch.name} i={i + 1} size="w-10 h-10" />
                      <div className="min-w-0">
                        <p className="text-sm font-headline truncate" style={{ color: "#0F2229", fontWeight: 700 }}>{ch.name}</p>
                        <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: "#0891b2", fontWeight: 700 }}>Co-host · {ch.splitPct}%</p>
                      </div>
                    </div>
                  ))}
                  {cohosts.length === 0 && (
                    <div className="shrink-0 p-3 rounded-2xl flex items-center" style={{ backgroundColor: "transparent", border: "1px dashed rgba(15,34,41,0.15)", minWidth: "160px" }}>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>+ Collaborators</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions scroll */}
              {allSessions.length > 0 && (
                <div className="px-8 py-5">
                  <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#475569", fontWeight: 700 }}>Sessions</p>
                  <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                    {allSessions.map((sess: any, idx: number) => {
                      const isLive = !!sess.live_room_id && sess.status !== "ended";
                      const isEnded = sess.status === "ended";
                      const isHot = hotSession?.id === sess.id;
                      const sd = new Date(sess.start_time);
                      const accentColor = isLive ? "#ef4444" : isEnded ? "#94a3b8" : isHot ? "#FF6130" : "#0891b2";
                      return (
                        <div
                          key={sess.id}
                          className="shrink-0 w-56 rounded-2xl overflow-hidden"
                          style={{
                            backgroundColor: "#F8F6F0",
                            border: `1px solid ${isHot ? "rgba(255,97,48,0.30)" : "rgba(15,34,41,0.06)"}`,
                          }}
                        >
                          {sess.image_url ? (
                            <div className="h-28 relative">
                              <img src={sess.image_url} alt="" className={`w-full h-full object-cover ${isEnded ? "grayscale opacity-70" : ""}`} />
                              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(15,34,41,0.55) 100%)" }} />
                              <div className="absolute bottom-2 left-3 right-3">
                                <p className="text-sm font-headline text-white line-clamp-1" style={{ fontWeight: 700 }}>{sess.title}</p>
                              </div>
                              <div className="absolute top-2 left-3 right-3 flex items-center justify-between">
                                <span className="text-[10px] font-headline text-white/70" style={{ fontWeight: 700 }}>#{idx + 1}</span>
                                <span
                                  className={`text-[10px] uppercase tracking-widest font-headline ${isLive ? "animate-pulse" : ""}`}
                                  style={{ color: isEnded ? "#9CF0FF" : "#FFFFFF", fontWeight: 700 }}
                                >
                                  {isLive ? "● Live" : isEnded ? "✓ Done" : isHot ? fmtCountdown(sess.start_time) : sd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-1.5" style={{ backgroundColor: accentColor }} />
                          )}
                          <div className="p-3.5">
                            {!sess.image_url && (
                              <>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>#{idx + 1}</span>
                                  <span
                                    className={`text-[10px] uppercase tracking-widest font-headline ${isLive ? "animate-pulse" : ""}`}
                                    style={{ color: accentColor, fontWeight: 700 }}
                                  >
                                    {isLive ? "● Live" : isEnded ? "✓ Done" : isHot ? fmtCountdown(sess.start_time) : sd.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                                <p className="text-sm font-headline mb-1.5 line-clamp-1" style={{ color: "#0F2229", fontWeight: 700 }}>{sess.title}</p>
                              </>
                            )}
                            <p className="text-[10px]" style={{ color: "#64748b" }}>
                              {sd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {sess.duration_minutes}m · {sd.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                            </p>
                            {isLive && (
                              <Link
                                href={`/sessions/${sess.id}/live`}
                                className="mt-2 block text-center py-1.5 rounded-full text-[10px] text-white font-headline"
                                style={{ backgroundColor: "#ef4444", fontWeight: 700, boxShadow: "0 2px 8px rgba(239,68,68,0.30)" }}
                              >
                                Join
                              </Link>
                            )}
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

        {/* 3. TRIBE FEED + SIDEBAR */}
        <div className="px-6 md:px-10 lg:px-16 pb-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF6130" }} />
                <h2 className="text-[11px] uppercase tracking-widest font-headline" style={{ color: "#475569", fontWeight: 700 }}>Tribe feed</h2>
              </div>
              <PostFeed spaceId={spaceId} communityType="challenge" currentUserId={user.id} canPost={canPost} />
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,34,41,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#0891b2", fontWeight: 700 }}>Tribe leaderboard</p>
                {allMemberProfiles.length > 0 ? (
                  <div className="space-y-2">
                    {allMemberProfiles.slice(0, 5).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="text-sm font-headline w-5" style={{ color: "#94a3b8", fontWeight: 700 }}>{i + 1}</span>
                        <Avatar src={m.avatar} name={m.name} i={i} size="w-7 h-7" />
                        <span className="text-sm font-headline truncate flex-1" style={{ color: "#0F2229", fontWeight: 700 }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs" style={{ color: "#94a3b8" }}>Members will appear here</p>}
              </div>

              <div className="p-5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,34,41,0.06)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline mb-3" style={{ color: "#475569", fontWeight: 700 }}>All members · {totalMemberCount}</p>
                {totalMemberCount > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allMemberProfiles.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg" style={{ backgroundColor: "rgba(15,34,41,0.04)" }}>
                        <Avatar src={m.avatar} name={m.name} i={i} size="w-5 h-5" />
                        <span className="text-[11px] font-headline" style={{ color: "#0F2229", fontWeight: 600 }}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs" style={{ color: "#94a3b8" }}>{isOwner ? "Share your challenge" : "Be the first"}</p>}
              </div>

              <div className="p-4 rounded-2xl" style={{ backgroundColor: "transparent", border: "1px dashed rgba(15,34,41,0.15)" }}>
                <p className="text-[10px] uppercase tracking-widest font-headline mb-1" style={{ color: "#FF6130", fontWeight: 700, opacity: 0.6 }}>Collaborators</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>Co-host and split revenue — coming soon</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
