import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ParticipantNav } from "@/app/components/ParticipantNav";

export const metadata = {
  title: "Profile — INFITRA",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const backPath = myProfile?.role === "creator" || myProfile?.role === "admin" ? "/dashboard" : "/discover";
  const isOwnProfile = user.id === userId;

  // Badges
  const { data: userBadges } = await supabase
    .from("app_user_badge")
    .select("badge_id, awarded_at, app_badge(label, description, tier, color_hex, icon)")
    .eq("user_id", userId)
    .eq("visible_on_profile", true)
    .is("revoked_at", null)
    .order("awarded_at", { ascending: false });

  // Journey: sessions attended
  const { data: attendedSessions } = await supabase
    .from("app_attendance")
    .select("session_id, joined_at, app_session(title, start_time, host_id, app_profile!app_session_host_id_fkey(display_name))")
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
    common: "text-[#9CF0FF]/60 bg-[#9CF0FF]/10 border-[#9CF0FF]/20",
    advanced: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    rare: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    epic: "text-[#FF6130] bg-[#FF6130]/10 border-[#FF6130]/20",
    legendary: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    seasonal: "text-green-400 bg-green-400/10 border-green-400/20",
  };

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={myProfile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-3xl mx-auto py-10">
          <Link href={backPath} className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-8 flex items-center gap-1.5 font-headline">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </Link>

          {/* Profile header */}
          <div className="rounded-2xl glass-card overflow-hidden mb-8">
            <div className="h-1 bg-gradient-to-r from-[#9CF0FF]/40 to-[#9CF0FF]/10" />
            <div className="p-8">
              <div className="flex items-center gap-5 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#9CF0FF]/10 border border-[#9CF0FF]/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-[#9CF0FF]/60 font-headline">
                    {(profileUser.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white font-headline tracking-tight">
                    {profileUser.display_name}
                  </h1>
                  {profileUser.bio && <p className="text-sm text-[#9CF0FF]/40 mt-0.5">{profileUser.bio}</p>}
                  {memberSince && (
                    <p className="text-[10px] text-[#9CF0FF]/20 mt-2">Member since {memberSince}</p>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-[#9CF0FF]/8">
                <div>
                  <p className="text-lg font-black text-white font-headline">{attendedCount}</p>
                  <p className="text-[10px] text-[#9CF0FF]/30">Sessions</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white font-headline">{challengeCount}</p>
                  <p className="text-[10px] text-[#9CF0FF]/30">Challenges</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white font-headline">{badgeCount}</p>
                  <p className="text-[10px] text-[#9CF0FF]/30">Badges</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {badgeCount > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
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
                      <p className="text-sm font-bold font-headline">{badge.label}</p>
                      {badge.description && (
                        <p className="text-[10px] opacity-60 mt-1">{badge.description}</p>
                      )}
                      <p className="text-[9px] opacity-40 mt-2 uppercase tracking-wider font-headline">
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
              <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
                Session Journey
              </h2>
              <div className="space-y-2">
                {(attendedSessions ?? []).map((a: any) => {
                  const sess = a.app_session;
                  if (!sess) return null;
                  const host = sess.app_profile;
                  return (
                    <div key={a.session_id} className="flex items-center gap-3 p-3 rounded-xl glass-card">
                      <span className="w-2 h-2 rounded-full bg-green-400/40 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white font-headline truncate">{sess.title}</p>
                        <p className="text-[10px] text-[#9CF0FF]/30">
                          {formatDate(sess.start_time)}
                          {host?.display_name && <> &middot; {host.display_name}</>}
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
              <h2 className="text-sm font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
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
                      className="flex items-center gap-3 p-3 rounded-xl glass-card hover:border-[#FF6130]/20 transition-colors"
                    >
                      <span className="text-[9px] font-bold text-[#FF6130]/60 bg-[#FF6130]/10 px-2 py-0.5 rounded-full font-headline shrink-0">TRIBE</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white font-headline truncate">{ch.title}</p>
                        <p className="text-[10px] text-[#9CF0FF]/30">
                          {formatDate(ch.start_date + "T00:00:00")} — {formatDate(ch.end_date + "T00:00:00")}
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
