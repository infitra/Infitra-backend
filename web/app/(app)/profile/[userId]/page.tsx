import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Profile — INFITRA",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // If viewing a creator, redirect to their creator profile
  const { data: profileUser } = await supabase
    .from("app_profile")
    .select("id, display_name, username, bio, tagline, avatar_url, role, created_at")
    .eq("id", userId)
    .single();

  if (!profileUser) notFound();

  if (profileUser.role === "creator" && profileUser.username) {
    redirect(`/creators/${profileUser.username}`);
  }

  const { data: myProfile } = await supabase
    .from("app_profile")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

  const backPath =
    myProfile?.role === "creator" || myProfile?.role === "admin"
      ? "/dashboard"
      : "/discover";

  // Badges
  const { data: userBadges } = await supabase
    .from("app_user_badge")
    .select(
      "badge_id, awarded_at, app_badge(label, description, tier, color_hex, icon)"
    )
    .eq("user_id", userId)
    .eq("visible_on_profile", true)
    .is("revoked_at", null)
    .order("awarded_at", { ascending: false });

  // Journey: sessions attended
  const { data: attendedSessions } = await supabase
    .from("app_attendance")
    .select(
      "session_id, joined_at, app_session(title, start_time, host_id, app_profile!app_session_host_id_fkey(display_name))"
    )
    .eq("user_id", userId)
    .not("joined_at", "is", null)
    .order("joined_at", { ascending: false })
    .limit(10);

  // Challenge memberships
  const { data: challengeMemberships } = await supabase
    .from("app_challenge_member")
    .select("challenge_id, joined_at, app_challenge(title, start_date, end_date)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(10);

  // Stats
  const attendedCount = attendedSessions?.length ?? 0;
  const challengeCount = challengeMemberships?.length ?? 0;
  const badgeCount = userBadges?.length ?? 0;
  const memberSince = profileUser.created_at
    ? formatDate(profileUser.created_at)
    : null;

  const tierColors: Record<string, string> = {
    common: "text-slate-700 bg-slate-100/80 border-slate-200",
    advanced: "text-sky-700 bg-sky-100/80 border-sky-200",
    rare: "text-violet-700 bg-violet-100/80 border-violet-200",
    epic: "text-orange-700 bg-orange-100/80 border-orange-200",
    legendary: "text-amber-700 bg-amber-100/80 border-amber-200",
    seasonal: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  };

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
            <div className="h-1 bg-gradient-to-r from-[#0891b2] to-[#0891b2]/40" />
            <div className="p-8">
              <div className="flex items-center gap-5 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(8, 145, 178, 0.12)",
                    border: "1px solid rgba(8, 145, 178, 0.30)",
                  }}
                >
                  <span
                    className="text-2xl font-black font-headline"
                    style={{ color: "#0891b2" }}
                  >
                    {(profileUser.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1
                    className="text-2xl font-black font-headline tracking-tight"
                    style={{ color: "#0F2229" }}
                  >
                    {profileUser.display_name}
                  </h1>
                  {profileUser.bio && (
                    <p
                      className="text-sm mt-0.5"
                      style={{ color: "#64748b" }}
                    >
                      {profileUser.bio}
                    </p>
                  )}
                  {memberSince && (
                    <p
                      className="text-[10px] mt-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Member since {memberSince}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div
                className="flex items-center gap-6 pt-4 border-t"
                style={{ borderColor: "rgba(15, 34, 41, 0.10)" }}
              >
                <div>
                  <p
                    className="text-lg font-black font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {attendedCount}
                  </p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                    Sessions
                  </p>
                </div>
                <div>
                  <p
                    className="text-lg font-black font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {challengeCount}
                  </p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                    Challenges
                  </p>
                </div>
                <div>
                  <p
                    className="text-lg font-black font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {badgeCount}
                  </p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                    Badges
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {badgeCount > 0 && (
            <div className="mb-8">
              <h2
                className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(userBadges ?? []).map((ub: any) => {
                  const badge = ub.app_badge;
                  if (!badge) return null;
                  const tierStyle = tierColors[badge.tier] ?? tierColors.common;
                  return (
                    <div
                      key={ub.badge_id}
                      className={`p-4 rounded-xl border ${tierStyle}`}
                    >
                      <p className="text-sm font-bold font-headline">
                        {badge.label}
                      </p>
                      {badge.description && (
                        <p className="text-[10px] opacity-75 mt-1">
                          {badge.description}
                        </p>
                      )}
                      <p className="text-[9px] opacity-60 mt-2 uppercase tracking-wider font-headline">
                        {badge.tier} &middot; {formatDate(ub.awarded_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Journey: sessions attended */}
          {attendedCount > 0 && (
            <div className="mb-8">
              <h2
                className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Session Journey
              </h2>
              <div className="space-y-2">
                {(attendedSessions ?? []).map((a: any) => {
                  const sess = a.app_session;
                  if (!sess) return null;
                  const host = sess.app_profile;
                  return (
                    <div
                      key={a.session_id}
                      className="flex items-center gap-3 p-3 rounded-xl infitra-glass"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
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
                          {formatDate(sess.start_time)}
                          {host?.display_name && (
                            <> &middot; {host.display_name}</>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Challenge memberships */}
          {challengeCount > 0 && (
            <div>
              <h2
                className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Challenges
              </h2>
              <div className="space-y-2">
                {(challengeMemberships ?? []).map((m: any) => {
                  const ch = m.app_challenge;
                  if (!ch) return null;
                  return (
                    <Link
                      key={m.challenge_id}
                      href={`/challenges/${m.challenge_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl infitra-glass transition-colors hover:opacity-90"
                    >
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full font-headline shrink-0"
                        style={{
                          color: "#FF6130",
                          backgroundColor: "rgba(255, 97, 48, 0.10)",
                        }}
                      >
                        TRIBE
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-bold font-headline truncate"
                          style={{ color: "#0F2229" }}
                        >
                          {ch.title}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: "#64748b" }}
                        >
                          {formatDate(ch.start_date + "T00:00:00")} —{" "}
                          {formatDate(ch.end_date + "T00:00:00")}
                        </p>
                      </div>
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
