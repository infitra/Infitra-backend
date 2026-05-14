"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Slim, collapsible audit log of field-level edits in the workspace.
 * Replaces the chat-thread system messages (post_workspace_log) for the
 * field-edit case — those used to bury the human conversation in
 * "X updated the title", "Y added a session" pings.
 *
 * Reads from app_workspace_activity (RLS scoped to owner + cohorts).
 * Subscribes to the same `workspace-activity` window event the chat
 * uses, so a creator's own edits appear without a manual refresh; the
 * other party picks them up via Supabase Realtime on the underlying
 * table (publication includes app_workspace_activity).
 *
 * Default state: collapsed. The summary chip ("Recent changes · 3 ▾")
 * tells you something happened without consuming visual real estate.
 */

interface Props {
  challengeId: string;
  /** Profile lookup for actor names — already loaded by the page. */
  profiles: Record<string, { name: string; avatar: string | null }>;
}

interface ActivityRow {
  id: string;
  actor_id: string;
  kind: string;
  payload: { field?: string; old?: unknown; new?: unknown } | null;
  created_at: string;
}

const FETCH_LIMIT = 20;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function describe(row: ActivityRow): string {
  const field = row.payload?.field;
  switch (field) {
    case "challenge_details":
      return "updated the challenge details";
    case "session_added": {
      const title = (row.payload?.new as { title?: string } | undefined)?.title;
      return title ? `added session "${title}"` : "added a session";
    }
    case "session_edited": {
      const title = (row.payload?.new as { title?: string } | undefined)?.title;
      return title ? `edited session "${title}"` : "edited a session";
    }
    case "session_removed":
      return "removed a session";
    case "promise_text":
      return "updated the Promise";
    case "weekly_arc":
      return "updated the Weekly Arc";
    case "topic_ownership":
      return "updated Who Handles What";
    case "intro_prompt":
      return "updated the Intro Prompt";
    default:
      return field ? `edited ${field}` : "made a change";
  }
}

export function RecentChangesExpander({ challengeId, profiles }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refetch() {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_workspace_activity")
      .select("id, actor_id, kind, payload, created_at")
      .eq("challenge_id", challengeId)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);
    if (data) setRows(data as ActivityRow[]);
    setLoading(false);
  }

  // Initial load
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  // Local actor signal — same event the chat listens for.
  // The acting user sees their edit reflected without a round trip.
  useEffect(() => {
    function handler() { refetch(); }
    window.addEventListener("workspace-activity", handler);
    return () => window.removeEventListener("workspace-activity", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const count = rows.length;

  return (
    <div
      className="rounded-2xl infitra-card overflow-hidden"
      style={{ marginBottom: 12 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors"
        style={{
          backgroundColor: open ? "rgba(0,0,0,0.02)" : "transparent",
        }}
      >
        <span className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold font-headline uppercase tracking-wider"
            style={{ color: "#94a3b8" }}
          >
            Recent changes
          </span>
          {!loading && (
            <span
              className="text-[11px] font-bold font-headline px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: count > 0 ? "rgba(8,145,178,0.10)" : "rgba(0,0,0,0.04)",
                color: count > 0 ? "#0891b2" : "#94a3b8",
              }}
            >
              {count}
            </span>
          )}
        </span>
        <span
          className="text-xs"
          style={{
            color: "#94a3b8",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="px-4 py-3 space-y-2 max-h-72 overflow-y-auto"
          style={{ borderTop: "1px solid rgba(15,34,41,0.06)" }}
        >
          {loading ? (
            <p className="text-xs text-center py-2" style={{ color: "#94a3b8" }}>
              Loading…
            </p>
          ) : rows.length === 0 ? (
            <p className="text-xs italic text-center py-2" style={{ color: "#94a3b8" }}>
              No edits yet.
            </p>
          ) : (
            rows.map((row) => {
              const actorName = profiles[row.actor_id]?.name ?? "Someone";
              return (
                <div key={row.id} className="flex items-baseline gap-2">
                  <p
                    className="text-[11px] flex-1 leading-relaxed"
                    style={{ color: "#475569" }}
                  >
                    <span className="font-bold font-headline" style={{ color: "#0F2229" }}>
                      {actorName}
                    </span>{" "}
                    {describe(row)}
                  </p>
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: "#94a3b8" }}
                  >
                    {timeAgo(row.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
