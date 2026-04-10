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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch space
  const { data: space } = await supabase
    .from("app_challenge_space")
    .select("id, title, description, owner_id, source_challenge_id")
    .eq("id", spaceId)
    .single();

  if (!space) notFound();

  // Fetch challenge info
  let challengeTitle: string | null = null;
  if (space.source_challenge_id) {
    const { data: challenge } = await supabase
      .from("app_challenge")
      .select("title")
      .eq("id", space.source_challenge_id)
      .single();
    challengeTitle = challenge?.title ?? null;
  }

  // Check posting rights via RPC
  const { data: canPostResult } = await supabase.rpc(
    "can_post_in_challenge_space",
    { p_space: spaceId, p_user: user.id }
  );
  const canPost = canPostResult === true;

  // Member count
  const { count: memberCount } = await supabase
    .from("app_challenge_space_member")
    .select("user_id", { count: "exact", head: true })
    .eq("space_id", spaceId);

  // Owner profile
  const { data: owner } = await supabase
    .from("app_profile")
    .select("display_name")
    .eq("id", space.owner_id)
    .single();

  // User profile for nav + role for back link
  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const backPath =
    myProfile?.role === "creator" || myProfile?.role === "admin"
      ? "/dashboard"
      : "/discover";

  // Challenge sessions
  let challengeSessions: any[] = [];
  const now = new Date();
  if (space.source_challenge_id) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select(
        "session_id, app_session(id, title, start_time, duration_minutes, status, live_room_id)"
      )
      .eq("challenge_id", space.source_challenge_id);
    challengeSessions = (links ?? [])
      .map((l: any) => l.app_session)
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          {/* Back */}
          <Link
            href={backPath}
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
            Communities
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-[9px] font-bold px-2.5 py-1 rounded-full font-headline"
                style={{
                  color: "#FF6130",
                  backgroundColor: "rgba(255, 97, 48, 0.10)",
                  border: "1px solid rgba(255, 97, 48, 0.20)",
                }}
              >
                TRIBE
              </span>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {memberCount ?? 0} member
                {(memberCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>

            <h1
              className="text-3xl md:text-4xl font-black font-headline tracking-tight mb-3"
              style={{ color: "#0F2229" }}
            >
              {space.title}
            </h1>

            {/* Challenge + owner info */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(255, 97, 48, 0.12)",
                  border: "1px solid rgba(255, 97, 48, 0.30)",
                }}
              >
                <span
                  className="text-xs font-black font-headline"
                  style={{ color: "#FF6130" }}
                >
                  {(owner?.display_name ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-bold font-headline"
                  style={{ color: "#0F2229" }}
                >
                  {owner?.display_name}
                </p>
                {challengeTitle && (
                  <Link
                    href={`/challenges/${space.source_challenge_id}`}
                    className="text-[10px] font-headline transition-colors hover:opacity-80"
                    style={{ color: "#FF6130" }}
                  >
                    {challengeTitle} &rarr;
                  </Link>
                )}
              </div>
            </div>

            {space.description && (
              <p
                className="text-sm mt-4 max-w-lg"
                style={{ color: "#64748b" }}
              >
                {space.description}
              </p>
            )}
          </div>

          {/* Challenge sessions */}
          {challengeSessions.length > 0 && (
            <div className="mb-6">
              <h3
                className="text-xs font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Sessions
              </h3>
              <div className="space-y-2">
                {challengeSessions.map((sess: any) => {
                  const startTime = new Date(sess.start_time);
                  const isEnded = sess.status === "ended";
                  const joinOpensAt = new Date(
                    startTime.getTime() - 5 * 60 * 1000
                  );
                  const canJoinSess =
                    !!sess.live_room_id && now >= joinOpensAt && !isEnded;
                  const diffMin = Math.floor(
                    (startTime.getTime() - now.getTime()) / 60000
                  );
                  const timeLabel = isEnded
                    ? "Ended"
                    : diffMin < 0
                      ? "Now"
                      : diffMin < 60
                        ? `In ${diffMin} min`
                        : diffMin < 1440
                          ? `In ${Math.floor(diffMin / 60)}h`
                          : startTime.toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            });

                  return (
                    <div
                      key={sess.id}
                      className={`flex items-center gap-3 p-3 rounded-xl infitra-glass ${
                        isEnded ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          sess.live_room_id && !isEnded
                            ? "bg-rose-500 animate-pulse"
                            : isEnded
                              ? "bg-slate-300"
                              : "bg-orange-500"
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
                          {timeLabel} &middot; {sess.duration_minutes} min
                        </p>
                      </div>
                      {canJoinSess && (
                        <Link
                          href={`/sessions/${sess.id}/live`}
                          className="px-2.5 py-1 rounded-full text-white text-[9px] font-bold font-headline shrink-0 inline-flex items-center gap-1"
                          style={{
                            backgroundColor: "#FF6130",
                            boxShadow: "0 4px 14px rgba(255,97,48,0.30)",
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Join
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PostFeed
            spaceId={spaceId}
            communityType="challenge"
            currentUserId={user.id}
            canPost={canPost}
          />
        </div>
      </div>
    </div>
  );
}
