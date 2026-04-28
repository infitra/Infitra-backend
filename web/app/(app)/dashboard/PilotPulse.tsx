import Link from "next/link";
import { CollabInvitations } from "./CollabInvitations";

/**
 * Pilot Pulse — Layer A of the dashboard. The action layer.
 *
 * Surfaces the most pressing thing the creator should do right now,
 * and only that. When several signals exist, priority order:
 *
 *   1. live              — session already live → "Enter session"
 *   2. go-live-soon      — session starts in ≤15 min → "Go live"
 *   3. invite-received   — pending received invites → CollabInvitations card
 *
 * (Bundle 2 will add: contract-waits-on-me, ready-to-publish, session-recap-due.
 *  The slot for those is reserved between go-live-soon and invite-received.)
 *
 * If nothing pressing, the component renders nothing — the next visual
 * element (the Active Program card) becomes the page's natural focus.
 */

interface PendingInvite {
  id: string;
  fromName: string;
  fromAvatar: string | null;
  fromTagline: string | null;
  message: string;
  splitPercent: number;
  createdAt: string;
  challengeTitle: string | null;
  challengeImageUrl: string | null;
}

interface Props {
  liveSession: { id: string; title: string } | null;
  goLiveSoonSession: { id: string; title: string; startTime: string } | null;
  pendingReceivedInvites: PendingInvite[];
}

function minutesUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

export function PilotPulse({
  liveSession,
  goLiveSoonSession,
  pendingReceivedInvites,
}: Props) {
  // Priority 1: live session
  if (liveSession) {
    return (
      <div
        className="rounded-2xl overflow-hidden p-6 mb-6 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "#0F2229",
          boxShadow: "0 4px 20px rgba(15,34,41,0.25)",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#ef4444" }}
            />
            <span
              className="text-xs uppercase tracking-widest font-headline"
              style={{ color: "#ef4444", fontWeight: 700 }}
            >
              Live now
            </span>
          </div>
          <h2
            className="text-lg md:text-xl font-headline tracking-tight text-white truncate"
            style={{ fontWeight: 700 }}
          >
            {liveSession.title}
          </h2>
        </div>
        <Link
          href={`/dashboard/sessions/${liveSession.id}/live`}
          className="shrink-0 px-6 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: "#FF6130",
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
          }}
        >
          Enter session →
        </Link>
      </div>
    );
  }

  // Priority 2: about to go live
  if (goLiveSoonSession) {
    const m = minutesUntil(goLiveSoonSession.startTime);
    return (
      <div
        className="rounded-2xl overflow-hidden p-6 mb-6 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "#0F2229",
          boxShadow: "0 4px 20px rgba(15,34,41,0.25)",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "#FF6130" }}
            />
            <span
              className="text-xs uppercase tracking-widest font-headline"
              style={{ color: "#FF6130", fontWeight: 700 }}
            >
              Ready to go live
              {m > 0 && ` · in ${m}m`}
            </span>
          </div>
          <h2
            className="text-lg md:text-xl font-headline tracking-tight text-white truncate"
            style={{ fontWeight: 700 }}
          >
            {goLiveSoonSession.title}
          </h2>
        </div>
        <Link
          href={`/dashboard/sessions/${goLiveSoonSession.id}`}
          className="shrink-0 px-6 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: "#FF6130",
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
          }}
        >
          Go live →
        </Link>
      </div>
    );
  }

  // Priority 3: pending received invites
  if (pendingReceivedInvites.length > 0) {
    return (
      <div className="mb-6">
        <CollabInvitations invites={pendingReceivedInvites} />
      </div>
    );
  }

  return null;
}
