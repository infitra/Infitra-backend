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
      <div className="p-4 rounded-xl bg-green-400/8 border border-green-400/20">
        <p className="text-sm font-bold text-green-400 font-headline">
          Session rescheduled
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-[#9CF0FF]/30 hover:text-[#9CF0FF] font-headline transition-colors"
      >
        Reschedule session
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#0F2229] border border-[#9CF0FF]/10 space-y-3">
      <p className="text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider font-headline">
        Reschedule
      </p>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#071318] border border-[#9CF0FF]/15 text-white text-sm focus:border-[#9CF0FF]/40 focus:outline-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#071318] border border-[#9CF0FF]/15 text-white text-sm focus:border-[#9CF0FF]/40 focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rescheduling"
        maxLength={500}
        className="w-full px-3 py-2 rounded-lg bg-[#071318] border border-[#9CF0FF]/15 text-white text-sm placeholder:text-[#9CF0FF]/20 focus:border-[#9CF0FF]/40 focus:outline-none"
      />
      {error && <p className="text-xs text-[#FF6130]">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleReschedule}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#FF6130] text-white text-xs font-bold font-headline disabled:opacity-50"
        >
          {loading ? "Saving..." : "Confirm Reschedule"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="px-4 py-2 text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] font-headline transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
