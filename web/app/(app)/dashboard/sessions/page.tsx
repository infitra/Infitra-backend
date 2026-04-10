import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "Sessions — INFITRA",
};

// ── Light theme tokens ──────────────────────────────────────────
// Cards sit on the wave-flowing cream background. Featured rows get
// an inset cyan line + soft cyan halo so the brand colour reads on
// the light surface without competing with the wave background.

// No featured extra styling — all cards are uniform

const buttonOrangePill: CSSProperties = {
  backgroundColor: "#FF6130",
  boxShadow:
    "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
};

// Status badges — semantic colours for light theme (emerald / sky / slate)
const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  draft: {
    label: "Draft",
    color: "text-slate-500 bg-slate-100/70 border-slate-200",
  },
  published: {
    label: "Published",
    color: "text-emerald-700 bg-emerald-100/80 border-emerald-200",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-sky-700 bg-sky-100/80 border-sky-200",
  },
  ended: {
    label: "Ended",
    color: "text-slate-500 bg-slate-100/70 border-slate-200",
  },
  completed: {
    label: "Completed",
    color: "text-slate-500 bg-slate-100/70 border-slate-200",
  },
  canceled: {
    label: "Canceled",
    color: "text-slate-400 bg-slate-100/50 border-slate-200",
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

  // Reorder so the featured row is always first.
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
          <h1
            className="text-3xl md:text-4xl font-black font-headline tracking-tight"
            style={{ color: "#0F2229" }}
          >
            Sessions
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Create, manage, and publish live sessions.
          </p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="px-7 py-3 rounded-md text-white text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
          style={buttonOrangePill}
        >
          New Session
        </Link>
      </div>

      {!hasSessions ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              backgroundColor: "rgba(255, 97, 48, 0.10)",
              border: "1px solid rgba(255, 97, 48, 0.25)",
            }}
          >
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
          <h2
            className="text-xl font-black font-headline tracking-tight mb-2"
            style={{ color: "#0F2229" }}
          >
            No sessions yet
          </h2>
          <p
            className="text-sm mb-6 max-w-xs mx-auto"
            style={{ color: "#64748b" }}
          >
            Create your first session to start building your schedule.
          </p>
          <Link
            href="/dashboard/sessions/new"
            className="inline-block px-7 py-3 rounded-md text-white text-xs font-black font-headline uppercase tracking-[0.15em] hover:scale-[1.02] transition-transform"
            style={buttonOrangePill}
          >
            Create Session
          </Link>
        </div>
      ) : (
        <div className="space-y-3 pb-12">
          {orderedSessions.map((session: any) => {
            const s = STATUS_STYLES[session.status] ?? STATUS_STYLES.draft;
            const revenueCHF = (session.ticket_gross_cents ?? 0) / 100;
            const isFeatured =
              session.session_id === upcomingSession?.session_id;

            return (
              <Link
                key={session.session_id}
                href={`/dashboard/sessions/${session.session_id}`}
                className="block p-5 rounded-2xl infitra-card-link group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {isFeatured && (
                        <span
                          className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] shrink-0"
                          style={{ color: "#0891b2" }}
                        >
                          Next up
                        </span>
                      )}
                      <h3 className="text-lg font-black font-headline tracking-tight truncate text-[#0F2229] group-hover:text-[#FF6130]">
                        {session.title}
                      </h3>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border font-headline ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-4 text-xs"
                      style={{ color: "#64748b" }}
                    >
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
                      {revenueCHF > 0 && (
                        <span>CHF {revenueCHF.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    className="shrink-0 mt-1 opacity-0 group-hover:opacity-50"
                    style={{ color: "#0F2229" }}
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
