import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { GoLiveButton } from "@/app/components/GoLiveButton";
import { RescheduleForm } from "@/app/components/RescheduleForm";

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

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "text-slate-600 bg-slate-100/80 border-slate-200",
  },
  published: {
    label: "Published",
    className: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  },
  scheduled: {
    label: "Scheduled",
    className: "text-sky-700 bg-sky-100/80 border-sky-200",
  },
  ended: {
    label: "Ended",
    className: "text-slate-500 bg-slate-100/60 border-slate-200",
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

export default async function SessionDetailPage({
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

  const { data: session } = await supabase
    .from("app_session")
    .select("*")
    .eq("id", id)
    .eq("host_id", user.id)
    .single();

  if (!session) notFound();

  const s = STATUS_STYLES[session.status] ?? STATUS_STYLES.draft;
  const priceCHF = (session.price_cents ?? 0) / 100;

  const now = new Date();
  const startTime = new Date(session.start_time);
  const goLiveOpensAt = new Date(startTime.getTime() - 15 * 60 * 1000);
  const canGoLive = now >= goLiveOpensAt;

  const { data: challengeLink } = await supabase
    .from("app_challenge_session")
    .select("challenge_id")
    .eq("session_id", id)
    .maybeSingle();

  // Attendees (RLS allows host to see attendance for their sessions)
  const { data: attendees } = await supabase
    .from("app_attendance")
    .select("user_id, joined_at")
    .eq("session_id", id);

  // Fetch attendee profiles
  const attendeeUserIds = (attendees ?? []).map((a: any) => a.user_id);
  let attendeeNameMap: Record<string, string> = {};
  if (attendeeUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("app_profile")
      .select("id, display_name")
      .in("id", attendeeUserIds);
    for (const p of profiles ?? []) {
      attendeeNameMap[p.id] = p.display_name ?? "User";
    }
  }

  const attendeeList = (attendees ?? []).map((a: any) => ({
    userId: a.user_id,
    name: attendeeNameMap[a.user_id] ?? "User",
    joinedAt: a.joined_at,
  }));

  const isPublished = session.status === "published";
  const isPartOfChallenge = !!challengeLink;

  return (
    <div className="py-10">
      <Link
        href="/dashboard"
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
        Back to Dashboard
      </Link>

      {/* Cover image */}
      {session.image_url && (
        <div className="aspect-[3/1] rounded-2xl overflow-hidden mb-6">
          <img src={session.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1
              className="text-3xl md:text-4xl font-black font-headline tracking-tight"
              style={{ color: "#0F2229" }}
            >
              {session.title}
            </h1>
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.className}`}
            >
              {s.label}
            </span>
          </div>
          {session.description && (
            <p className="text-sm max-w-xl" style={{ color: "#64748b" }}>
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div
        className={`grid grid-cols-2 ${
          isPartOfChallenge ? "" : "md:grid-cols-4"
        } gap-4 mb-8`}
      >
        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
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
        <div className="p-5 rounded-2xl infitra-glass">
          <p
            className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Duration
          </p>
          <p
            className="text-sm font-semibold"
            style={{ color: "#0F2229" }}
          >
            {session.duration_minutes} min
          </p>
        </div>
        {!isPartOfChallenge && (
          <>
            <div className="p-5 rounded-2xl infitra-glass">
              <p
                className="text-[10px] font-bold uppercase tracking-widest font-headline mb-2"
                style={{ color: "rgba(15, 34, 41, 0.55)" }}
              >
                Capacity
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "#0F2229" }}
              >
                {session.capacity ?? "Unlimited"}
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
          </>
        )}
      </div>

      {/* Challenge link */}
      {challengeLink && (
        <Link
          href={`/dashboard/collaborate/${challengeLink.challenge_id}`}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold font-headline transition-colors hover:opacity-80"
          style={{
            backgroundColor: "rgba(8, 145, 178, 0.10)",
            border: "1px solid rgba(8, 145, 178, 0.25)",
            color: "#0e7490",
          }}
        >
          Part of a Challenge &rarr;
        </Link>
      )}

      {/* Live controls */}
      {isPublished && !session.live_room_id && canGoLive && (
        <GoLiveButton sessionId={session.id} />
      )}
      {isPublished && !session.live_room_id && !canGoLive && (
        <div className="mt-4 p-4 rounded-2xl infitra-glass">
          <p
            className="text-sm font-headline"
            style={{ color: "#0F2229" }}
          >
            Go Live opens 15 minutes before start
          </p>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            {formatDateTime(session.start_time)}
          </p>
        </div>
      )}
      {isPublished && session.live_room_id && (
        <Link
          href={`/dashboard/sessions/${session.id}/live`}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform"
          style={{
            backgroundColor: "#FF6130",
            boxShadow:
              "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          Enter Session
        </Link>
      )}
      {session.status === "ended" && session.ended_at && (
        <div className="mt-4 p-5 rounded-2xl infitra-glass">
          <p
            className="text-sm font-bold font-headline"
            style={{ color: "#0F2229" }}
          >
            Session ended
          </p>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            Ended {formatDateTime(session.ended_at)}
          </p>
        </div>
      )}
      {session.status === "draft" && challengeLink && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-full w-fit"
          style={{
            backgroundColor: "rgba(15, 34, 41, 0.06)",
            border: "1px solid rgba(15, 34, 41, 0.15)",
          }}
        >
          <span
            className="text-sm font-bold font-headline"
            style={{ color: "#475569" }}
          >
            Draft &mdash; managed from the challenge editor
          </span>
        </div>
      )}

      {/* Reschedule (published sessions only) */}
      {isPublished && !session.live_room_id && (
        <div className="mt-8">
          <RescheduleForm
            sessionId={session.id}
            currentStartTime={session.start_time}
          />
        </div>
      )}

      {/* Attendees */}
      {attendeeList.length > 0 && (
        <div className="mt-8">
          <h2
            className="text-sm font-bold uppercase tracking-wider font-headline mb-3"
            style={{ color: "rgba(15, 34, 41, 0.55)" }}
          >
            Attendees ({attendeeList.length})
          </h2>
          <div
            className="rounded-2xl infitra-glass divide-y"
            style={{ borderColor: "rgba(15, 34, 41, 0.06)" }}
          >
            {attendeeList.map((a: any) => (
              <div
                key={a.userId}
                className="flex items-center justify-between px-5 py-3"
              >
                {/* Attendee — plain text (participant profile route removed for pilot) */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "rgba(8, 145, 178, 0.12)",
                      border: "1px solid rgba(8, 145, 178, 0.30)",
                    }}
                  >
                    <span
                      className="text-[10px] font-black font-headline"
                      style={{ color: "#0891b2" }}
                    >
                      {a.name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className="text-sm font-headline"
                    style={{ color: "#0F2229" }}
                  >
                    {a.name}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#94a3b8" }}>
                  {a.joinedAt ? "Joined" : "Purchased"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
