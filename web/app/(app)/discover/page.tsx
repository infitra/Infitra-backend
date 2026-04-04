import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Discover — INFITRA",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  return formatDate(dateStr) + " " + formatTime(dateStr);
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

  // ── My purchased sessions (from app_attendance) ──────────
  const { data: myAttendance } = await supabase
    .from("app_attendance")
    .select(
      "session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id, host_id, app_profile!app_session_host_id_fkey(display_name))"
    )
    .eq("user_id", user.id);

  // Filter to upcoming sessions only
  const mySessionsRaw = (myAttendance ?? [])
    .map((a: any) => a.app_session)
    .filter(
      (s: any) =>
        s &&
        s.start_time &&
        new Date(s.start_time) >= now &&
        s.status !== "ended" &&
        s.host_id !== user.id // exclude sessions where user is host
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  // Get challenge names for purchased sessions
  const mySessionIds = mySessionsRaw.map((s: any) => s.id);
  let myChallengeMap: Record<string, string> = {};
  if (mySessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, app_challenge(title)")
      .in("session_id", mySessionIds);
    for (const link of links ?? []) {
      const ch = (link as any).app_challenge;
      if (ch?.title) myChallengeMap[(link as any).session_id] = ch.title;
    }
  }

  // ── My challenge memberships (sessions from purchased challenges) ──
  const { data: myMemberships } = await supabase
    .from("app_challenge_member")
    .select(
      "challenge_id, app_challenge(id, title, start_date, end_date, status)"
    )
    .eq("user_id", user.id);

  // Get sessions from purchased challenges that aren't already in mySessionsRaw
  const purchasedChallengeIds = (myMemberships ?? [])
    .map((m: any) => m.app_challenge?.id)
    .filter(Boolean);

  let challengeSessionsForMy: any[] = [];
  if (purchasedChallengeIds.length > 0) {
    const { data: challengeLinks } = await supabase
      .from("app_challenge_session")
      .select(
        "session_id, challenge_id, app_session(id, title, start_time, duration_minutes, status, live_room_id, host_id, app_profile!app_session_host_id_fkey(display_name)), app_challenge(title)"
      )
      .in("challenge_id", purchasedChallengeIds);

    for (const link of challengeLinks ?? []) {
      const s = (link as any).app_session;
      const ch = (link as any).app_challenge;
      if (
        s &&
        s.start_time &&
        new Date(s.start_time) >= now &&
        s.status !== "ended" &&
        s.host_id !== user.id &&
        !mySessionIds.includes(s.id)
      ) {
        challengeSessionsForMy.push(s);
        if (ch?.title) myChallengeMap[s.id] = ch.title;
      }
    }
  }

  // Combine and dedupe
  const allMySessionIds = new Set(mySessionIds);
  const mySessions = [...mySessionsRaw];
  for (const s of challengeSessionsForMy) {
    if (!allMySessionIds.has(s.id)) {
      allMySessionIds.add(s.id);
      mySessions.push(s);
    }
  }
  mySessions.sort(
    (a: any, b: any) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const hasMyContent = mySessions.length > 0;

  // ── Discover: public sessions ──────────────────────────
  const { data: allSessions } = await supabase
    .from("app_session")
    .select(
      "id, title, description, start_time, duration_minutes, capacity, price_cents, currency, host_id, app_profile!app_session_host_id_fkey(display_name, username)"
    )
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true });

  // Filter out challenge-linked sessions
  const discoverSessionIds = (allSessions ?? []).map((s: any) => s.id);
  let challengeLinkedIds = new Set<string>();
  if (discoverSessionIds.length > 0) {
    const { data: linked } = await supabase
      .from("app_challenge_session")
      .select("session_id")
      .in("session_id", discoverSessionIds);
    challengeLinkedIds = new Set(
      (linked ?? []).map((r: any) => r.session_id)
    );
  }
  const sessions = (allSessions ?? []).filter(
    (s: any) => !challengeLinkedIds.has(s.id) && !allMySessionIds.has(s.id)
  );

  // Discover: public challenges
  const { data: challenges } = await supabase
    .from("app_challenge")
    .select(
      "id, title, description, start_date, end_date, price_cents, capacity, owner_id, app_profile!app_challenge_owner_id_fkey(display_name, username)"
    )
    .eq("status", "published")
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  // Filter out purchased challenges from discover
  const purchasedChallengeIdSet = new Set(purchasedChallengeIds);
  const discoverChallenges = (challenges ?? []).filter(
    (c: any) => !purchasedChallengeIdSet.has(c.id)
  );

  const hasSessions = sessions.length > 0;
  const hasChallenges = discoverChallenges.length > 0;
  const hasDiscover = hasSessions || hasChallenges;

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-5xl mx-auto py-10">
          {/* ── My Sessions ─────────────────────────────── */}
          {hasMyContent && (
            <div className="mb-12" id="my-sessions">
              <h2 className="text-2xl font-black text-white font-headline tracking-tight mb-1">
                My Sessions
              </h2>
              <p className="text-sm text-[#9CF0FF]/40 mb-5">
                Your upcoming purchased sessions.
              </p>

              <div className="space-y-2">
                {mySessions.map((sess: any) => {
                  const host = sess.app_profile;
                  const startTime = new Date(sess.start_time);
                  const joinOpensAt = new Date(startTime.getTime() - 5 * 60 * 1000);
                  const canJoin = !!sess.live_room_id && now >= joinOpensAt;
                  const challengeName = myChallengeMap[sess.id];

                  return (
                    <div
                      key={sess.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10"
                    >
                      {/* Status dot */}
                      <span
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          sess.live_room_id
                            ? "bg-red-500 animate-pulse"
                            : "bg-[#9CF0FF]/20"
                        }`}
                      />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-headline truncate">
                            {sess.title}
                          </span>
                          {challengeName && (
                            <span className="shrink-0 text-[9px] font-bold text-[#FF6130]/50 bg-[#FF6130]/8 px-2 py-0.5 rounded-full font-headline truncate max-w-[140px]">
                              {challengeName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#9CF0FF]/40 mt-0.5">
                          {formatRelativeTime(sess.start_time)} &middot;{" "}
                          {sess.duration_minutes} min
                          {host?.display_name && (
                            <>
                              {" "}
                              &middot; {host.display_name}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        {canJoin ? (
                          <Link
                            href={`/sessions/${sess.id}/live`}
                            className="px-4 py-2 rounded-full bg-[#FF6130] text-white text-xs font-bold font-headline hover:scale-[1.03] transition-transform inline-flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Join
                          </Link>
                        ) : sess.live_room_id ? (
                          <span className="text-[10px] text-green-400 font-headline font-bold">
                            Opening soon
                          </span>
                        ) : (
                          <Link
                            href={`/sessions/${sess.id}`}
                            className="px-4 py-2 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 text-xs font-bold text-[#9CF0FF]/50 font-headline hover:text-[#9CF0FF] transition-colors"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Discover ────────────────────────────────── */}
          <div>
            <h2 className="text-2xl font-black text-white font-headline tracking-tight mb-1">
              Discover
            </h2>
            <p className="text-sm text-[#9CF0FF]/40 mb-5">
              Upcoming sessions and challenges from creators on INFITRA.
            </p>

            {!hasDiscover ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 flex items-center justify-center mx-auto mb-6">
                  <svg
                    width="28"
                    height="28"
                    fill="none"
                    stroke="#9CF0FF"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-40"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white font-headline tracking-tight mb-2">
                  Nothing here yet
                </h3>
                <p className="text-sm text-[#9CF0FF]/40 max-w-xs mx-auto">
                  Creators are setting up. Check back soon for sessions and
                  challenges you can join.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Challenges */}
                {hasChallenges && (
                  <div>
                    <h3 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
                      Challenges
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {discoverChallenges.map((challenge: any) => {
                        const owner = challenge.app_profile;
                        const priceCHF =
                          (challenge.price_cents ?? 0) / 100;

                        return (
                          <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="group block rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#FF6130]/25 transition-all overflow-hidden"
                          >
                            <div className="h-0.5 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-bold text-[#FF6130]/60 bg-[#FF6130]/10 px-2 py-0.5 rounded-full font-headline">
                                  CHALLENGE
                                </span>
                                <span className="text-[10px] text-[#9CF0FF]/25">
                                  {formatDate(
                                    challenge.start_date + "T00:00:00"
                                  )}{" "}
                                  —{" "}
                                  {formatDate(
                                    challenge.end_date + "T00:00:00"
                                  )}
                                </span>
                              </div>
                              <h3 className="text-lg font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#FF6130] transition-colors line-clamp-2">
                                {challenge.title}
                              </h3>
                              {challenge.description && (
                                <p className="text-xs text-[#9CF0FF]/35 leading-relaxed mb-5 line-clamp-2">
                                  {challenge.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between pt-4 border-t border-[#9CF0FF]/8">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/25 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-[#FF6130] font-headline">
                                      {(
                                        owner?.display_name ?? "?"
                                      )[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-[#9CF0FF]/40 font-headline">
                                    {owner?.display_name ?? "Creator"}
                                  </span>
                                </div>
                                <span className="text-sm font-black text-white font-headline">
                                  CHF {priceCHF.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sessions */}
                {hasSessions && (
                  <div>
                    <h3 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
                      Sessions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sessions.map((session: any) => {
                        const host = session.app_profile;
                        const priceCHF =
                          (session.price_cents ?? 0) / 100;

                        return (
                          <Link
                            key={session.id}
                            href={`/sessions/${session.id}`}
                            className="group block rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-all overflow-hidden"
                          >
                            <div className="h-0.5 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
                                  {formatDate(session.start_time)}{" "}
                                  &middot;{" "}
                                  {formatTime(session.start_time)}
                                </span>
                                <span className="text-[10px] text-[#9CF0FF]/25">
                                  {session.duration_minutes} min
                                </span>
                              </div>
                              <h3 className="text-lg font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#FF6130] transition-colors line-clamp-2">
                                {session.title}
                              </h3>
                              {session.description && (
                                <p className="text-xs text-[#9CF0FF]/35 leading-relaxed mb-5 line-clamp-2">
                                  {session.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between pt-4 border-t border-[#9CF0FF]/8">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/25 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-[#FF6130] font-headline">
                                      {(
                                        host?.display_name ?? "?"
                                      )[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-xs text-[#9CF0FF]/40 font-headline">
                                    {host?.display_name ?? "Creator"}
                                  </span>
                                </div>
                                <span className="text-sm font-black text-white font-headline">
                                  {priceCHF > 0
                                    ? `CHF ${priceCHF.toFixed(2)}`
                                    : "Free"}
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
