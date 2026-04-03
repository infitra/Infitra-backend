import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChallengeEditForm } from "./ChallengeEditForm";

export const metadata = {
  title: "Challenge — INFITRA",
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-[#9CF0FF]/50 bg-[#9CF0FF]/8 border-[#9CF0FF]/15",
  },
  published: {
    label: "Published",
    color: "text-green-400 bg-green-400/8 border-green-400/20",
  },
  completed: {
    label: "Completed",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/5 border-[#9CF0FF]/10",
  },
  canceled: {
    label: "Canceled",
    color: "text-red-400/60 bg-red-400/8 border-red-400/15",
  },
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

export default async function ChallengeDetailPage({
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

  const isDraft = challenge.status === "draft";
  const s = STATUS_STYLES[challenge.status] ?? STATUS_STYLES.draft;
  const priceCHF = (challenge.price_cents ?? 0) / 100;

  // Fetch linked sessions
  const { data: linkedRows } = await supabase
    .from("app_challenge_session")
    .select("session_id, app_session(id, title, start_time, duration_minutes, status)")
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? []).map(
    (r: any) => r.app_session
  ).filter(Boolean);

  // For draft: fetch user's unlinked draft sessions for the picker
  let availableSessions: any[] = [];
  if (isDraft) {
    const linkedIds = linkedSessions.map((s: any) => s.id);
    const query = supabase
      .from("app_session")
      .select("id, title, start_time, duration_minutes")
      .eq("host_id", user.id)
      .eq("status", "draft")
      .order("start_time", { ascending: true });

    const { data: allDrafts } = await query;
    availableSessions = (allDrafts ?? []).filter(
      (s: any) => !linkedIds.includes(s.id)
    );
  }

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <Link
        href="/dashboard/challenges"
        className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-6 flex items-center gap-1.5 font-headline"
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
        All Challenges
      </Link>

      {isDraft ? (
        <>
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
              Edit Challenge
            </h1>
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
            >
              {s.label}
            </span>
          </div>
          <ChallengeEditForm
            challenge={challenge}
            linkedSessions={linkedSessions}
            availableSessions={availableSessions}
          />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
                  {challenge.title}
                </h1>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                >
                  {s.label}
                </span>
              </div>
              {challenge.description && (
                <p className="text-sm text-[#9CF0FF]/40 max-w-xl">
                  {challenge.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
                Starts
              </p>
              <p className="text-sm font-semibold text-white">
                {formatDate(challenge.start_date)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
                Ends
              </p>
              <p className="text-sm font-semibold text-white">
                {formatDate(challenge.end_date)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
                Sessions
              </p>
              <p className="text-sm font-semibold text-white">
                {linkedSessions.length}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10">
              <p className="text-[10px] font-bold text-[#9CF0FF]/40 uppercase tracking-widest font-headline mb-2">
                Price
              </p>
              <p className="text-sm font-semibold text-white">
                {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
              </p>
            </div>
          </div>

          {/* Linked sessions list */}
          {linkedSessions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline mb-3">
                Sessions
              </h2>
              <div className="space-y-2">
                {linkedSessions.map((sess: any) => (
                  <div
                    key={sess.id}
                    className="p-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10"
                  >
                    <p className="text-sm font-bold text-white font-headline">
                      {sess.title}
                    </p>
                    <p className="text-xs text-[#9CF0FF]/40 mt-1">
                      {new Date(sess.start_time).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      &middot; {sess.duration_minutes} min
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {challenge.status === "published" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-400/8 border border-green-400/20 w-fit">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-bold text-green-400 font-headline">
                Live &mdash; visible to participants
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
