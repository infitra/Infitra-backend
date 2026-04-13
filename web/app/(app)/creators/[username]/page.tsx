import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Creator — INFITRA",
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
  const diffMin = Math.floor((d.getTime() - now.getTime()) / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffMin < 0) return "Now";
  if (diffMin < 60) return `In ${diffMin} min`;
  if (diffH < 24) return `In ${diffH}h`;
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("app_profile")
    .select("id, display_name, username, bio, tagline, avatar_url, role, created_at")
    .eq("username", username)
    .eq("role", "creator")
    .single();

  if (!creator) notFound();

  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const backPath =
    myProfile?.role === "creator" || myProfile?.role === "admin"
      ? "/dashboard"
      : "/discover";
  const now = new Date();

  // All upcoming published sessions
  const { data: allSessions } = await supabase
    .from("app_session")
    .select("id, title, image_url, start_time, duration_minutes, price_cents")
    .eq("host_id", creator.id)
    .eq("status", "published")
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(10);

  // Find which sessions are challenge-linked
  const sessionIds = (allSessions ?? []).map((s: any) => s.id);
  const challengeLinkedMap: Record<
    string,
    { challengeId: string; challengeTitle: string }
  > = {};
  if (sessionIds.length > 0) {
    const { data: links } = await supabase
      .from("app_challenge_session")
      .select("session_id, challenge_id, app_challenge(title)")
      .in("session_id", sessionIds);
    for (const link of links ?? []) {
      const ch = (link as any).app_challenge;
      if (ch?.title) {
        challengeLinkedMap[(link as any).session_id] = {
          challengeId: (link as any).challenge_id,
          challengeTitle: ch.title,
        };
      }
    }
  }

  // Published challenges
  const { data: challenges } = await supabase
    .from("app_challenge")
    .select("id, title, image_url, start_date, end_date, price_cents")
    .eq("owner_id", creator.id)
    .eq("status", "published")
    .gte("start_date", now.toISOString().split("T")[0])
    .order("start_date", { ascending: true })
    .limit(5);

  // Community
  const { data: space } = await supabase
    .from("app_creator_space")
    .select("id")
    .eq("creator_id", creator.id)
    .maybeSingle();

  let memberCount = 0;
  if (space?.id) {
    const { count } = await supabase
      .from("app_creator_space_member")
      .select("user_id", { count: "exact", head: true })
      .eq("space_id", space.id);
    memberCount = count ?? 0;
  }

  const hasChallenges = challenges && challenges.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} role={myProfile?.role} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
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
            Back
          </Link>

          {/* Profile header */}
          <div className="rounded-2xl infitra-glass overflow-hidden mb-8">
            <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />
            <div className="p-8">
              <div className="flex items-center gap-5 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(255, 97, 48, 0.12)",
                    border: "1px solid rgba(255, 97, 48, 0.30)",
                  }}
                >
                  <span
                    className="text-2xl font-black font-headline"
                    style={{ color: "#FF6130" }}
                  >
                    {(creator.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1
                    className="text-2xl font-black font-headline tracking-tight"
                    style={{ color: "#0F2229" }}
                  >
                    {creator.display_name}
                  </h1>
                  {creator.tagline && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: "#64748b" }}
                    >
                      {creator.tagline}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {memberCount > 0 && (
                      <span
                        className="text-[10px] font-headline"
                        style={{ color: "#94a3b8" }}
                      >
                        {memberCount} community member
                        {memberCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {creator.bio && (
                <p
                  className="text-sm leading-relaxed max-w-lg"
                  style={{ color: "#64748b" }}
                >
                  {creator.bio}
                </p>
              )}
              {space?.id && (
                <Link
                  href={`/communities/creator/${space.id}`}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(8, 145, 178, 0.10)",
                    border: "1px solid rgba(8, 145, 178, 0.25)",
                    color: "#0e7490",
                  }}
                >
                  Enter Community &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Upcoming sessions */}
          {(allSessions ?? []).length > 0 && (
            <div className="mb-8">
              <h2
                className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Next Sessions
              </h2>
              <div className="space-y-2">
                {(allSessions ?? []).slice(0, 5).map((sess: any) => {
                  const linked = challengeLinkedMap[sess.id];
                  const priceCHF = (sess.price_cents ?? 0) / 100;
                  return (
                    <Link
                      key={sess.id}
                      href={
                        linked
                          ? `/challenges/${linked.challengeId}`
                          : `/sessions/${sess.id}`
                      }
                      className="flex items-center gap-3 p-4 rounded-xl infitra-glass-interactive group overflow-hidden"
                    >
                      {sess.image_url && (
                        <img src={sess.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-sm font-bold font-headline truncate transition-colors"
                            style={{ color: "#0F2229" }}
                          >
                            {sess.title}
                          </p>
                          {linked && (
                            <span
                              className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-headline"
                              style={{
                                color: "#FF6130",
                                backgroundColor: "rgba(255, 97, 48, 0.10)",
                              }}
                            >
                              {linked.challengeTitle}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[10px]"
                          style={{ color: "#64748b" }}
                        >
                          {formatRelativeTime(sess.start_time)} &middot;{" "}
                          {sess.duration_minutes} min
                        </p>
                      </div>
                      {!linked && (
                        <span
                          className="text-sm font-black font-headline shrink-0 ml-3"
                          style={{ color: "#0F2229" }}
                        >
                          {priceCHF > 0
                            ? `CHF ${priceCHF.toFixed(2)}`
                            : "Free"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Challenges */}
          {hasChallenges && (
            <div>
              <h2
                className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Challenges
              </h2>
              <div className="space-y-2">
                {challenges!.map((ch: any) => {
                  const priceCHF = (ch.price_cents ?? 0) / 100;
                  return (
                    <Link
                      key={ch.id}
                      href={`/challenges/${ch.id}`}
                      className="flex items-center gap-3 p-4 rounded-xl infitra-glass-interactive group overflow-hidden"
                    >
                      {ch.image_url && (
                        <img src={ch.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full font-headline"
                            style={{
                              color: "#FF6130",
                              backgroundColor: "rgba(255, 97, 48, 0.10)",
                            }}
                          >
                            CHALLENGE
                          </span>
                        </div>
                        <p
                          className="text-sm font-bold font-headline transition-colors"
                          style={{ color: "#0F2229" }}
                        >
                          {ch.title}
                        </p>
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "#64748b" }}
                        >
                          {formatDate(ch.start_date + "T00:00:00")} —{" "}
                          {formatDate(ch.end_date + "T00:00:00")}
                        </p>
                      </div>
                      <span
                        className="text-sm font-black font-headline shrink-0"
                        style={{ color: "#0F2229" }}
                      >
                        CHF {priceCHF.toFixed(2)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
