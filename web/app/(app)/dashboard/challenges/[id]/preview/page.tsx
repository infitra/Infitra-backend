import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PreviewActions } from "./PreviewActions";

export const metadata = {
  title: "Preview Challenge — INFITRA",
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

export default async function ChallengePreviewPage({
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

  const { data: challenge } = await supabase
    .from("app_challenge")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!challenge) notFound();

  // If already published, redirect to the detail page
  if (challenge.status !== "draft") {
    redirect(`/dashboard/challenges/${id}`);
  }

  const { data: profile } = await supabase
    .from("app_profile")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  // Fetch linked sessions
  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select(
      "session_id, app_session(id, title, start_time, duration_minutes)"
    )
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean)
    .sort(
      (a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  const priceCHF = (challenge.price_cents ?? 0) / 100;

  return (
    <div className="py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-[#9CF0FF]/40 uppercase tracking-widest font-bold font-headline">
          Preview &mdash; how participants will see this
        </p>
        <Link
          href={`/dashboard/challenges/${id}`}
          className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors flex items-center gap-1.5 font-headline"
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
          Edit
        </Link>
      </div>

      {/* Challenge card preview */}
      <div className="rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 overflow-hidden">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-[#FF6130] to-[#FF6130]/40" />

        <div className="p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-3">
            {challenge.title}
          </h1>

          {challenge.description && (
            <p className="text-sm text-[#9CF0FF]/50 leading-relaxed mb-8 max-w-lg whitespace-pre-line">
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
                Spots
              </p>
              <p className="text-sm font-semibold text-white">
                {challenge.capacity
                  ? `${challenge.capacity} available`
                  : "Unlimited"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-1">
                Price
              </p>
              <p className="text-sm font-semibold text-white">
                {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
              </p>
            </div>
          </div>

          {/* Session timeline */}
          {linkedSessions.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-bold text-[#9CF0FF]/30 uppercase tracking-widest font-headline mb-3">
                {linkedSessions.length} Session
                {linkedSessions.length !== 1 ? "s" : ""} included
              </p>
              <div className="space-y-2">
                {linkedSessions.map((sess: any) => (
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
                      <p className="text-sm font-bold text-white font-headline truncate">
                        {sess.title}
                      </p>
                      <p className="text-[10px] text-[#9CF0FF]/40">
                        {formatSessionDate(sess.start_time)} at{" "}
                        {formatSessionTime(sess.start_time)} &middot;{" "}
                        {sess.duration_minutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Host badge */}
          <div className="flex items-center gap-3 pt-6 border-t border-[#9CF0FF]/8">
            <div className="w-9 h-9 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/30 flex items-center justify-center">
              <span className="text-sm font-black text-[#FF6130] font-headline">
                {(profile?.display_name ?? "?")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-white font-headline">
                {profile?.display_name}
              </p>
              <p className="text-[10px] text-[#9CF0FF]/30">Creator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <PreviewActions challengeId={challenge.id} />
    </div>
  );
}
