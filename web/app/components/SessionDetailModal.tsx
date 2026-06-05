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
}

/**
 * Read-only session detail popup. Opens on any session card click in the
 * workspace, in any contract state (drafting, locked, ready to publish).
 * Keeps the user in-context — no navigation out to /dashboard/sessions/[id]
 * and no nesting through the generic preview page.
 */
export function SessionDetailModal({ open, session, onClose, onEdit, onDelete }: Props) {
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
        className="max-w-lg w-full rounded-2xl overflow-hidden infitra-card"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        {session.imageUrl ? (
          <div className="aspect-[5/3] w-full overflow-hidden">
            <img src={session.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[5/3] w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2229, #1a3340, #2a1508)" }}>
            <img src="/logo-mark.png" alt="" width={48} height={48} style={{ opacity: 0.15 }} />
          </div>
        )}

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
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                    <span className="text-xs font-black text-cyan-700">{c.name[0]}</span>
                  </div>
                )}
                <span className="text-sm font-bold text-[#0F2229]">{c.name}</span>
                <span className="text-[10px] font-bold font-headline text-[#0891b2] uppercase tracking-wider">Cohost</span>
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
