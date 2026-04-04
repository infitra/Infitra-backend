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
    .select("display_name")
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

  const hasPurchased = !!attendance;
  const priceCHF = (session.price_cents ?? 0) / 100;
  const isFree = priceCHF === 0;
  const isHost = user.id === session.host_id;

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

          {/* Session card */}
          <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />

            <div className="p-8 md:p-10">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-4">
                {session.title}
              </h1>

              {/* Description */}
              {session.description && (
                <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8 max-w-xl whitespace-pre-line">
                  {session.description}
                </p>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    When
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatDateTime(session.start_time)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Duration
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {formatDuration(session.duration_minutes)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Spots
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {session.capacity
                      ? `${session.capacity} available`
                      : "Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                    Price
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {isFree ? "Free" : `CHF ${priceCHF.toFixed(2)}`}
                  </p>
                </div>
              </div>

              {/* Host */}
              <div className="flex items-center gap-3 pt-6 border-t border-[#9CF0FF]/8 mb-8">
                <div className="w-10 h-10 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/30 flex items-center justify-center">
                  <span className="text-sm font-black text-[#FF6130] font-headline">
                    {(host?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white font-headline">
                    {host?.display_name}
                  </p>
                  {host?.bio && (
                    <p className="text-[10px] text-[#9CF0FF]/30 line-clamp-1 max-w-xs">
                      {host.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* CTA */}
              {isHost ? (
                <Link
                  href={`/dashboard/sessions/${session.id}`}
                  className="inline-block px-6 py-3.5 rounded-full bg-[#9CF0FF]/10 border border-[#9CF0FF]/20 text-sm font-bold text-[#9CF0FF] font-headline hover:bg-[#9CF0FF]/15 transition-colors"
                >
                  View in Dashboard
                </Link>
              ) : hasPurchased ? (
                session.status === "ended" ? (
                  <div className="w-full py-4 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 text-center">
                    <span className="text-sm font-black text-[#9CF0FF]/50 font-headline">
                      Session has ended
                    </span>
                  </div>
                ) : session.live_room_id ? (
                  <Link
                    href={`/sessions/${session.id}/live`}
                    className="w-full py-4 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline shadow-[0_0_25px_rgba(255,97,48,0.3)] hover:scale-[1.02] transition-transform text-center block"
                  >
                    Join Session
                  </Link>
                ) : (
                  <div>
                    <div className="w-full py-4 rounded-full bg-green-400/10 border border-green-400/20 text-center">
                      <span className="text-sm font-black text-green-400 font-headline">
                        Ticket purchased
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9CF0FF]/25 text-center mt-3">
                      You have access to this session. Join link will be
                      available when the session goes live.
                    </p>
                  </div>
                )
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
