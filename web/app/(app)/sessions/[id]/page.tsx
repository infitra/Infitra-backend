import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";
import { PurchaseButton } from "@/app/components/PurchaseButton";

export const metadata = {
  title: "Session — INFITRA",
};

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " at " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default async function SessionPage({
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

  // Fetch published session
  const { data: session } = await supabase
    .from("app_session")
    .select("*")
    .eq("id", id)
    .in("status", ["published", "ended"])
    .single();

  if (!session) notFound();

  // Fetch host profile
  const { data: host } = await supabase
    .from("app_profile")
    .select("id, display_name, username, bio, avatar_url")
    .eq("id", session.host_id)
    .single();

  // Check if user already has an attendance record (already purchased)
  const { data: attendance } = await supabase
    .from("app_attendance")
    .select("id")
    .eq("session_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Check if session belongs to a challenge
  const { data: challengeLink } = await supabase
    .from("app_challenge_session")
    .select("challenge_id, app_challenge(id, title, price_cents)")
    .eq("session_id", id)
    .maybeSingle();

  const parentChallenge = (challengeLink as any)?.app_challenge ?? null;
  const isPartOfChallenge = !!parentChallenge;

  // For challenge sessions, also check challenge membership
  let hasChallengeAccess = false;
  if (isPartOfChallenge) {
    const { data: membership } = await supabase
      .from("app_challenge_member")
      .select("challenge_id")
      .eq("challenge_id", parentChallenge.id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasChallengeAccess = !!membership;
  }

  const hasPurchased = !!attendance || hasChallengeAccess;
  const priceCHF = isPartOfChallenge
    ? (parentChallenge.price_cents ?? 0) / 100
    : (session.price_cents ?? 0) / 100;
  const isFree = priceCHF === 0;
  const isHost = user.id === session.host_id;

  // Participants can join 5 min before start
  const now = new Date();
  const startTime = new Date(session.start_time);
  const joinOpensAt = new Date(startTime.getTime() - 5 * 60 * 1000);
  const canJoin = now >= joinOpensAt;

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          {/* Back link */}
          <Link
            href="/discover"
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

          {/* Session card */}
          <div className="rounded-2xl infitra-glass overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />

            <div className="p-8 md:p-10">
              {/* Challenge banner */}
              {isPartOfChallenge && (
                <Link
                  href={`/challenges/${parentChallenge.id}`}
                  className="mb-6 flex items-center gap-3 p-4 rounded-xl transition-colors group/ch"
                  style={{
                    backgroundColor: "rgba(255, 97, 48, 0.08)",
                    border: "1px solid rgba(255, 97, 48, 0.25)",
                  }}
                >
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full font-headline shrink-0"
                    style={{
                      color: "#FF6130",
                      backgroundColor: "rgba(255, 97, 48, 0.12)",
                    }}
                  >
                    CHALLENGE
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-bold font-headline truncate transition-colors"
                      style={{ color: "#0F2229" }}
                    >
                      {parentChallenge.title}
                    </p>
                    <p className="text-[10px]" style={{ color: "#64748b" }}>
                      This session is part of a challenge &middot; CHF{" "}
                      {(parentChallenge.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="shrink-0"
                    style={{ color: "#FF6130" }}
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}

              {/* Title */}
              <h1
                className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-4"
                style={{ color: "#0F2229" }}
              >
                {session.title}
              </h1>

              {/* Description */}
              {session.description && (
                <p
                  className="text-sm leading-relaxed mb-8 max-w-xl whitespace-pre-line"
                  style={{ color: "#64748b" }}
                >
                  {session.description}
                </p>
              )}

              {/* Info grid */}
              <div
                className={`grid grid-cols-2 ${
                  isPartOfChallenge ? "" : "md:grid-cols-4"
                } gap-4 mb-8`}
              >
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    When
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#0F2229" }}
                  >
                    {formatDateTime(session.start_time)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                    style={{ color: "rgba(15, 34, 41, 0.55)" }}
                  >
                    Duration
                  </p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#0F2229" }}
                  >
                    {formatDuration(session.duration_minutes)}
                  </p>
                </div>
                {!isPartOfChallenge && (
                  <>
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                        style={{ color: "rgba(15, 34, 41, 0.55)" }}
                      >
                        Spots
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#0F2229" }}
                      >
                        {session.capacity
                          ? `${session.capacity} available`
                          : "Unlimited"}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest font-headline mb-1"
                        style={{ color: "rgba(15, 34, 41, 0.55)" }}
                      >
                        Price
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "#0F2229" }}
                      >
                        {isFree ? "Free" : `CHF ${priceCHF.toFixed(2)}`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Host */}
              <Link
                href={host?.username ? `/creators/${host.username}` : "#"}
                className="flex items-center gap-3 pt-6 mb-8 group/host border-t"
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
                    {(host?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold font-headline transition-colors"
                    style={{ color: "#0F2229" }}
                  >
                    {host?.display_name}
                  </p>
                  {host?.bio && (
                    <p
                      className="text-[10px] line-clamp-1 max-w-xs"
                      style={{ color: "#94a3b8" }}
                    >
                      {host.bio}
                    </p>
                  )}
                </div>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className="shrink-0"
                  style={{ color: "#94a3b8" }}
                >
                  <path
                    d="M9 18l6-6-6-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* CTA */}
              {isHost ? (
                <Link
                  href={`/dashboard/sessions/${session.id}`}
                  className="inline-block px-6 py-3.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(8, 145, 178, 0.10)",
                    border: "1px solid rgba(8, 145, 178, 0.25)",
                    color: "#0e7490",
                  }}
                >
                  View in Dashboard
                </Link>
              ) : hasPurchased ? (
                session.status === "ended" ? (
                  <div
                    className="w-full py-4 rounded-full text-center"
                    style={{
                      backgroundColor: "rgba(15, 34, 41, 0.06)",
                      border: "1px solid rgba(15, 34, 41, 0.15)",
                    }}
                  >
                    <span
                      className="text-sm font-black font-headline"
                      style={{ color: "#475569" }}
                    >
                      Session has ended
                    </span>
                  </div>
                ) : session.live_room_id && canJoin ? (
                  <Link
                    href={`/sessions/${session.id}/live`}
                    className="w-full py-4 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center block"
                    style={{
                      backgroundColor: "#FF6130",
                      boxShadow:
                        "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
                    }}
                  >
                    Join Session
                  </Link>
                ) : session.live_room_id && !canJoin ? (
                  <div>
                    <div
                      className="w-full py-4 rounded-full text-center"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.10)",
                        border: "1px solid rgba(16, 185, 129, 0.30)",
                      }}
                    >
                      <span
                        className="text-sm font-black font-headline"
                        style={{ color: "#047857" }}
                      >
                        Session opens soon
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-center mt-3"
                      style={{ color: "#94a3b8" }}
                    >
                      You can join 5 minutes before start.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      className="w-full py-4 rounded-full text-center"
                      style={{
                        backgroundColor: "rgba(16, 185, 129, 0.10)",
                        border: "1px solid rgba(16, 185, 129, 0.30)",
                      }}
                    >
                      <span
                        className="text-sm font-black font-headline"
                        style={{ color: "#047857" }}
                      >
                        {isPartOfChallenge ? "Enrolled" : "Ticket purchased"}
                      </span>
                    </div>
                    <p
                      className="text-[10px] text-center mt-3"
                      style={{ color: "#94a3b8" }}
                    >
                      {isPartOfChallenge
                        ? "You have access via your challenge enrolment. Join link will be available when the session goes live."
                        : "You have access to this session. Join link will be available when the session goes live."}
                    </p>
                  </div>
                )
              ) : isPartOfChallenge ? (
                <Link
                  href={`/challenges/${parentChallenge.id}`}
                  className="w-full py-4 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform text-center block"
                  style={{
                    backgroundColor: "#FF6130",
                    boxShadow:
                      "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
                  }}
                >
                  View Challenge — CHF{" "}
                  {(parentChallenge.price_cents / 100).toFixed(2)}
                </Link>
              ) : (
                <PurchaseButton
                  kind="session"
                  targetId={session.id}
                  label={
                    isFree
                      ? "Join Session"
                      : `Get Ticket — CHF ${priceCHF.toFixed(2)}`
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
