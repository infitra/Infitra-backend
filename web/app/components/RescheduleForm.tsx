"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RescheduleForm({
  sessionId,
  currentStartTime,
}: {
  sessionId: string;
  currentStartTime: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReschedule() {
    if (!date || !time || !reason.trim()) {
      setError("Date, time, and reason are required.");
      return;
    }

    const newStart = new Date(`${date}T${time}`);
    if (isNaN(newStart.getTime())) {
      setError("Invalid date or time.");
      return;
    }
    if (newStart <= new Date()) {
      setError("New time must be in the future.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "reschedule_published_session",
      {
        p_session: sessionId,
        p_new_start_time: newStart.toISOString(),
        p_change_reason: reason.trim(),
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.refresh(), 1000);
  }

  if (success) {
    return (
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: "rgba(16, 185, 129, 0.10)",
          border: "1px solid rgba(16, 185, 129, 0.30)",
        }}
      >
        <p
          className="text-sm font-bold font-headline"
          style={{ color: "#047857" }}
        >
          Session rescheduled
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold font-headline transition-colors hover:opacity-80"
        style={{ color: "#64748b" }}
      >
        Reschedule session
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    border: "1px solid rgba(15, 34, 41, 0.15)",
    color: "#0F2229",
  };

  return (
    <div className="p-4 rounded-xl infitra-glass space-y-3">
      <p
        className="text-xs font-bold uppercase tracking-wider font-headline"
        style={{ color: "rgba(15, 34, 41, 0.55)" }}
      >
        Reschedule
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={inputStyle}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm focus:outline-none"
          style={inputStyle}
        />
      </div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rescheduling"
        maxLength={500}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={inputStyle}
      />
      {error && (
        <p className="text-xs" style={{ color: "#FF6130" }}>
          {error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReschedule}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-white text-xs font-bold font-headline disabled:opacity-50"
          style={{
            backgroundColor: "#FF6130",
            boxShadow: "0 4px 14px rgba(255,97,48,0.30)",
          }}
        >
          {loading ? "Saving..." : "Confirm Reschedule"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="px-4 py-2 text-xs font-headline transition-colors hover:opacity-80"
          style={{ color: "#64748b" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
