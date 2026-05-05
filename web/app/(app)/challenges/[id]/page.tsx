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
    return `Tomorrow ${new Date(dateStr).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
    .select("display_name, role")
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
      "session_id, app_session(id, title, description, image_url, start_time, duration_minutes, status, live_room_id)"
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
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-7xl mx-auto py-10">
          {/* Back link */}
          <Link
            href="/"
            className="text-xs transition-colors mb-8 flex items-center gap-1.5 font-headline"
            style={{ color: "#64748b" }}
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
            {/* Cover image or accent bar */}
            {challenge.image_url ? (
              <div className="aspect-[3/1] relative">
                <img src={challenge.image_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)" }} />
              </div>
            ) : (
              <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />
            )}

            <div className="p-8 md:p-10">
              {/* Badge */}
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full font-headline mb-4 inline-block"
                style={{
                  color: "#FF6130",
                  backgroundColor: "rgba(255, 97, 48, 0.10)",
                }}
              >
                CHALLENGE
              </span>

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-4"
                style={{ color: "#0F2229" }}
              >
                {challenge.title}
              </h1>

              {/* Description */}
              {challenge.description && (
                <p
                  className="text-sm leading-relaxed mb-8 max-w-xl whitespace-pre-line"
                  style={{ color: "#64748b" }}
                >
                  {challenge.description}
                </p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    Starts
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#0F2229" }}
                  >
                    {formatDate(challenge.start_date)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    Ends
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#0F2229" }}
                  >
                    {formatDate(challenge.end_date)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    Sessions
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#0F2229" }}
                  >
                    {linkedSessions.length}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    {hasPurchased ? "Status" : "Price"}
                  </p>
                  {hasPurchased ? (
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#047857" }}
                    >
                      Enrolled
                    </p>
                  ) : (
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#0F2229" }}
                    >
                      CHF {priceCHF.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Next session countdown (enrolled only) */}
              {hasPurchased && nextSession && (
                <div
                  className="mb-8 p-4 rounded-xl"
                  style={{
                    backgroundColor: "rgba(255, 97, 48, 0.08)",
                    border: "1px solid rgba(255, 97, 48, 0.20)",
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "#FF6130" }}
                  >
                    Next Session
                  </p>
                  <p
                    className="text-sm font-bold font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {nextSession.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#64748b" }}
                  >
                    {formatRelativeTime(nextSession.start_time)} &middot;{" "}
                    {formatDuration(nextSession.duration_minutes)}
                  </p>
                </div>
              )}

              {/* Session timeline */}
              {linkedSessions.length > 0 && (
                <div className="mb-8">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-3"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    {hasPurchased ? "Your Sessions" : "Included Sessions"}
                  </p>
                  <div className="space-y-2">
                    {linkedSessions.map((sess: any) => {
                      const sessStart = new Date(sess.start_time);
                      const isEnded = sess.status === "ended";
                      const joinOpensAt = new Date(
                        sessStart.getTime() - 5 * 60 * 1000
                      );
                      const canJoin =
                        hasPurchased &&
                        !!sess.live_room_id &&
                        now >= joinOpensAt;

                      return hasPurchased ? (
                        <div
                          key={sess.id}
                          className={`flex items-center gap-3 p-3 rounded-lg infitra-glass ${
                            isEnded ? "opacity-60" : ""
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              sess.live_room_id
                                ? "bg-rose-500 animate-pulse"
                                : isEnded
                                  ? "bg-slate-300"
                                  : "bg-cyan-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-bold font-headline truncate"
                              style={{ color: "#0F2229" }}
                            >
                              {sess.title}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{ color: "#64748b" }}
                            >
                              {formatSessionDate(sess.start_time)} at{" "}
                              {formatSessionTime(sess.start_time)} &middot;{" "}
                              {formatDuration(sess.duration_minutes)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {canJoin ? (
                              <Link
                                href={`/sessions/${sess.id}/live`}
                                className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold font-headline hover:scale-[1.03] transition-transform inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: "#FF6130",
                                  boxShadow:
                                    "0 4px 14px rgba(255,97,48,0.35)",
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Join
                              </Link>
                            ) : isEnded ? (
                              <span
                                className="text-[10px] font-headline"
                                style={{ color: "#94a3b8" }}
                              >
                                Ended
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-headline"
                                style={{ color: "#64748b" }}
                              >
                                {formatRelativeTime(sess.start_time)}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          key={sess.id}
                          className="flex items-center gap-3 p-3 rounded-lg infitra-glass"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: "rgba(255, 97, 48, 0.10)",
                              border: "1px solid rgba(255, 97, 48, 0.25)",
                            }}
                          >
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
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-bold font-headline truncate"
                              style={{ color: "#0F2229" }}
                            >
                              {sess.title}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{ color: "#64748b" }}
                            >
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

              {/* Creator — plain info (creator profile routes removed for pilot;
                  will be re-thought in Phase 4 participant-journey rewrite) */}
              <div
                className="flex items-center gap-3 pt-6 mb-8 border-t"
                style={{ borderColor: "rgba(15, 34, 41, 0.10)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255, 97, 48, 0.12)",
                    border: "1px solid rgba(255, 97, 48, 0.30)",
                  }}
                >
                  <span
                    className="text-sm font-black font-headline"
                    style={{ color: "#FF6130" }}
                  >
                    {(owner?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {owner?.display_name}
                  </p>
                  {owner?.bio && (
                    <p
                      className="text-[10px] line-clamp-1 max-w-xs"
                      style={{ color: "#94a3b8" }}
                    >
                      {owner.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              {isOwner ? (
                <Link
                  href={`/dashboard/collaborate/${challenge.id}`}
                  className="inline-block px-6 py-3.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(8, 145, 178, 0.10)",
                    border: "1px solid rgba(8, 145, 178, 0.25)",
                    color: "#0e7490",
                  }}
                >
                  Open Workspace
                </Link>
              ) : hasPurchased ? (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full w-fit"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.10)",
                    border: "1px solid rgba(16, 185, 129, 0.30)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span
                    className="text-sm font-bold font-headline"
                    style={{ color: "#047857" }}
                  >
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
