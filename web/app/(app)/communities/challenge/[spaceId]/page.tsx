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

  const { count: memberCount } = await supabase
    .from("app_challenge_space_member")
    .select("user_id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  const { data: owner } = await supabase.from("app_profile").select("display_name").eq("id", space.owner_id).single();

  const { data: myProfile } = await supabase.from("app_profile").select("display_name, role").eq("id", user.id).single();

  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/discover";
  const isOwner = user.id === space.owner_id;

  // Sessions — sorted, categorized
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

  // Categorize sessions
  const liveSession = allSessions.find((s: any) => !!s.live_room_id && s.status !== "ended");
  const upcomingSessions = allSessions.filter((s: any) => !s.live_room_id && s.status !== "ended" && new Date(s.start_time) > now);
  const nextSession = upcomingSessions[0];
  const pastSessions = allSessions.filter((s: any) => s.status === "ended");
  const hotSession = liveSession ?? nextSession;

  // Time helpers
  function formatCountdown(dateStr: string) {
    const d = new Date(dateStr);
    const diffMs = d.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 0) return "Now";
    if (diffMin < 60) return `${diffMin} minutes`;
    if (diffH < 24) return `${diffH} hour${diffH !== 1 ? "s" : ""}`;
    if (diffD === 1) return "Tomorrow";
    return `${diffD} days`;
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
      " at " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  // Tribe state
  const tribeState = liveSession
    ? "live"
    : nextSession
      ? "upcoming"
      : allSessions.length > 0
        ? "between"
        : "new";

  const stateLabel = {
    live: "Live Now",
    upcoming: `Starts in ${hotSession ? formatCountdown(hotSession.start_time) : ""}`,
    between: "Between sessions",
    new: "Just created",
  }[tribeState];

  const stateColor = {
    live: "#ef4444",
    upcoming: "#FF6130",
    between: "#9CF0FF",
    new: "#FF6130",
  }[tribeState];

  const mCount = memberCount ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ backgroundColor: "rgba(15, 34, 41, 0.88)" }} />

      <div className="relative z-[2]">
        <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

        <div className="flex-1 pt-20 px-6">
          <div className="max-w-3xl mx-auto py-8">

            {/* Back */}
            <Link href={backPath} className="text-xs mb-8 flex items-center gap-1.5 font-headline text-[#9CF0FF]/40 hover:text-white">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </Link>

            {/* ══════════════════════════════════════════════════
                HEADER — "You just entered it"
                ══════════════════════════════════════════════════ */}
            <div className="mb-8">
              {/* State indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: stateColor,
                    animation: tribeState === "live" ? "pulse 2s ease-in-out infinite" : undefined,
                  }}
                />
                <span className="text-xs font-bold font-headline uppercase tracking-wider" style={{ color: stateColor }}>
                  {stateLabel}
                </span>
              </div>

              {/* Tribe name — BIG */}
              <h1 className="text-4xl md:text-5xl font-black font-headline text-white tracking-tight leading-none mb-4">
                {space.title}
              </h1>

              {/* Creator + members — small, ambient */}
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#9CF0FF]/50">
                  by <span className="text-white font-bold">{owner?.display_name}</span>
                </span>
                <span className="text-xs text-[#9CF0FF]/30">
                  {mCount} member{mCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                THE SESSION — "This is happening now"
                ══════════════════════════════════════════════════ */}
            {hotSession && (
              <div
                className="rounded-2xl overflow-hidden mb-6"
                style={{
                  backgroundColor: tribeState === "live" ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 97, 48, 0.06)",
                  border: `1px solid ${tribeState === "live" ? "rgba(239, 68, 68, 0.20)" : "rgba(255, 97, 48, 0.15)"}`,
                }}
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: tribeState === "live" ? "#ef4444" : "#FF6130" }}
                    />
                    <span className="text-xs font-bold font-headline uppercase tracking-wider" style={{ color: tribeState === "live" ? "#ef4444" : "#FF6130" }}>
                      {tribeState === "live" ? "Live Now" : `In ${formatCountdown(hotSession.start_time)}`}
                    </span>
                  </div>
                  <h2 className="text-xl font-black font-headline text-white tracking-tight mb-1">
                    {hotSession.title}
                  </h2>
                  <p className="text-xs text-[#9CF0FF]/40 mb-4">
                    {formatSessionTime(hotSession.start_time)} · {hotSession.duration_minutes} min
                  </p>
                  {tribeState === "live" ? (
                    <Link
                      href={`/sessions/${hotSession.id}/live`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-black font-headline"
                      style={{ backgroundColor: "#ef4444", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Join Now
                    </Link>
                  ) : (
                    <p className="text-xs font-bold font-headline text-[#FF6130]">
                      {tribeState === "upcoming" && new Date(hotSession.start_time).getTime() - now.getTime() < 5 * 60 * 1000
                        ? "Opening soon..."
                        : `Starts ${formatSessionTime(hotSession.start_time)}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Other upcoming sessions — secondary */}
            {upcomingSessions.length > 1 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/30 mb-2">Coming up</p>
                <div className="space-y-1.5">
                  {upcomingSessions.slice(1).map((sess: any) => (
                    <div key={sess.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF]/30 shrink-0" />
                      <span className="text-xs text-white font-bold font-headline truncate">{sess.title}</span>
                      <span className="text-[10px] text-[#9CF0FF]/30 shrink-0 ml-auto">{formatCountdown(sess.start_time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No sessions state */}
            {!hotSession && tribeState === "new" && (
              <div
                className="rounded-2xl p-8 mb-6 text-center"
                style={{ backgroundColor: "rgba(255,97,48,0.04)", border: "1px solid rgba(255,97,48,0.10)" }}
              >
                <p className="text-lg font-black font-headline text-white mb-2">
                  {isOwner ? "Ready to launch" : "Something is about to happen"}
                </p>
                <p className="text-sm text-[#9CF0FF]/50 max-w-sm mx-auto">
                  {isOwner
                    ? "Your tribe is set up. Add sessions to your challenge and they'll appear here."
                    : "This tribe is just getting started. Sessions and activity will appear here soon."
                  }
                </p>
              </div>
            )}

            {tribeState === "between" && !hotSession && (
              <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: "rgba(156,240,255,0.04)", border: "1px solid rgba(156,240,255,0.08)" }}>
                <p className="text-sm font-bold font-headline text-[#9CF0FF]/60 mb-1">Between sessions</p>
                <p className="text-xs text-[#9CF0FF]/30">
                  {pastSessions.length} session{pastSessions.length !== 1 ? "s" : ""} completed. Stay connected — share your progress below.
                </p>
              </div>
            )}

            {/* Past sessions — faded */}
            {pastSessions.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold font-headline uppercase tracking-wider text-[#9CF0FF]/20 mb-2">Completed</p>
                <div className="space-y-1">
                  {pastSessions.slice(0, 3).map((sess: any) => (
                    <div key={sess.id} className="flex items-center gap-3 py-1.5 px-3 opacity-40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF]/20 shrink-0" />
                      <span className="text-xs text-[#9CF0FF]/40 font-headline truncate">{sess.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                TRIBE ACTIVITY — "Things are happening here"
                ══════════════════════════════════════════════════ */}
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#FF6130]" />
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
