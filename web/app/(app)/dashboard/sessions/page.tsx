import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "Sessions — INFITRA",
};

// ── Beam vocabulary tokens ──────────────────────────────────────
// Inset bottom line follows any rounded radius automatically; outer
// shadows provide the downward-biased halo. Cyan = featured / structural,
// Orange = primary action.
const cardBeamCyan: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #9CF0FF",
    "0 0 18px rgba(156,240,255,0.45)",
    "0 0 48px rgba(156,240,255,0.20)",
    "0 6px 30px rgba(156,240,255,0.32)",
    "0 14px 50px rgba(156,240,255,0.16)",
  ].join(", "),
};

const buttonBeamOrange: CSSProperties = {
  boxShadow: [
    "inset 0 -3px 0 #FF6130",
    "0 0 14px rgba(255,97,48,0.55)",
    "0 0 36px rgba(255,97,48,0.28)",
    "0 5px 22px rgba(255,97,48,0.40)",
  ].join(", "),
};

// Status badges — kept semantic, kept inside the cyan family so they
// don't compete with the beam vocabulary.
const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-[#9CF0FF]/50 bg-[#9CF0FF]/8 border-[#9CF0FF]/15",
  },
  published: {
    label: "Published",
    color: "text-[#9CF0FF] bg-[#9CF0FF]/10 border-[#9CF0FF]/25",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-[#9CF0FF]/70 bg-[#9CF0FF]/6 border-[#9CF0FF]/15",
  },
  ended: {
    label: "Ended",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/4 border-[#9CF0FF]/10",
  },
  completed: {
    label: "Completed",
    color: "text-[#9CF0FF]/30 bg-[#9CF0FF]/4 border-[#9CF0FF]/10",
  },
  canceled: {
    label: "Canceled",
    color: "text-white/30 bg-white/4 border-white/10",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SessionsPage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("vw_my_sessions_overview")
    .select("*")
    .neq("status", "draft")
    .order("start_time", { ascending: false });

  const hasSessions = sessions && sessions.length > 0;

  // Identify the next upcoming session — the only Featured row.
  // It's the earliest published/scheduled session whose start_time is
  // still in the future. Used to mark exactly ONE row with the cyan beam.
  const now = Date.now();
  const upcomingSession = sessions
    ?.filter(
      (s: any) =>
        (s.status === "published" || s.status === "scheduled") &&
        new Date(s.start_time).getTime() > now,
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )[0];

  // Reorder so the featured (next upcoming) session is always first in the
  // list — otherwise the cyan beam can hide far down a long history.
  const orderedSessions = (() => {
    if (!sessions) return [];
    if (!upcomingSession) return sessions;
    const rest = sessions.filter(
      (s: any) => s.session_id !== upcomingSession.session_id,
    );
    return [upcomingSession, ...rest];
  })();

  return (
    <div className="py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight">
            Sessions
          </h1>
          <p className="text-sm text-[#9CF0FF]/40 mt-1">
            Create, manage, and publish live sessions.
          </p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="px-7 py-3 rounded-md bg-[#0F2229] text-[#FF6130] text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
          style={buttonBeamOrange}
        >
          New Session
        </Link>
      </div>

      {!hasSessions ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#FF6130]/10 border border-[#FF6130]/20 flex items-center justify-center mx-auto mb-6">
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#FF6130"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white font-headline tracking-tight mb-2">
            No sessions yet
          </h2>
          <p className="text-sm text-[#9CF0FF]/40 mb-6 max-w-xs mx-auto">
            Create your first session to start building your schedule.
          </p>
          <Link
            href="/dashboard/sessions/new"
            className="inline-block px-7 py-3 rounded-md bg-[#0F2229] text-[#FF6130] text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
            style={buttonBeamOrange}
          >
            Create Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orderedSessions.map((session: any) => {
            const s = STATUS_STYLES[session.status] ?? STATUS_STYLES.draft;
            const revenueCHF = (session.ticket_gross_cents ?? 0) / 100;
            const isFeatured =
              session.session_id === upcomingSession?.session_id;

            return (
              <Link
                key={session.session_id}
                href={`/dashboard/sessions/${session.session_id}`}
                className="beam-hover-cyan block p-5 rounded-xl bg-[rgba(15,34,41,0.55)] backdrop-blur-xl border border-[rgba(156,240,255,0.10)] hover:bg-[rgba(15,34,41,0.85)] hover:border-[rgba(156,240,255,0.28)] group"
                style={isFeatured ? cardBeamCyan : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isFeatured && (
                        <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CF0FF] shrink-0">
                          Next up
                        </span>
                      )}
                      <h3 className="text-lg font-black text-white font-headline tracking-tight truncate">
                        {session.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9CF0FF]/40">
                      <span>
                        {formatDate(session.start_time)} at{" "}
                        {formatTime(session.start_time)}
                      </span>
                      {session.attendee_count > 0 && (
                        <span>
                          {session.attendee_count} attendee
                          {session.attendee_count !== 1 ? "s" : ""}
                        </span>
                      )}
                      {revenueCHF > 0 && <span>CHF {revenueCHF.toFixed(2)}</span>}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="text-[#9CF0FF]/30 group-hover:text-[#9CF0FF]/60 transition-colors shrink-0 mt-1"
                  >
                    <path
                      d="M9 18l6-6-6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
