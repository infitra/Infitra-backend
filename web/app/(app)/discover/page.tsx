import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Home — INFITRA",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  if (diffD === 1) return `Tomorrow ${formatTime(dateStr)}`;
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len).trimEnd() + "..." : str;
}

export default async function DiscoverPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const now = new Date();

  // ── My Creator Communities ─────────────────────────────
  const { data: myMemberships } = await supabase
    .from("app_creator_space_member")
    .select("space_id, app_creator_space(id, title, description, creator_id)")
    .eq("user_id", user.id);

  const creatorSpaces = (myMemberships ?? [])
    .map((m: any) => m.app_creator_space)
    .filter(Boolean);

  const creatorIds = creatorSpaces.map((s: any) => s.creator_id);
  const creatorNameMap: Record<string, string> = {};
  const creatorMemberCounts: Record<string, number> = {};
  const creatorLatestPost: Record<string, string> = {};
  const creatorNextSession: Record<string, any> = {};

  if (creatorSpaces.length > 0) {
    const spaceIds = creatorSpaces.map((s: any) => s.id);

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("app_profile")
        .select("id, display_name")
        .in("id", creatorIds);
      for (const p of profiles ?? []) creatorNameMap[p.id] = p.display_name ?? "Creator";
    }

    const { data: members } = await supabase
      .from("app_creator_space_member")
      .select("space_id")
      .in("space_id", spaceIds);
    for (const m of members ?? []) {
      creatorMemberCounts[m.space_id] = (creatorMemberCounts[m.space_id] ?? 0) + 1;
    }

    for (const sp of creatorSpaces) {
      const { data: posts } = await supabase
        .from("app_creator_post")
        .select("body")
        .eq("space_id", sp.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (posts?.[0]?.body) creatorLatestPost[sp.id] = posts[0].body;
    }

    for (const sp of creatorSpaces) {
      const { data: sess } = await supabase
        .from("app_session")
        .select("id, title, start_time")
        .eq("host_id", sp.creator_id)
        .eq("status", "published")
        .gte("start_time", now.toISOString())
        .order("start_time", { ascending: true })
        .limit(1);
      if (sess?.[0]) creatorNextSession[sp.id] = sess[0];
    }
  }

  // ── My Challenge Tribes ────────────────────────────────
  const { data: myChallengeMemberships } = await supabase
    .from("app_challenge_member")
    .select("challenge_id")
    .eq("user_id", user.id);

  const purchasedChallengeIds = (myChallengeMemberships ?? [])
    .map((m: any) => m.challenge_id)
    .filter(Boolean);

  let challengeSpaces: any[] = [];
  const tribeMemberCounts: Record<string, number> = {};
  const tribeLatestPost: Record<string, string> = {};
  const tribeNextSession: Record<string, any> = {};
  const tribeChallengeTitle: Record<string, string> = {};

  if (purchasedChallengeIds.length > 0) {
    const { data: spaces } = await supabase
      .from("app_challenge_space")
      .select("id, title, description, source_challenge_id, owner_id")
      .in("source_challenge_id", purchasedChallengeIds);
    challengeSpaces = spaces ?? [];

    if (challengeSpaces.length > 0) {
      const chalIds = challengeSpaces.map((s: any) => s.source_challenge_id).filter(Boolean);
      if (chalIds.length > 0) {
        const { data: members } = await supabase
          .from("app_challenge_member")
          .select("challenge_id")
          .in("challenge_id", chalIds);
        const chalToSpace: Record<string, string> = {};
        for (const cs of challengeSpaces) {
          if (cs.source_challenge_id) chalToSpace[cs.source_challenge_id] = cs.id;
        }
        for (const m of members ?? []) {
          const sid = chalToSpace[m.challenge_id];
          if (sid) tribeMemberCounts[sid] = (tribeMemberCounts[sid] ?? 0) + 1;
        }
      }

      for (const sp of challengeSpaces) {
        const { data: posts } = await supabase
          .from("app_challenge_post")
          .select("body")
          .eq("space_id", sp.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (posts?.[0]?.body) tribeLatestPost[sp.id] = posts[0].body;
      }

      const { data: challenges } = await supabase
        .from("app_challenge")
        .select("id, title")
        .in("id", purchasedChallengeIds);
      for (const c of challenges ?? []) tribeChallengeTitle[c.id] = c.title;

      for (const sp of challengeSpaces) {
        const { data: links } = await supabase
          .from("app_challenge_session")
          .select("session_id, app_session(id, title, start_time, status)")
          .eq("challenge_id", sp.source_challenge_id);
        const upcoming = (links ?? [])
          .map((l: any) => l.app_session)
          .filter((s: any) => s && new Date(s.start_time) >= now && s.status !== "ended")
          .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        if (upcoming[0]) tribeNextSession[sp.id] = upcoming[0];
      }
    }
  }

  // ── My Upcoming Sessions ───────
  const { data: myAttendance } = await supabase
    .from("app_attendance")
    .select("session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id, host_id, app_profile!app_session_host_id_fkey(display_name))")
    .eq("user_id", user.id);

  const mySessions = (myAttendance ?? [])
    .map((a: any) => a.app_session)
    .filter((s: any) => s && new Date(s.start_time) >= now && s.status !== "ended" && s.host_id !== user.id)
    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // ── Discover: public content ───────────────────────────
  const { data: allSessions } = await supabase
    .from("app_session")
    .select("id, title, description, start_time, duration_minutes, capacity, price_cents, currency, host_id, app_profile!app_session_host_id_fkey(display_name, username)")
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true });

  const allMySessionIds = new Set(mySessions.map((s: any) => s.id));
  const discoverSessionIds = (allSessions ?? []).map((s: any) => s.id);
  let challengeLinkedIds = new Set<string>();
  if (discoverSessionIds.length > 0) {
    const { data: linked } = await supabase
      .from("app_challenge_session")
      .select("session_id")
      .in("session_id", discoverSessionIds);
    challengeLinkedIds = new Set((linked ?? []).map((r: any) => r.session_id));
  }
  const sessions = (allSessions ?? []).filter(
    (s: any) => !challengeLinkedIds.has(s.id) && !allMySessionIds.has(s.id)
  );

  const { data: allChallenges } = await supabase
    .from("app_challenge")
    .select("id, title, description, start_date, end_date, price_cents, capacity, owner_id, app_profile!app_challenge_owner_id_fkey(display_name, username)")
    .eq("status", "published")
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  const purchasedChallengeIdSet = new Set(purchasedChallengeIds);
  const discoverChallenges = (allChallenges ?? []).filter((c: any) => !purchasedChallengeIdSet.has(c.id));

  const hasCommunities = creatorSpaces.length > 0;
  const hasTribes = challengeSpaces.length > 0;
  const hasMySessions = mySessions.length > 0;
  const hasDiscoverSessions = sessions.length > 0;
  const hasDiscoverChallenges = discoverChallenges.length > 0;
  const hasDiscover = hasDiscoverSessions || hasDiscoverChallenges;

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-5xl mx-auto py-10">

          {/* ── My Communities ─────────────────────────────── */}
          {hasCommunities && (
            <div className="mb-10">
              <h2
                className="text-lg font-black font-headline tracking-tight mb-4"
                style={{ color: "#0F2229" }}
              >
                My Communities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorSpaces.map((sp: any) => {
                  const creatorName = creatorNameMap[sp.creator_id] ?? "Creator";
                  const latest = creatorLatestPost[sp.id];
                  const nextSess = creatorNextSession[sp.id];
                  const count = creatorMemberCounts[sp.id] ?? 0;

                  return (
                    <Link
                      key={sp.id}
                      href={`/communities/creator/${sp.id}`}
                      className="group block rounded-2xl infitra-card-link"
                    >
                                            <div className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-100/80 border border-cyan-200 flex items-center justify-center shrink-0">
                            <span className="text-sm font-black text-cyan-700 font-headline">
                              {creatorName[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm font-bold font-headline truncate text-[#0F2229] group-hover:text-[#FF6130]"
                            >
                              {creatorName}
                            </p>
                            <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                              {count} member{count !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        {latest && (
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: "#64748b" }}>
                            {truncate(latest, 120)}
                          </p>
                        )}
                        {nextSess && (
                          <div
                            className="flex items-center gap-2 pt-3 border-t"
                            style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6130] shrink-0" />
                            <span className="text-[10px] truncate" style={{ color: "#64748b" }}>
                              {nextSess.title} &middot;{" "}
                              {formatRelativeTime(nextSess.start_time)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── My Tribes ──────────────────────────────────── */}
          {hasTribes && (
            <div className="mb-10">
              <h2
                className="text-lg font-black font-headline tracking-tight mb-4"
                style={{ color: "#0F2229" }}
              >
                My Tribes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challengeSpaces.map((sp: any) => {
                  const chalTitle = tribeChallengeTitle[sp.source_challenge_id] ?? sp.title;
                  const latest = tribeLatestPost[sp.id];
                  const nextSess = tribeNextSession[sp.id];
                  const count = tribeMemberCounts[sp.id] ?? 0;

                  return (
                    <Link
                      key={sp.id}
                      href={`/communities/challenge/${sp.id}`}
                      className="group block rounded-2xl infitra-card-link"
                    >
                                            <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[9px] font-bold text-orange-700 bg-orange-100/80 border border-orange-200 px-2 py-0.5 rounded-full font-headline">
                            TRIBE
                          </span>
                          <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                            {count} member{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <h3
                          className="text-sm font-bold font-headline truncate mb-2 text-[#0F2229] group-hover:text-[#FF6130]"
                        >
                          {chalTitle}
                        </h3>
                        {latest && (
                          <p className="text-xs mb-3 line-clamp-2" style={{ color: "#64748b" }}>
                            {truncate(latest, 120)}
                          </p>
                        )}
                        {nextSess && (
                          <div
                            className="flex items-center gap-2 pt-3 border-t"
                            style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6130] shrink-0" />
                            <span className="text-[10px] truncate" style={{ color: "#64748b" }}>
                              {nextSess.title} &middot;{" "}
                              {formatRelativeTime(nextSess.start_time)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── My Upcoming Sessions ───────────────────────── */}
          {hasMySessions && (
            <div className="mb-10">
              <h2
                className="text-lg font-black font-headline tracking-tight mb-4"
                style={{ color: "#0F2229" }}
              >
                Upcoming Sessions
              </h2>
              <div className="space-y-2">
                {mySessions.slice(0, 5).map((sess: any) => {
                  const host = sess.app_profile;
                  const startTime = new Date(sess.start_time);
                  const joinOpensAt = new Date(startTime.getTime() - 5 * 60 * 1000);
                  const canJoin = !!sess.live_room_id && now >= joinOpensAt;

                  return (
                    <div
                      key={sess.id}
                      className="flex items-center gap-3 p-3 rounded-xl infitra-glass"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          sess.live_room_id ? "bg-red-500 animate-pulse" : ""
                        }`}
                        style={
                          !sess.live_room_id
                            ? { backgroundColor: "rgba(15, 34, 41, 0.20)" }
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold font-headline truncate"
                          style={{ color: "#0F2229" }}
                        >
                          {sess.title}
                        </p>
                        <p className="text-[10px]" style={{ color: "#64748b" }}>
                          {formatRelativeTime(sess.start_time)} &middot;{" "}
                          {sess.duration_minutes} min
                          {host?.display_name && <> &middot; {host.display_name}</>}
                        </p>
                      </div>
                      {canJoin ? (
                        <Link
                          href={`/sessions/${sess.id}/live`}
                          className="px-3 py-1.5 rounded-full bg-[#FF6130] text-white text-[10px] font-bold font-headline shrink-0 inline-flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Join
                        </Link>
                      ) : (
                        <Link
                          href={`/sessions/${sess.id}`}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold font-headline shrink-0"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.78)",
                            border: "1px solid rgba(15, 34, 41, 0.15)",
                            color: "#475569",
                          }}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Discover ───────────────────────────────────── */}
          <div id="discover">
            <h2
              className="text-lg font-black font-headline tracking-tight mb-1"
              style={{ color: "#0F2229" }}
            >
              Discover
            </h2>
            <p className="text-xs mb-5" style={{ color: "#64748b" }}>
              New sessions and challenges from creators on INFITRA.
            </p>

            {!hasDiscover ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  Nothing new right now. Check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {hasDiscoverChallenges && (
                  <div>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider font-headline mb-3"
                      style={{ color: "rgba(15, 34, 41, 0.55)" }}
                    >
                      Challenges
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {discoverChallenges.map((challenge: any) => {
                        const owner = challenge.app_profile;
                        const priceCHF = (challenge.price_cents ?? 0) / 100;
                        return (
                          <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="group block rounded-2xl infitra-card-link"
                          >
                                                        <div className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[9px] font-bold text-orange-700 bg-orange-100/80 border border-orange-200 px-2 py-0.5 rounded-full font-headline">CHALLENGE</span>
                                <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                                  {formatDate(challenge.start_date + "T00:00:00")} — {formatDate(challenge.end_date + "T00:00:00")}
                                </span>
                              </div>
                              <h3
                                className="text-base font-black font-headline tracking-tight mb-2 line-clamp-2 text-[#0F2229] group-hover:text-[#FF6130]"
                              >
                                {challenge.title}
                              </h3>
                              {challenge.description && (
                                <p className="text-xs line-clamp-2 mb-4" style={{ color: "#64748b" }}>{challenge.description}</p>
                              )}
                              <div
                                className="flex items-center justify-between pt-3 border-t"
                                style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}
                              >
                                <span className="text-xs font-headline" style={{ color: "#64748b" }}>{owner?.display_name ?? "Creator"}</span>
                                <span className="text-sm font-black font-headline" style={{ color: "#0F2229" }}>CHF {priceCHF.toFixed(2)}</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasDiscoverSessions && (
                  <div>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider font-headline mb-3"
                      style={{ color: "rgba(15, 34, 41, 0.55)" }}
                    >
                      Sessions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessions.map((session: any) => {
                        const host = session.app_profile;
                        const priceCHF = (session.price_cents ?? 0) / 100;
                        return (
                          <Link
                            key={session.id}
                            href={`/sessions/${session.id}`}
                            className="group block rounded-2xl infitra-card-link"
                          >
                                                        <div className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className="text-[10px] font-bold uppercase tracking-widest font-headline"
                                  style={{ color: "rgba(15, 34, 41, 0.55)" }}
                                >
                                  {formatDate(session.start_time)} &middot; {formatTime(session.start_time)}
                                </span>
                                <span className="text-[10px]" style={{ color: "#94a3b8" }}>{session.duration_minutes} min</span>
                              </div>
                              <h3
                                className="text-base font-black font-headline tracking-tight mb-2 line-clamp-2 text-[#0F2229] group-hover:text-[#FF6130]"
                              >
                                {session.title}
                              </h3>
                              {session.description && (
                                <p className="text-xs line-clamp-2 mb-4" style={{ color: "#64748b" }}>{session.description}</p>
                              )}
                              <div
                                className="flex items-center justify-between pt-3 border-t"
                                style={{ borderColor: "rgba(15, 34, 41, 0.08)" }}
                              >
                                <span className="text-xs font-headline" style={{ color: "#64748b" }}>{host?.display_name ?? "Creator"}</span>
                                <span className="text-sm font-black font-headline" style={{ color: "#0F2229" }}>
                                  {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
