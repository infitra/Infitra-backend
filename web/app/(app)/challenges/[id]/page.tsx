import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PurchaseButton } from "@/app/components/PurchaseButton";

export const metadata = {
  title: "Challenge — INFITRA",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSessionDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSessionTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
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
  if (diffD === 1) {
    return `Tomorrow ${new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // Fetch published challenge
  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!challenge) notFound();

  // Fetch owner profile
  const { data: owner } = await supabase
    .from("app_profile")
    .select("id, display_name, username, bio, avatar_url")
    .eq("id", challenge.owner_id)
    .single();

  // Fetch linked sessions (all published with the challenge)
  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id)"
    )
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  // Check if user already has a membership (already purchased)
  const { data: membership } = await supabase
    .from("app_challenge_member")
    .select("id")
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const hasPurchased = !!membership;
  const priceCHF = (challenge.price_cents ?? 0) / 100;
  const isOwner = user.id === challenge.owner_id;

  const now = new Date();
  const nextSession = linkedSessions.find(
    (s: any) => new Date(s.start_time) >= now && s.status !== "ended"
  );

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          {/* Back link */}
          <Link
            href="/discover"
            className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-8 flex items-center gap-1.5 font-headline"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Discover
          </Link>

          {/* Challenge card */}
          <div className="rounded-2xl infitra-glass overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />

            <div className="p-8 md:p-10">
              {/* Badge */}
              <span className="text-[10px] font-bold text-[#FF6130]/60 bg-[#FF6130]/10 px-2.5 py-1 rounded-full font-headline mb-4 inline-block">
                CHALLENGE
              </span>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-4">
                {challenge.title}
              </h1>

              {/* Description */}
              {challenge.description && (
                <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8 max-w-xl whitespace-pre-line">
                  {challenge.description}
                </p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Starts
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatDate(challenge.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Ends
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatDate(challenge.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Sessions
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {linkedSessions.length}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    {hasPurchased ? "Status" : "Price"}
                  </p>
                  {hasPurchased ? (
                    <p className="text-sm font-semibold text-green-400">
                      Enrolled
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-white">
                      CHF {priceCHF.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Next session countdown (enrolled only) */}
              {hasPurchased && nextSession && (
                <div className="mb-8 p-4 rounded-xl bg-[#FF6130]/5 border border-[#FF6130]/15">
                  <p className="text-[10px] font-bold text-[#FF6130]/50 uppercase tracking-widest font-headline mb-1">
                    Next Session
                  </p>
                  <p className="text-sm font-bold text-white font-headline">
                    {nextSession.title}
                  </p>
                  <p className="text-xs text-[#9CF0FF]/40 mt-0.5">
                    {formatRelativeTime(nextSession.start_time)} &middot;{" "}
                    {formatDuration(nextSession.duration_minutes)}
                  </p>
                </div>
              )}

              {/* Session timeline */}
              {linkedSessions.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-3">
                    {hasPurchased ? "Your Sessions" : "Included Sessions"}
                  </p>
                  <div className="space-y-2">
                    {linkedSessions.map((sess: any) => {
                      const sessStart = new Date(sess.start_time);
                      const isPast = sessStart < now;
                      const isEnded = sess.status === "ended";
                      const joinOpensAt = new Date(sessStart.getTime() - 5 * 60 * 1000);
                      const canJoin = hasPurchased && !!sess.live_room_id && now >= joinOpensAt;

                      return hasPurchased ? (
                        <div
                          key={sess.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isEnded
                              ? "bg-[#071318]/30 border-[#9CF0FF]/5 opacity-50"
                              : "bg-[#071318]/50 border-[#9CF0FF]/8"
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              sess.live_room_id
                                ? "bg-red-500 animate-pulse"
                                : isEnded
                                  ? "bg-[#9CF0FF]/10"
                                  : "bg-[#9CF0FF]/25"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white font-headline truncate">
                              {sess.title}
                            </p>
                            <p className="text-[10px] text-[#9CF0FF]/40">
                              {formatSessionDate(sess.start_time)} at{" "}
                              {formatSessionTime(sess.start_time)} &middot;{" "}
                              {formatDuration(sess.duration_minutes)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {canJoin ? (
                              <Link
                                href={`/sessions/${sess.id}/live`}
                                className="px-3 py-1.5 rounded-full bg-[#FF6130] text-white text-[10px] font-bold font-headline hover:scale-[1.03] transition-transform inline-flex items-center gap-1"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Join
                              </Link>
                            ) : isEnded ? (
                              <span className="text-[10px] text-[#9CF0FF]/25 font-headline">
                                Ended
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#9CF0FF]/30 font-headline">
                                {formatRelativeTime(sess.start_time)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={sess.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[#071318]/50 border border-[#9CF0FF]/8"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#FF6130]/10 border border-[#FF6130]/20 flex items-center justify-center shrink-0">
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="#FF6130"
                              strokeWidth={1.5}
                              viewBox="0 0 24 24"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white font-headline truncate">
                              {sess.title}
                            </p>
                            <p className="text-[10px] text-[#9CF0FF]/40">
                              {formatSessionDate(sess.start_time)} at{" "}
                              {formatSessionTime(sess.start_time)} &middot;{" "}
                              {formatDuration(sess.duration_minutes)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Creator */}
              <Link
                href={owner?.username ? `/creators/${owner.username}` : "#"}
                className="flex items-center gap-3 pt-6 border-t border-[#9CF0FF]/8 mb-8 group/host"
              >
                <div className="w-10 h-10 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/30 flex items-center justify-center">
                  <span className="text-sm font-black text-[#FF6130] font-headline">
                    {(owner?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white font-headline group-hover/host:text-[#FF6130] transition-colors">
                    {owner?.display_name}
                  </p>
                  {owner?.bio && (
                    <p className="text-[10px] text-[#9CF0FF]/30 line-clamp-1 max-w-xs">
                      {owner.bio}
                    </p>
                  )}
                </div>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-[#9CF0FF]/15 group-hover/host:text-[#FF6130] transition-colors shrink-0">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* CTA */}
              {isOwner ? (
                <Link
                  href={`/dashboard/challenges/${challenge.id}`}
                  className="inline-block px-6 py-3.5 rounded-full bg-[#9CF0FF]/10 border border-[#9CF0FF]/20 text-sm font-bold text-[#9CF0FF] font-headline hover:bg-[#9CF0FF]/15 transition-colors"
                >
                  View in Dashboard
                </Link>
              ) : hasPurchased ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-400/8 border border-green-400/20 w-fit">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm font-bold text-green-400 font-headline">
                    Enrolled &mdash; you have access to all sessions
                  </span>
                </div>
              ) : (
                <PurchaseButton
                  kind="challenge"
                  targetId={challenge.id}
                  label={`Join Challenge — CHF ${priceCHF.toFixed(2)}`}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
