"use client";

import { useEffect } from "react";

interface SessionDetail {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  cohosts: { id: string; name: string; avatar: string | null }[];
  /** Reason from the last emergency reschedule — when present, the modal
   *  shows a "this session was moved" note so the full story is readable
   *  here, not only in a truncated notification row. */
  changeReason?: string | null;
}

interface Props {
  open: boolean;
  session: SessionDetail | null;
  onClose: () => void;
  /** Optional — when provided, an "Edit" button appears that triggers
   *  the inline edit flow in the workspace and closes the modal. */
  onEdit?: () => void;
  /** Optional — when provided, a "Delete" button appears (with confirm)
   *  that removes the session and closes the modal. */
  onDelete?: () => void;
  /** Optional — expert-only, published upcoming sessions. Renders a calm
   *  tertiary "Reschedule" button in the actions row: findable when you are
   *  looking at the session, but never on the cards and never loud
   *  (emergency rescheduling is not a forefront feature; founder calls,
   *  17 Aug ×2 — first too loud was wrong, then too hidden was wrong). */
  onReschedule?: () => void;
}

/**
 * Read-only session detail popup. Opens on any session card click in the
 * workspace, in any contract state (drafting, locked, ready to publish).
 * Keeps the user in-context — no navigation out to /dashboard/sessions/[id]
 * and no nesting through the generic preview page.
 */
export function SessionDetailModal({ open, session, onClose, onEdit, onDelete, onReschedule }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !session) return null;

  const startDate = new Date(session.startTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.5)" }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-2xl infitra-card"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover — 16:9, the SAME format covers render in everywhere else
            (cards, chips, buyer page), so the crop matches what the image
            was chosen for. (A half-height strip was tried and regressed:
            it cropped subjects' heads.) The dark placeholder sits BEHIND
            the image so there is never a white flash while it loads. */}
        <div
          className="aspect-[16/9] w-full overflow-hidden flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}
        >
          {session.imageUrl ? (
            <img
              src={session.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <img src="/logo-mark.png" alt="" width={48} height={48} style={{ opacity: 0.15 }} />
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-black font-headline text-[#0F2229] tracking-tight mb-3">
            {session.title}
          </h2>

          {/* Schedule */}
          <div className="flex items-center gap-2 text-sm font-bold text-[#64748b] mb-4" suppressHydrationWarning>
            <span>{startDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</span>
            <span>·</span>
            <span>{startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            <span>·</span>
            <span>{session.durationMinutes} min</span>
          </div>

          {/* Reschedule note — the full story, readable in place. The time
              shown above is already the NEW time; this explains why it moved. */}
          {session.changeReason && session.changeReason.trim() && (
            <div
              className="mb-4 px-4 py-3 rounded-xl"
              style={{
                backgroundColor: "rgba(8,145,178,0.06)",
                border: "1px solid rgba(8,145,178,0.18)",
              }}
            >
              <p
                className="text-[10px] font-bold font-headline uppercase tracking-wider mb-1"
                style={{ color: "#0891b2" }}
              >
                This session was moved
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
                &ldquo;{session.changeReason.trim()}&rdquo;
              </p>
            </div>
          )}

          {/* Description (optional) — polish v12 */}
          {session.description && session.description.trim() && (
            <p
              className="text-sm leading-relaxed mb-6 whitespace-pre-wrap"
              style={{ color: "#475569" }}
            >
              {session.description}
            </p>
          )}

          {/* Host + cohosts */}
          <div className="space-y-2.5 mb-2">
            <p className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider">Hosted by</p>
            <div className="flex items-center gap-2.5">
              {session.hostAvatar ? (
                <img src={session.hostAvatar} alt={session.hostName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-black text-orange-700">{session.hostName[0]}</span>
                </div>
              )}
              <span className="text-sm font-bold text-[#0F2229]">{session.hostName}</span>
              <span className="text-[10px] font-bold font-headline text-[#FF6130] uppercase tracking-wider">Host</span>
            </div>
            {session.cohosts.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-xs font-black text-orange-700">{c.name[0]}</span>
                  </div>
                )}
                <span className="text-sm font-bold text-[#0F2229]">{c.name}</span>
                <span className="text-[10px] font-bold font-headline text-[#FF6130] uppercase tracking-wider">Cohost</span>
              </div>
            ))}
          </div>

          {/* Actions — Edit + Delete on the left when available, Close on the right */}
          <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold font-headline text-white"
                  style={{ backgroundColor: "#0891b2" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
              )}
              {onReschedule && (
                <button
                  onClick={() => { onClose(); onReschedule(); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold font-headline transition-colors hover:bg-[#0F2229]/[0.04]"
                  style={{ color: "#64748b", border: "1px solid rgba(15,34,41,0.15)" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Reschedule
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm("Delete this session?")) {
                      onClose();
                      onDelete();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold font-headline"
                  style={{
                    color: "#dc2626",
                    border: "1px solid rgba(220,38,38,0.30)",
                    backgroundColor: "rgba(220,38,38,0.05)",
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full text-sm font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
