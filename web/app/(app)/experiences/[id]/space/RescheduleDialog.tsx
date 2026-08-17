"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Emergency reschedule dialog — deliberately NOT in the forefront (founder
 * call): it opens only from a quiet link inside the session detail popup,
 * expert-only. Rescheduling is for the moments a session genuinely cannot
 * happen (illness, family emergency); a real reason is required and goes,
 * verbatim, into the participant notification email.
 *
 * The mutation is app_reschedule_session — the ONLY path that can move a
 * published session (RLS allows client edits on drafts only). It atomically
 * moves the time, clears the room (precreate builds a fresh one), re-arms
 * reminders + the pre-pulse, and enqueues the notification emails.
 */

interface Props {
  open: boolean;
  sessionId: string;
  sessionTitle: string;
  currentStart: string; // ISO
  onClose: () => void;
}

export function RescheduleDialog({ open, sessionId, sessionTitle, currentStart, onClose }: Props) {
  const router = useRouter();
  const [newStart, setNewStart] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  if (!open) return null;

  const reasonOk = reason.trim().length >= 10;
  const startOk = newStart && new Date(newStart).getTime() > Date.now() + 5 * 60_000;

  const submit = async () => {
    if (!reasonOk || !startOk || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("app_reschedule_session", {
      p_session: sessionId,
      p_new_start: new Date(newStart).toISOString(),
      p_reason: reason.trim(),
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setDone((data as { notified?: number })?.notified ?? 0);
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,34,41,0.55)" }}
      onClick={busy ? undefined : onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="max-w-md w-full rounded-2xl p-6"
        style={{ backgroundColor: "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {done !== null ? (
          <>
            <p
              className="text-[10px] font-bold font-headline uppercase tracking-[0.22em] mb-2"
              style={{ color: "#0891b2" }}
            >
              Session moved
            </p>
            <h2 className="text-xl font-black font-headline tracking-tight mb-3" style={{ color: "#0F2229" }}>
              Your tribe knows.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#475569" }}>
              {done} {done === 1 ? "person" : "people"} are being emailed the new
              time and your reason right now. The schedule in the space is
              already updated, and the live room will be ready at the new time.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full text-white text-sm font-bold font-headline"
              style={{ backgroundColor: "#0F2229" }}
            >
              Back to the space
            </button>
          </>
        ) : (
          <>
            <p
              className="text-[10px] font-bold font-headline uppercase tracking-[0.22em] mb-2"
              style={{ color: "#FF6130" }}
            >
              Emergency reschedule
            </p>
            <h2 className="text-xl font-black font-headline tracking-tight mb-2" style={{ color: "#0F2229" }}>
              Move {sessionTitle}
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#475569" }}>
              For the moments a session genuinely cannot happen: illness, a
              family emergency, something serious. Every participant is emailed
              immediately with the new time and your reason, word for word.
            </p>

            <label className="block mb-4">
              <span className="text-[11px] font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                New time
              </span>
              <input
                type="datetime-local"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm"
                style={{ border: "1px solid rgba(15,34,41,0.15)", color: "#0F2229" }}
              />
              <span className="block mt-1 text-[11px]" style={{ color: "#94a3b8" }}>
                Currently{" "}
                {new Date(currentStart).toLocaleString("en-GB", {
                  weekday: "short", day: "numeric", month: "short",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </label>

            <label className="block mb-5">
              <span className="text-[11px] font-bold font-headline uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                Why — your participants read this
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. I woke up with a fever and cannot host tonight."
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={{ border: "1px solid rgba(15,34,41,0.15)", color: "#0F2229" }}
              />
              {!reasonOk && reason.length > 0 && (
                <span className="block mt-1 text-[11px]" style={{ color: "#b42318" }}>
                  Give them a real sentence.
                </span>
              )}
            </label>

            {error && (
              <p className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "rgba(180,35,24,0.08)", color: "#b42318" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="flex-1 py-3 rounded-full text-sm font-bold font-headline"
                style={{ color: "#64748b", border: "1px solid rgba(15,34,41,0.12)" }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!reasonOk || !startOk || busy}
                className="flex-1 py-3 rounded-full text-white text-sm font-bold font-headline disabled:opacity-40"
                style={{ backgroundColor: "#FF6130" }}
              >
                {busy ? "Moving…" : "Move & notify"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
