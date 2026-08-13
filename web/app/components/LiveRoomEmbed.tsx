"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { DailyRoom } from "@/app/components/DailyRoom";

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
  backHref,
}: {
  sessionId: string;
  sessionTitle: string;
  isHost: boolean;
  /** Where "Leave" / "Go back" returns to — the creator's workspace or the
   *  participant's Experience Space, resolved by the live page. */
  backHref: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  // The provider seam: the token endpoint names the provider; this shell
  // mounts the matching room component and stays provider-neutral itself.
  const [provider, setProvider] = useState<string>("daily");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  // Room callbacks fire from inside the call's own lifecycle — they must
  // read CURRENT status, not the render they were created in.
  const statusRef = useRef<Status>("loading");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const fetchToken = useCallback(async () => {
    setStatus("loading");
    setError(null);

    // Every failure leaves a trace. Tim's mobile join failed on 2 Aug and
    // we could not diagnose it afterwards because nothing recorded what he
    // saw — a live room failing silently is the one INFITRA promise that
    // must never fail silently again.
    const fail = (reason: string) => {
      setError(reason);
      setStatus("error");
      trackEvent("Join Failed", { session: sessionId, reason });
    };

    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke(
        "issue_join_token",
        { body: { session_id: sessionId } }
      );

      if (fnError) return fail(fnError.message || "Failed to connect.");
      if (data?.error) return fail(data.error);
      if (!data?.room_url) return fail("No room URL returned.");

      setRoomUrl(data.room_url);
      setProvider(typeof data.provider === "string" ? data.provider : "daily");
      setStatus("ready");
      trackEvent("Join Live", { session: sessionId });
    } catch (err: any) {
      fail(err?.message || "Something went wrong.");
    }
  }, [sessionId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // ── In-room lifecycle (the old iframe was a sealed box: none of this
  //    was knowable, which is why Tim's failure took nine days) ──
  const handleRoomJoined = useCallback(() => {
    trackEvent("Room Joined", { session: sessionId });
  }, [sessionId]);

  const handleCameraError = useCallback(
    (message: string) => {
      // Daily shows its own permission-recovery UI; we just leave a trace.
      trackEvent("Room Camera Error", { session: sessionId, reason: message });
    },
    [sessionId],
  );

  const handleRoomFatal = useCallback(
    (message: string) => {
      trackEvent("Join Failed", { session: sessionId, reason: message });
      setError(message);
      setStatus("error");
    },
    [sessionId],
  );

  const handleRoomEnded = useCallback(() => {
    // If THIS user pressed End, the summary flow owns the transition.
    if (statusRef.current === "ending" || statusRef.current === "ended") return;
    trackEvent("Room Ended Remotely", { session: sessionId });
    // The loop closes for everyone at once: an expert ends the session,
    // and every participant lands in the reflection — same door as Leave.
    if (isHost) router.push(backHref);
    else router.push(`${backHref}?reflect=${sessionId}`);
  }, [sessionId, isHost, backHref, router]);

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
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ backgroundColor: "#F2EFE8" }}
      >
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{
              borderColor: "rgba(8, 145, 178, 0.20)",
              borderTopColor: "#0891b2",
            }}
          />
          <p className="text-sm font-headline" style={{ color: "#64748b" }}>
            Connecting to session...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────
  if (status === "error") {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        style={{ backgroundColor: "#F2EFE8" }}
      >
        <div className="max-w-md w-full p-8 rounded-2xl infitra-glass text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: "rgba(255, 97, 48, 0.10)",
              border: "1px solid rgba(255, 97, 48, 0.30)",
            }}
          >
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
          <h2
            className="text-xl font-black font-headline mb-2"
            style={{ color: "#0F2229" }}
          >
            Connection failed
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchToken}
              className="w-full py-3 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform"
              style={{
                backgroundColor: "#FF6130",
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }}
            >
              Try Again
            </button>
            <Link
              href={backHref}
              className="w-full py-3 rounded-full text-sm font-bold font-headline text-center transition-colors hover:opacity-80"
              style={{
                color: "#475569",
                backgroundColor: "rgba(255, 255, 255, 0.78)",
                border: "1px solid rgba(15, 34, 41, 0.15)",
              }}
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
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        style={{ backgroundColor: "#F2EFE8" }}
      >
        <div className="max-w-md w-full p-8 rounded-2xl infitra-glass text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.30)",
            }}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="#047857"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2
            className="text-2xl font-black font-headline mb-4"
            style={{ color: "#0F2229" }}
          >
            Session Ended
          </h2>
          {summary && (
            <div className="space-y-1 mb-6">
              {summary.title && (
                <p className="text-sm" style={{ color: "#0F2229" }}>
                  {summary.title}
                </p>
              )}
              {summary.duration_min != null && (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {summary.duration_min} minutes
                </p>
              )}
              {summary.attendees != null && (
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {summary.attendees} attendee
                  {summary.attendees !== 1 ? "s" : ""}
                </p>
              )}
              {summary.net_earned != null && summary.net_earned > 0 && (
                <p
                  className="text-sm font-bold"
                  style={{ color: "#047857" }}
                >
                  CHF {(summary.net_earned / 100).toFixed(2)} earned
                </p>
              )}
            </div>
          )}
          <Link
            href={isHost ? backHref : `${backHref}?reflect=${sessionId}`}
            className="inline-block px-6 py-3 rounded-full text-white text-sm font-black font-headline hover:scale-[1.02] transition-transform"
            style={{
              backgroundColor: "#FF6130",
              boxShadow:
                "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            {isHost ? "Back to workspace" : "Back to your Experience"}
          </Link>
        </div>
      </div>
    );
  }

  // ── Ready (iframe) ─────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: "#F2EFE8" }}
    >
      {/* Top bar */}
      <div
        className="h-14 flex items-center justify-between px-6 shrink-0 border-b"
        style={{
          backgroundColor: "rgba(242, 239, 232, 0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(15, 34, 41, 0.10)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* The room is an INFITRA room: mark + wordmark carry the brand
              in the chrome (the call canvas itself is Daily Prebuilt and
              can only be themed, not logo'd). Wordmark hides on phones —
              the session title is the scarcer resource there. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt="INFITRA"
            width={28}
            height={28}
            className="block rounded-lg shrink-0"
          />
          <span
            className="hidden md:block text-[17px] tracking-tight font-headline leading-none shrink-0"
            style={{ color: "#FF6130", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            INFITRA
          </span>
          <span className="hidden md:block w-px h-5 shrink-0" style={{ backgroundColor: "rgba(15,34,41,0.12)" }} />
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <h1
            className="text-sm font-bold font-headline truncate"
            style={{ color: "#0F2229" }}
          >
            {sessionTitle}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Escape hatch: the same room, full-page in the native browser.
              An iframe is where mobile video goes to die quietly (permission
              prompts, Low Power Mode autoplay, WebKit quirks) — Daily's
              prebuilt as a first-class page is far more forgiving. If the
              embed shows a black box, this link is the user's way out. */}
          <a
            href={roomUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("Join Fallback", { session: sessionId })}
            className="hidden sm:inline text-xs font-bold font-headline transition-opacity hover:opacity-70"
            style={{ color: "#0891b2" }}
            title="Open the room as its own page — use this if the video here stays black"
          >
            Open in browser tab
          </a>
          <a
            href={roomUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("Join Fallback", { session: sessionId })}
            className="sm:hidden text-xs font-bold font-headline"
            style={{ color: "#0891b2" }}
            aria-label="Open the room in a browser tab"
          >
            Open in tab
          </a>
          {isHost ? (
            <>
              {/* Leaving is not ending: an expert can step out (their own
                  connection, their own reasons) without closing the room
                  for everyone. End Session stays the deliberate, confirmed
                  act; the room survives a departed expert. */}
              <Link
                href={backHref}
                className="px-4 py-2 rounded-full text-xs font-bold font-headline transition-colors hover:opacity-80"
                style={{
                  color: "#475569",
                  backgroundColor: "rgba(255, 255, 255, 0.78)",
                  border: "1px solid rgba(15, 34, 41, 0.15)",
                }}
              >
                Leave
              </Link>
              <button
                onClick={handleEndSession}
                disabled={status === "ending"}
                className="px-4 py-2 rounded-full text-xs font-bold font-headline transition-colors disabled:opacity-50 hover:opacity-80"
                style={{
                  color: "#be123c",
                  backgroundColor: "rgba(244, 63, 94, 0.08)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                }}
              >
                {status === "ending" ? "Ending..." : "End Session"}
              </button>
            </>
          ) : (
            // The loop, not a render: leaving the room lands on the space
            // with the reflection already open (?reflect= → modal). Asking
            // "how was it?" belongs to the moment of walking out.
            <Link
              href={`${backHref}?reflect=${sessionId}`}
              className="px-4 py-2 rounded-full text-xs font-bold font-headline transition-colors hover:opacity-80"
              style={{
                color: "#475569",
                backgroundColor: "rgba(255, 255, 255, 0.78)",
                border: "1px solid rgba(15, 34, 41, 0.15)",
              }}
            >
              Leave
            </Link>
          )}
        </div>
      </div>

      {/* The room itself, behind the provider seam: the token endpoint
          names the provider, this shell stays neutral. Unknown providers
          fall back to a plain iframe of the room URL — degraded (no
          telemetry, no theme) but functional. */}
      {provider === "daily" ? (
        <DailyRoom
          roomUrl={roomUrl!}
          onJoined={handleRoomJoined}
          onEnded={handleRoomEnded}
          onFatalError={handleRoomFatal}
          onCameraError={handleCameraError}
        />
      ) : (
        <iframe
          src={roomUrl!}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 w-full border-0"
        />
      )}
    </div>
  );
}
