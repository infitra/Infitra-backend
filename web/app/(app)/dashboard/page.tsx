import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createDraftChallenge } from "@/app/actions/challenge";
import { ScheduleView } from "./ScheduleView";

export const metadata = {
  title: "Dashboard — INFITRA",
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

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
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
    .select("display_name, role, created_at")
    .eq("id", user!.id)
    .single();

  const { data: summary } = await supabase
    .from("vw_my_creator_summary")
    .select("*")
    .single();

  const totalAttendees = summary?.total_attendees ?? 0;
  const earningsCHF = ((summary?.creator_cut_cents ?? 0) / 100).toFixed(2);

  const { count: publishedSessionCount } = await supabase
    .from("app_session")
    .select("id", { count: "exact", head: true })
    .eq("host_id", user!.id)
    .neq("status", "draft");

  const { count: challengeCount } = await supabase
    .from("app_challenge")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user!.id)
    .neq("status", "draft");

  // ── Next Up: upcoming sessions (standalone + challenge-linked) ──
  const { data: upcomingSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .in("status", ["published"])
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  // Get challenge names for linked sessions
  const sessionIds = (upcomingSessions ?? []).map((s: any) => s.id);
  let challengeMap: Record<string, string> = {};
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

  // ── All sessions this month for schedule ──
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  const { data: monthSessions } = await supabase
    .from("app_session")
    .select("id, title, start_time, duration_minutes, status, live_room_id")
    .eq("host_id", user!.id)
    .neq("status", "draft")
    .gte("start_time", monthStart.toISOString())
    .lt("start_time", monthEnd.toISOString())
    .order("start_time", { ascending: true });

  // Get challenge names for month sessions too
  const monthIds = (monthSessions ?? []).map((s: any) => s.id);
  if (monthIds.length > 0) {
    const { data: monthLinks } = await supabase
      .from("app_challenge_session")
      .select("session_id, app_challenge(title)")
      .in("session_id", monthIds);
    for (const link of monthLinks ?? []) {
      const ch = (link as any).app_challenge;
      if (ch?.title && !(link as any).session_id in challengeMap) {
        challengeMap[(link as any).session_id] = ch.title;
      }
    }
  }

  const now = new Date();
  const hasUpcoming = upcomingSessions && upcomingSessions.length > 0;

  return (
    <div className="py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
          Welcome, {profile?.display_name}.
        </h1>
      </div>

      {/* ── Stats row (compact) ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Sessions", value: String(publishedSessionCount ?? 0) },
          { label: "Challenges", value: String(challengeCount ?? 0) },
          { label: "Attendees", value: String(totalAttendees) },
          { label: "Earnings", value: `CHF ${earningsCHF}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-4 py-3 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 flex items-center justify-between"
          >
            <span className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
              {label}
            </span>
            <span className="text-lg font-black text-white font-headline">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Next Up ──────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white font-headline tracking-tight">
            Next Up
          </h2>
          <Link
            href="/dashboard/sessions"
            className="text-xs font-bold text-[#9CF0FF]/40 hover:text-[#9CF0FF] font-headline transition-colors"
          >
            All Sessions &rarr;
          </Link>
        </div>

        {!hasUpcoming ? (
          <div className="p-6 rounded-2xl bg-[#0F2229] border border-dashed border-[#9CF0FF]/10 text-center">
            <p className="text-sm text-[#9CF0FF]/30 mb-3">
              No upcoming sessions scheduled.
            </p>
            <Link
              href="/dashboard/sessions/new"
              className="text-xs font-bold text-[#FF6130] font-headline"
            >
              Create your first session &rarr;
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
                <div
                  key={sess.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 group"
                >
                  {/* Live indicator */}
                  <div className="shrink-0">
                    {hasRoom ? (
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse block" />
                    ) : canGoLive ? (
                      <span className="w-3 h-3 rounded-full bg-[#FF6130] block" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-[#9CF0FF]/20 block" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/sessions/${sess.id}`}
                        className="text-sm font-bold text-white font-headline truncate hover:text-[#FF6130] transition-colors"
                      >
                        {sess.title}
                      </Link>
                      {challengeName && (
                        <span className="shrink-0 text-[9px] font-bold text-[#FF6130]/50 bg-[#FF6130]/8 px-2 py-0.5 rounded-full font-headline truncate max-w-[140px]">
                          {challengeName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9CF0FF]/40 mt-0.5">
                      {formatRelativeTime(sess.start_time)} &middot;{" "}
                      {sess.duration_minutes} min
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {hasRoom ? (
                      <Link
                        href={`/dashboard/sessions/${sess.id}/live`}
                        className="px-4 py-2 rounded-full bg-[#FF6130] text-white text-xs font-bold font-headline hover:scale-[1.03] transition-transform inline-flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Enter
                      </Link>
                    ) : canGoLive ? (
                      <Link
                        href={`/dashboard/sessions/${sess.id}`}
                        className="px-4 py-2 rounded-full bg-[#FF6130] text-white text-xs font-bold font-headline hover:scale-[1.03] transition-transform"
                      >
                        Go Live
                      </Link>
                    ) : (
                      <span className="text-[10px] text-[#9CF0FF]/30 font-headline">
                        {formatRelativeTime(sess.start_time)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Schedule ─────────────────────────────────────── */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-white font-headline tracking-tight mb-4">
          Schedule
        </h2>
        <ScheduleView
          sessions={(monthSessions ?? []).map((s: any) => ({
            id: s.id,
            title: s.title,
            start_time: s.start_time,
            duration_minutes: s.duration_minutes,
            status: s.status,
            live_room_id: s.live_room_id,
            challengeName: challengeMap[s.id] ?? null,
          }))}
        />
      </div>

      {/* ── Quick actions (compact) ──────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/sessions/new"
          className="px-5 py-2.5 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(255,97,48,0.25)]"
        >
          + Session
        </Link>
        <form action={createDraftChallenge}>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-[#0F2229] border border-[#FF6130]/25 text-sm font-black text-[#FF6130] font-headline hover:scale-[1.03] transition-transform"
          >
            + Challenge
          </button>
        </form>
      </div>
    </div>
  );
}
