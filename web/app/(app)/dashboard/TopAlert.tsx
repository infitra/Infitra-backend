import { LiveSessionBanner } from "@/app/components/LiveSessionBanner";

/**
 * Top alert — sits above everything else on the dashboard. Reserved
 * for time-critical signals that interrupt regardless of what else
 * is going on:
 *
 *   1. live           — session already live → "Enter session"
 *   2. go-live-soon   — room provisioned or T-15 reached → "Go live"
 *
 * Pending collaboration invites are NOT here — they're handled by
 * the page renderer, which places them above-or-below the active
 * program card depending on whether the creator already has one.
 *
 * The visual is the shared LiveSessionBanner (one design for "a room
 * is open", on every surface). Renders nothing when neither signal
 * is present.
 */

interface Props {
  liveSession: { id: string; title: string } | null;
  goLiveSoonSession: { id: string; title: string; startTime: string } | null;
}

function minutesUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

export function TopAlert({ liveSession, goLiveSoonSession }: Props) {
  if (liveSession) {
    return (
      <LiveSessionBanner
        href={`/dashboard/sessions/${liveSession.id}/live`}
        pulseColor="#ef4444"
        label="Live now"
        title={liveSession.title}
        cta="Enter session →"
      />
    );
  }
  if (goLiveSoonSession) {
    const m = minutesUntil(goLiveSoonSession.startTime);
    return (
      <LiveSessionBanner
        href={`/dashboard/sessions/${goLiveSoonSession.id}/live`}
        pulseColor="#FF6130"
        label={`Ready to go live${m > 0 ? ` · in ${m}m` : ""}`}
        title={goLiveSoonSession.title}
        cta="Go live →"
      />
    );
  }
  return null;
}
