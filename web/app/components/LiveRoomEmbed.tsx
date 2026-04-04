"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "ready" | "ending" | "ended" | "error";

interface Summary {
  title?: string | null;
  duration_min?: number | null;
  net_earned?: number | null;
  attendees?: number | null;
}

export function LiveRoomEmbed({
  sessionId,
  sessionTitle,
  isHost,
}: {
  sessionId: string;
  sessionTitle: string;
  isHost: boolean;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const backPath = isHost
    ? `/dashboard/sessions/${sessionId}`
    : `/sessions/${sessionId}`;

  const fetchToken = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "issue_join_token",
        { body: { session_id: sessionId } }
      );

      if (fnError) {
        setError(fnError.message || "Failed to connect.");
        setStatus("error");
        return;
      }
      if (data?.error) {
        setError(data.error);
        setStatus("error");
        return;
      }
      if (!data?.room_url) {
        setError("No room URL returned.");
        setStatus("error");
        return;
      }

      setRoomUrl(data.room_url);
      setStatus("ready");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setStatus("error");
    }
  }, [sessionId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  async function handleEndSession() {
    if (!window.confirm("End this session for all participants?")) return;
    setStatus("ending");

    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "end_session",
        { body: { session_id: sessionId } }
      );

      if (fnError) {
        setError(fnError.message || "Failed to end session.");
        setStatus("error");
        return;
      }
      if (data?.code && data.code >= 400) {
        setError(data.message || "Failed to end session.");
        setStatus("error");
        return;
      }

      setSummary(data?.metadata ?? null);
      setStatus("ended");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setStatus("error");
    }
  }

  // ── Loading ────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#071318] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#9CF0FF]/30 border-t-[#9CF0FF] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#9CF0FF]/50 font-headline">
            Connecting to session...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#071318] flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0F2229] border border-[#FF6130]/20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF6130]/10 border border-[#FF6130]/20 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#FF6130"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white font-headline mb-2">
            Connection failed
          </h2>
          <p className="text-sm text-[#9CF0FF]/50 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchToken}
              className="w-full py-3 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform"
            >
              Try Again
            </button>
            <Link
              href={backPath}
              className="w-full py-3 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 text-sm font-bold text-[#9CF0FF]/50 font-headline text-center hover:text-[#9CF0FF] transition-colors"
            >
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Ended ──────────────────────────────────────────────
  if (status === "ended") {
    return (
      <div className="fixed inset-0 z-[100] bg-[#071318] flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 text-center">
          <div className="w-14 h-14 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#4ade80"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white font-headline mb-4">
            Session Ended
          </h2>
          {summary && (
            <div className="space-y-1 mb-6">
              {summary.title && (
                <p className="text-sm text-[#9CF0FF]/50">{summary.title}</p>
              )}
              {summary.duration_min != null && (
                <p className="text-sm text-[#9CF0FF]/40">
                  {summary.duration_min} minutes
                </p>
              )}
              {summary.attendees != null && (
                <p className="text-sm text-[#9CF0FF]/40">
                  {summary.attendees} attendee
                  {summary.attendees !== 1 ? "s" : ""}
                </p>
              )}
              {summary.net_earned != null && summary.net_earned > 0 && (
                <p className="text-sm font-bold text-green-400">
                  CHF {(summary.net_earned / 100).toFixed(2)} earned
                </p>
              )}
            </div>
          )}
          <Link
            href={backPath}
            className="inline-block px-6 py-3 rounded-full bg-[#FF6130] text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform"
          >
            {isHost ? "Back to Dashboard" : "Back to Session"}
          </Link>
        </div>
      </div>
    );
  }

  // ── Ready (iframe) ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-[#071318] flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-[#0F2229] border-b border-[#9CF0FF]/10 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <h1 className="text-sm font-bold text-white font-headline truncate">
            {sessionTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isHost ? (
            <button
              onClick={handleEndSession}
              disabled={status === "ending"}
              className="px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-xs font-bold text-red-400 font-headline hover:bg-red-500/25 transition-colors disabled:opacity-50"
            >
              {status === "ending" ? "Ending..." : "End Session"}
            </button>
          ) : (
            <Link
              href={backPath}
              className="px-4 py-2 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/15 text-xs font-bold text-[#9CF0FF]/50 font-headline hover:text-[#9CF0FF] transition-colors"
            >
              Leave
            </Link>
          )}
        </div>
      </div>

      {/* Daily.co iframe */}
      <iframe
        src={roomUrl!}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
