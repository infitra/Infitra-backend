import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChallengeEditForm } from "./ChallengeEditForm";

export const metadata = {
  title: "Challenge — INFITRA",
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "text-slate-600 bg-slate-100/80 border-slate-200",
  },
  published: {
    label: "Published",
    className: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  },
  completed: {
    label: "Completed",
    className: "text-slate-500 bg-slate-100/60 border-slate-200",
  },
  canceled: {
    label: "Canceled",
    className: "text-rose-700 bg-rose-100/80 border-rose-200",
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
    .select("session_id, app_session(id, title, description, image_url, start_time, duration_minutes, status)")
    .eq("challenge_id", id);

  const linkedSessions = (linkedRows ?? [])
    .map((r: any) => r.app_session)
    .filter(Boolean);

  // Sort linked sessions by start_time
  linkedSessions.sort(
    (a: any, b: any) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <div className="py-10 max-w-2xl mx-auto">
      <Link
        href="/dashboard/challenges"
        className="text-xs transition-colors mb-6 flex items-center gap-1.5 font-headline"
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
        All Challenges
      </Link>

      {isDraft ? (
        <>
          <div className="flex items-center gap-3 mb-8">
            <h1
              className="text-3xl md:text-4xl font-black font-headline tracking-tight"
              style={{ color: "#0F2229" }}
            >
              Edit Challenge
            </h1>
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.className}`}
            >
              {s.label}
            </span>
          </div>
          <ChallengeEditForm
            challenge={challenge}
            linkedSessions={linkedSessions}
          />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className="text-3xl md:text-4xl font-black font-headline tracking-tight"
                  style={{ color: "#0F2229" }}
                >
                  {challenge.title}
                </h1>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.className}`}
                >
                  {s.label}
                </span>
              </div>
              {challenge.description && (
                <p className="text-sm max-w-xl" style={{ color: "#64748b" }}>
                  {challenge.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl infitra-glass">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
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
            <div className="p-5 rounded-2xl infitra-glass">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
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
            <div className="p-5 rounded-2xl infitra-glass">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
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
            <div className="p-5 rounded-2xl infitra-glass">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Price
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "#0F2229" }}
              >
                {priceCHF > 0 ? `CHF ${priceCHF.toFixed(2)}` : "Free"}
              </p>
            </div>
          </div>

          {/* Linked sessions list */}
          {linkedSessions.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-xs font-bold uppercase tracking-wider font-headline mb-3"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Sessions
              </h2>
              <div className="space-y-2">
                {linkedSessions.map((sess: any) => (
                  <div key={sess.id} className="p-4 rounded-xl infitra-glass">
                    <p
                      className="text-sm font-bold font-headline"
                      style={{ color: "#0F2229" }}
                    >
                      {sess.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
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
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-full w-fit"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.10)",
                border: "1px solid rgba(16, 185, 129, 0.30)",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className="text-sm font-bold font-headline"
                style={{ color: "#047857" }}
              >
                Live &mdash; visible to participants
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
