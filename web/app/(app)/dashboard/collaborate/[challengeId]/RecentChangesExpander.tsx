"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityRow } from "./useWorkspaceRealtime";

/**
 * Slim, collapsible audit log of field-level edits in the workspace.
 * Pure presentational — receives the live activity array from the
 * shared useWorkspaceRealtime subscription owned by WorkspaceShell.
 *
 * Default state: collapsed. The summary chip ("Recent changes · 3 ▾")
 * tells you something happened without consuming visual real estate.
 */

interface Props {
  challengeId: string;
  activity: ActivityRow[];
  profiles: Record<string, { name: string; avatar: string | null }>;
}

const DISPLAY_LIMIT = 20;

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
    case "title":
      return "updated the title";
    case "description":
      return "updated the description";
    case "start_date":
    case "end_date":
      return "updated the dates";
    case "price":
      return "updated the price";
    case "image_url":
      return "updated the cover image";
    case "capacity":
      return "updated the capacity";
    case "challenge_details":
      return "updated the challenge details";
    case "promise_text":
      return "updated the Promise";
    case "weekly_focus":
    case "weekly_arc":
      return "updated the Weekly Focus";
    case "topic_ownership":
      return "updated Who Handles What";
    case "intro_prompt":
      return "updated the Intro Prompt";
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
    case "cohost_added":
      return "added a collaborator";
    case "cohost_removed":
      return "removed a collaborator";
    case "cohost_split":
      return "adjusted revenue splits";
    case "session_cohost_added":
      return "added a cohost to a session";
    case "session_cohost_removed":
      return "removed a cohost from a session";
    default:
      return field ? `edited ${field}` : "made a change";
  }
}

/**
 * Per-workspace localStorage key for the timestamp of the last time
 * this user expanded the Recent Changes panel. Drives the unread
 * badge count: only entries with `created_at > lastViewedAt` are
 * counted as unread. Per-device by design — see polish v12 notes.
 */
function lastViewedKey(challengeId: string): string {
  return `infitra:workspace:${challengeId}:recentChangesLastViewed`;
}

export function RecentChangesExpander({
  challengeId,
  activity,
  profiles,
}: Props) {
  const [open, setOpen] = useState(false);
  const rows = activity.slice(0, DISPLAY_LIMIT);

  // Polish v12: badge counts UNREAD entries only (created after the
  // last time this user expanded the panel) instead of the raw rolling
  // total. State held in localStorage so the count persists across
  // page reloads on the same device. First visit → no key yet → we
  // seed it to "now" so the badge starts at 0; subsequent edits then
  // raise it. This matches "you've seen everything that existed when
  // you first opened the workspace" — the cohost doesn't get spammed
  // with a "20" badge on every fresh visit.
  const [lastViewedAt, setLastViewedAt] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = lastViewedKey(challengeId);
    const stored = window.localStorage.getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed)) {
        setLastViewedAt(parsed);
        return;
      }
    }
    // First visit: seed to now so we don't surface the entire backlog
    // as "unread" the first time someone lands on the workspace.
    const now = Date.now();
    window.localStorage.setItem(key, String(now));
    setLastViewedAt(now);
  }, [challengeId]);

  const unreadCount = useMemo(() => {
    if (lastViewedAt === null) return 0;
    return rows.filter((r) => new Date(r.created_at).getTime() > lastViewedAt).length;
  }, [rows, lastViewedAt]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      // Mark as viewed when the user OPENS the panel (the moment they
      // can actually read the entries). Closing doesn't touch it — we
      // don't want closing to be a "marked as read" gesture.
      if (next && typeof window !== "undefined") {
        const now = Date.now();
        window.localStorage.setItem(lastViewedKey(challengeId), String(now));
        setLastViewedAt(now);
      }
      return next;
    });
  }

  const count = unreadCount;

  return (
    <div
      className="rounded-2xl infitra-card overflow-hidden shrink-0"
    >
      <button
        type="button"
        onClick={toggleOpen}
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
          <span
            className="text-[11px] font-bold font-headline px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: count > 0 ? "rgba(8,145,178,0.10)" : "rgba(0,0,0,0.04)",
              color: count > 0 ? "#0891b2" : "#94a3b8",
            }}
          >
            {count}
          </span>
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
          {rows.length === 0 ? (
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
