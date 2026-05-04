"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Notification bell — top-nav inbox.
 *
 * Fetches the user's unread count on mount, opens a dropdown of the
 * recent N notifications when clicked. Each notification renders with a
 * type-aware label + preview + time and deep-links to the right place.
 *
 * Backend: queries app_notification directly (RLS scopes to recipient).
 * Mark-read uses the existing mark_notification_read /
 * mark_all_notifications_read RPCs.
 *
 * Notification types currently wired in production:
 *   - collab_invite          (recipient = invitee)
 *   - collab_accepted        (recipient = original sender)
 *   - dm_new                 (recipient = conversation members; covers
 *                             workspace activity log + direct messages)
 *   - badge_awarded          (recipient = creator)
 *   - system                 (e.g. session time changed)
 */

type NotificationRow = {
  id: string;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

interface NotificationContent {
  label: string;
  preview: string;
  href: string | null;
}

function describeNotification(n: NotificationRow): NotificationContent {
  const p = n.payload ?? {};
  switch (n.type) {
    case "collab_invite":
      return {
        label: "New collaboration invitation",
        preview: "Someone invited you to explore a program",
        href: "/dashboard",
      };
    case "collab_accepted":
      return {
        label: "Invitation accepted",
        preview: "Your collaborator opened the workspace",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    case "dm_new":
      return {
        label: "New message",
        preview: typeof p.preview === "string" ? p.preview : "Activity in your workspace",
        // dm_new comes from workspace chat; conversation_id is the link.
        // The workspace lookup happens server-side; for now route to dashboard.
        href: "/dashboard",
      };
    case "badge_awarded":
      return {
        label: "Badge earned",
        preview: typeof p.badge_label === "string" ? p.badge_label : "You earned a badge",
        href: null,
      };
    case "system":
      if (p.kind === "session_time_changed") {
        return {
          label: "Session rescheduled",
          preview: "A session time was updated",
          href: p.session_id ? `/dashboard/sessions/${p.session_id}` : null,
        };
      }
      return {
        label: "System update",
        preview: typeof p.message === "string" ? p.message : "Update from INFITRA",
        href: null,
      };
    default:
      return {
        label: n.type.replace(/_/g, " "),
        preview: "",
        href: null,
      };
  }
}

export function NotificationBell() {
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial unread count fetch
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { count } = await supabase
        .from("app_notification")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (!cancelled) setUnreadCount(count ?? 0);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Click-outside to close dropdown
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function openDropdown() {
    setOpen(true);
    setLoading(true);
    const { data } = await supabase
      .from("app_notification")
      .select("id, type, payload, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(8);
    setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }

  async function markAllRead() {
    await supabase.rpc("mark_all_notifications_read");
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })),
    );
  }

  async function handleItemClick(n: NotificationRow) {
    if (!n.read_at) {
      await supabase.rpc("mark_notification_read", { p_id: n.id });
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((i) =>
          i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i,
        ),
      );
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-[#0F2229]/[0.05]"
        style={{ border: "1px solid rgba(15,34,41,0.10)" }}
        aria-label="Notifications"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] flex items-center justify-center font-headline text-white"
            style={{
              backgroundColor: "#FF6130",
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(255,97,48,0.40)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[360px] rounded-2xl overflow-hidden z-50"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(15,34,41,0.10)",
            boxShadow: "0 16px 48px rgba(15,34,41,0.18)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(15,34,41,0.06)" }}
          >
            <p
              className="text-[10px] uppercase tracking-widest font-headline"
              style={{ color: "#0F2229", fontWeight: 700 }}
            >
              Notifications
            </p>
            {items.some((i) => !i.read_at) && (
              <button
                onClick={markAllRead}
                className="text-[10px] uppercase tracking-widest font-headline transition-colors hover:text-[#FF6130]"
                style={{ color: "#94a3b8", fontWeight: 700 }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-xs" style={{ color: "#94a3b8" }}>
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs" style={{ color: "#94a3b8" }}>
                Nothing new yet.
              </p>
            ) : (
              items.map((n) => {
                const d = describeNotification(n);
                const unread = !n.read_at;
                const inner = (
                  <div
                    className="px-4 py-3 transition-colors hover:bg-[#0F2229]/[0.03] cursor-pointer"
                    style={{
                      backgroundColor: unread ? "rgba(8,145,178,0.04)" : "transparent",
                      borderLeft: unread
                        ? "3px solid #0891b2"
                        : "3px solid transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className="text-xs font-headline truncate"
                        style={{ color: "#0F2229", fontWeight: 700 }}
                      >
                        {d.label}
                      </p>
                      <span
                        className="text-[10px] shrink-0"
                        style={{ color: "#94a3b8" }}
                      >
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {d.preview && (
                      <p
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "#64748b" }}
                      >
                        {d.preview}
                      </p>
                    )}
                  </div>
                );
                return d.href ? (
                  <Link
                    key={n.id}
                    href={d.href}
                    onClick={() => handleItemClick(n)}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
