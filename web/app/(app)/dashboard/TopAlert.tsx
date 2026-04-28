import Link from "next/link";

/**
 * Top alert — sits above everything else on the dashboard. Reserved
 * for time-critical signals that interrupt regardless of what else
 * is going on:
 *
 *   1. live           — session already live → "Enter session"
 *   2. go-live-soon   — session starts in ≤15 min → "Go live"
 *
 * Pending collaboration invites are NOT here — they're handled by
 * the page renderer, which places them above-or-below the active
 * program card depending on whether the creator already has one.
 *
 * Renders nothing when neither signal is present.
 */

interface Props {
  liveSession: { id: string; title: string } | null;
  goLiveSoonSession: { id: string; title: string; startTime: string } | null;
}

function minutesUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

function Banner({
  href,
  pulseColor,
  label,
  title,
  cta,
}: {
  href: string;
  pulseColor: string;
  label: string;
  title: string;
  cta: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden p-5 md:p-6 mb-6 flex items-center justify-between gap-4"
      style={{
        backgroundColor: "#0F2229",
        boxShadow: "0 4px 20px rgba(15,34,41,0.25)",
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: pulseColor }}
          />
          <span
            className="text-[10px] uppercase tracking-widest font-headline"
            style={{ color: pulseColor, fontWeight: 700 }}
          >
            {label}
          </span>
        </div>
        <h2
          className="text-base md:text-lg font-headline tracking-tight text-white truncate"
          style={{ fontWeight: 700 }}
        >
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="shrink-0 px-5 md:px-6 py-2.5 md:py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
        style={{
          backgroundColor: "#FF6130",
          fontWeight: 700,
          boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

export function TopAlert({ liveSession, goLiveSoonSession }: Props) {
  if (liveSession) {
    return (
      <Banner
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
      <Banner
        href={`/dashboard/sessions/${goLiveSoonSession.id}`}
        pulseColor="#FF6130"
        label={`Ready to go live${m > 0 ? ` · in ${m}m` : ""}`}
        title={goLiveSoonSession.title}
        cta="Go live →"
      />
    );
  }
  return null;
}
