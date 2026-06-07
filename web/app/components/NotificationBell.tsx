"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Notification bell — top-nav inbox.
 *
 * Backend: queries app_notification directly (RLS scopes to recipient).
 * Mark-read uses `mark_notification_read` for individual items (when
 * the user actually clicks them) and `mark_all_notifications_read`
 * for the bulk action.
 *
 * Two-state model:
 *   - SEEN (opening the bell counts as "I've seen what's new") —
 *     tracked client-side via a localStorage timestamp. Clearing the
 *     count is purely a function of `created_at > lastSeen`. This is
 *     persistent across reloads without ever mutating server state.
 *   - READ (the user actually clicked into a notification) — the
 *     server `read_at` column. Drives the per-item cyan/orange rule.
 *
 * So an unclicked notification still shows its accent rule after the
 * bell has been opened (correct: you saw it but didn't act on it),
 * but it no longer contributes to the unread badge after refresh.
 */

const LAST_SEEN_KEY = "infitra_notification_last_seen";
const ACCENT_INVITE = "#FF6130";   // orange — invitation needs a response
const ACCENT_OTHER = "#0891b2";    // cyan — informational signals

type NotificationRow = {
  id: string;
  type: string;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
};

type EnrichedNotification = NotificationRow & {
  senderName?: string;
  senderAvatar?: string | null;
};

function readLastSeen(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SEEN_KEY);
}

function writeLastSeen(): string {
  const now = new Date().toISOString();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_SEEN_KEY, now);
  }
  return now;
}

function accentFor(type: string): string {
  return type === "collab_invite" ? ACCENT_INVITE : ACCENT_OTHER;
}

/** Glyph for notifications without a sender avatar (published, badge,
 *  reschedule, etc.) — so every item reads at a glance instead of a bland dot. */
function TypeIcon({ type, color }: { type: string; color: string }) {
  const c = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "badge_awarded")
    return <svg {...c}><circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11" /></svg>;
  if (type === "challenge_published")
    return <svg {...c}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>;
  if (type.startsWith("contract_"))
    return <svg {...c}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></svg>;
  if (type === "question_for_you" || type === "coach_answered_your_question")
    return <svg {...c}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
  if (type === "system")
    return <svg {...c}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
  return <svg {...c}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}

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
  title: string;
  detail: string | null;
  href: string | null;
}

function describeNotification(n: EnrichedNotification): NotificationContent {
  const p = n.payload ?? {};
  const sender = n.senderName ?? null;
  switch (n.type) {
    case "collab_invite":
      return {
        title: sender ? `${sender} invited you to collaborate` : "New collaboration invitation",
        detail: "Open the workspace together to talk it through",
        href: "/dashboard#invitations",
      };
    case "collab_accepted":
      return {
        title: sender ? `${sender} accepted your invitation` : "Invitation accepted",
        detail: "Workspace is ready — go meet them there",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    // Polish v12.U.2: contract-flow + publish notifications. Previously
    // these fell through to the default case which just rendered the
    // raw type string ("contract locked"). Now each gets a real human
    // sentence, an actionable detail, and a deep link.
    case "contract_locked":
      return {
        title: sender ? `${sender} locked the contract` : "Contract locked for review",
        detail: "Review terms and accept or request changes",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    case "contract_accepted":
      return {
        title: sender ? `${sender} accepted the terms` : "Terms accepted",
        detail: "When everyone has accepted, you can publish the collaboration",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    case "contract_declined":
      return {
        title: sender ? `${sender} requested changes` : "Changes requested",
        detail: typeof p.comment === "string" && p.comment.trim()
          ? p.comment
          : "Reopen the draft to revise the terms",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    case "challenge_published":
      return {
        title: sender
          ? `${sender} published ${typeof p.title === "string" ? `"${p.title}"` : "the collaboration"}`
          : "Collaboration published",
        detail: "Your program is live — participants can now join",
        href: p.challenge_id ? `/dashboard/collaborate/${p.challenge_id}` : "/dashboard",
      };
    case "dm_new": {
      const preview = typeof p.preview === "string" ? p.preview : "";
      return {
        title: sender ? `${sender}` : "New message",
        detail: preview || "New activity in your workspace",
        href: "/dashboard",
      };
    }
    case "badge_awarded":
      return {
        title: "Badge earned",
        detail: typeof p.badge_label === "string" ? p.badge_label : "You earned a badge",
        href: null,
      };
    case "system":
      if (p.kind === "session_time_changed") {
        return {
          title: "Session rescheduled",
          detail: "A session time was updated",
          // The Experience Space works for either recipient (participant lands
          // there; a creator sees their console there) — and the standalone
          // session pages are retired.
          href: p.challenge_id ? `/experiences/${p.challenge_id}/space` : null,
        };
      }
      return {
        title: "System update",
        detail: typeof p.message === "string" ? p.message : "Update from INFITRA",
        href: null,
      };
    default:
      return { title: n.type.replace(/_/g, " "), detail: null, href: null };
  }
}

export function NotificationBell() {
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<EnrichedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial unread count fetch — only items newer than the last time
  // the user opened the bell. The timestamp lives in localStorage so
  // the badge stays cleared across reloads even when the underlying
  // notifications still have read_at = null (the user "saw" them but
  // hasn't clicked them).
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const lastSeen = readLastSeen();
      let q = supabase
        .from("app_notification")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (lastSeen) q = q.gt("created_at", lastSeen);
      const { count } = await q;
      if (!cancelled) setUnreadCount(count ?? 0);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Click-outside to close
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

    // Persist this open as the new "last seen" timestamp and clear the
    // badge immediately. We do not mutate read_at server-side — that's
    // reserved for actual click-throughs, so the per-item rule keeps
    // showing on items the user opened but never clicked.
    writeLastSeen();
    setUnreadCount(0);

    // Step 1: fetch recent notifications
    const { data: rawItems } = await supabase
      .from("app_notification")
      .select("id, type, payload, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    const rows = (rawItems ?? []) as NotificationRow[];

    // Step 2: enrich with sender names (batch profile lookup for the
    // notification types that have a sender — collab_invite,
    // collab_accepted, dm_new). Single SELECT, no N+1.
    const senderIds = new Set<string>();
    for (const r of rows) {
      const p = r.payload ?? {};
      if (typeof p.from_id === "string") senderIds.add(p.from_id);
      if (typeof p.actor_id === "string") senderIds.add(p.actor_id);
    }
    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    if (senderIds.size > 0) {
      const { data: profiles } = await supabase
        .from("app_profile")
        .select("id, display_name, avatar_url")
        .in("id", [...senderIds]);
      for (const p of profiles ?? [])
        profileMap[(p as any).id] = {
          name: (p as any).display_name ?? "Creator",
          avatar: (p as any).avatar_url,
        };
    }

    const enriched: EnrichedNotification[] = rows.map((r) => {
      const p = r.payload ?? {};
      const senderId = (p.from_id as string) ?? (p.actor_id as string) ?? null;
      const sender = senderId ? profileMap[senderId] : null;
      return {
        ...r,
        senderName: sender?.name,
        senderAvatar: sender?.avatar ?? null,
      };
    });

    setItems(enriched);
    setLoading(false);
  }

  function closeDropdown() {
    setOpen(false);
  }

  async function markAllReadNow() {
    await supabase.rpc("mark_all_notifications_read");
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })),
    );
  }

  /**
   * Click handler for individual notification rows. Awaits the RPC
   * BEFORE navigating so the read state actually persists. Was the
   * cause of the "notifications go back to unread" bug — Link with
   * async onClick navigated before the RPC could finish.
   */
  async function handleItemClick(n: EnrichedNotification) {
    const d = describeNotification(n);

    // Optimistic UI update
    if (!n.read_at) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) =>
        prev.map((i) =>
          i.id === n.id ? { ...i, read_at: new Date().toISOString() } : i,
        ),
      );
      // Await before navigating so the RPC actually completes
      await supabase.rpc("mark_notification_read", { p_id: n.id });
    }

    closeDropdown();
    if (d.href) router.push(d.href);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => (open ? closeDropdown() : openDropdown())}
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
          className="absolute right-0 mt-2 rounded-2xl overflow-hidden z-[60]"
          style={{
            width: "min(380px, calc(100vw - 1.5rem))",
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
                onClick={markAllReadNow}
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
              <div className="px-4 py-10 text-center">
                <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.10)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <p className="text-sm font-bold font-headline" style={{ color: "#64748b" }}>You&apos;re all caught up</p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Invites, answers, and updates will land here.</p>
              </div>
            ) : (
              items.map((n) => {
                const d = describeNotification(n);
                const unread = !n.read_at;
                const accent = accentFor(n.type);
                const tint =
                  accent === ACCENT_INVITE
                    ? "rgba(255,97,48,0.05)"
                    : "rgba(8,145,178,0.04)";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="w-full text-left transition-colors hover:bg-[#0F2229]/[0.03]"
                    style={{
                      backgroundColor: unread ? tint : "transparent",
                      borderLeft: unread
                        ? `3px solid ${accent}`
                        : "3px solid transparent",
                    }}
                  >
                    <div className="px-4 py-3 flex items-start gap-3">
                      {/* Sender avatar (when applicable) */}
                      {n.senderAvatar ? (
                        <img
                          src={n.senderAvatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: `${accent}1f` }}
                        >
                          {n.senderName ? (
                            <span className="text-xs font-headline" style={{ color: accent, fontWeight: 700 }}>
                              {n.senderName[0].toUpperCase()}
                            </span>
                          ) : (
                            <TypeIcon type={n.type} color={accent} />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-xs font-headline"
                            style={{ color: "#0F2229", fontWeight: 700 }}
                          >
                            {d.title}
                          </p>
                          <span
                            className="text-[10px] shrink-0"
                            style={{ color: "#94a3b8" }}
                          >
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        {d.detail && (
                          <p
                            className="text-xs mt-0.5 line-clamp-2"
                            style={{ color: "#64748b" }}
                          >
                            {d.detail}
                          </p>
                        )}
                      </div>
                    </div>
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
