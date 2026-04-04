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

  // Fetch published sessions with future start times, join host profile
  const { data: sessions } = await supabase
    .from("app_session")
    .select(
      "id, title, description, start_time, duration_minutes, capacity, price_cents, currency, host_id, app_profile!app_session_host_id_fkey(display_name, username)"
    )
    .eq("status", "published")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  // Fetch published challenges with future start dates
  const { data: challenges } = await supabase
    .from("app_challenge")
    .select(
      "id, title, description, start_date, end_date, price_cents, capacity, owner_id, app_profile!app_challenge_owner_id_fkey(display_name, username)"
    )
    .eq("status", "published")
    .gte("start_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  const hasSessions = sessions && sessions.length > 0;
  const hasChallenges = challenges && challenges.length > 0;
  const hasContent = hasSessions || hasChallenges;

  return (
    <div className="min-h-screen bg-[#071318] flex flex-col">
      <ParticipantNav displayName={profile?.display_name ?? null} />

      <div className="flex-1 pt-20 px-6">
        <div className="max-w-5xl mx-auto py-10">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              Discover
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mt-1">
              Upcoming sessions and challenges from creators on INFITRA.
            </p>
          </div>

          {!hasContent ? (
            <div className="text-center py-20">
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
              <h2 className="text-xl font-black text-white font-headline tracking-tight mb-2">
                Nothing here yet
              </h2>
              <p className="text-sm text-[#9CF0FF]/40 max-w-xs mx-auto">
                Creators are setting up. Check back soon for sessions and
                challenges you can join.
              </p>
            </div>
          ) : (
            <div className="space-y-12">

          {/* Challenges section */}
          {hasChallenges && (
            <div>
              <h2 className="text-lg font-black text-white font-headline tracking-tight mb-4">
                Challenges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges!.map((challenge: any) => {
                  const owner = challenge.app_profile;
                  const priceCHF = (challenge.price_cents ?? 0) / 100;

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
                            {formatDate(challenge.start_date + "T00:00:00")} —{" "}
                            {formatDate(challenge.end_date + "T00:00:00")}
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
                                {(owner?.display_name ?? "?")[0].toUpperCase()}
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

          {/* Sessions section */}
          {hasSessions && (
            <div>
              {hasChallenges && (
                <h2 className="text-lg font-black text-white font-headline tracking-tight mb-4">
                  Sessions
                </h2>
              )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session: any) => {
                const host = session.app_profile;
                const priceCHF = (session.price_cents ?? 0) / 100;

                return (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="group block rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-all overflow-hidden"
                  >
                    {/* Accent bar */}
                    <div className="h-0.5 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/20 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6">
                      {/* Date pill */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline">
                          {formatDate(session.start_time)} &middot;{" "}
                          {formatTime(session.start_time)}
                        </span>
                        <span className="text-[10px] text-[#9CF0FF]/25">
                          {session.duration_minutes} min
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#FF6130] transition-colors line-clamp-2">
                        {session.title}
                      </h3>

                      {/* Description */}
                      {session.description && (
                        <p className="text-xs text-[#9CF0FF]/35 leading-relaxed mb-5 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      {/* Footer: host + price */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#9CF0FF]/8">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/25 flex items-center justify-center">
                            <span className="text-[10px] font-black text-[#FF6130] font-headline">
                              {(host?.display_name ?? "?")[0].toUpperCase()}
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
  );
}
