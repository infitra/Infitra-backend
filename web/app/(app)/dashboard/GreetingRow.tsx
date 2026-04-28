/**
 * Greeting row — top of the pilot dashboard. No card, just typography.
 *
 * Replaces the giant CreatorIdentitySection that used to dominate the
 * top of the dashboard. The whole point of the pilot dashboard is
 * action focus, not a vanity profile card. So identity gets one line:
 *
 *   "Morning, Lara — Week 2 of Strong Together with Mia"
 *
 * It anchors all three things (you, your program, your partner) in
 * a sentence and gets out of the way. No avatar, no badges, no
 * stats. The user sees their first action card under it within a
 * few hundred pixels.
 *
 * Variants based on lifecycle stage:
 *   - No program / drafting       → just "Morning, Lara"
 *   - Pre-launch (≤14 days out)   → "...your program launches in N days"
 *   - Live (between dates)        → "Week N of {title} with {partner}"
 *   - Live, solo (no partner)     → "Week N of {title}"
 *   - Completed                   → "Morning, Lara"
 */

interface Props {
  name: string;
  programTitle?: string | null;
  partnerName?: string | null;
  startDate?: string | null; // ISO date (YYYY-MM-DD)
  endDate?: string | null;
  stage:
    | "drafting-solo"
    | "drafting-jointly"
    | "awaiting-signatures"
    | "published-pre-launch"
    | "published-live"
    | "completed"
    | "none";
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function weekNumber(startIso: string): number {
  const start = new Date(startIso);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

export function GreetingRow({
  name,
  programTitle,
  partnerName,
  startDate,
  endDate,
  stage,
}: Props) {
  const greeting = timeOfDayGreeting();
  const firstName = name.split(" ")[0] || name;

  let suffix: React.ReactNode = null;
  if (stage === "published-live" && programTitle && startDate) {
    const wn = weekNumber(startDate);
    suffix = (
      <>
        {" — Week "}
        <span style={{ color: "#0F2229", fontWeight: 700 }}>{wn}</span>
        {" of "}
        <span style={{ color: "#0F2229", fontWeight: 700 }}>{programTitle}</span>
        {partnerName ? (
          <>
            {" with "}
            <span style={{ color: "#0F2229", fontWeight: 700 }}>{partnerName}</span>
          </>
        ) : null}
      </>
    );
  } else if (stage === "published-pre-launch" && programTitle && startDate) {
    const d = daysUntil(startDate);
    if (d > 0) {
      suffix = (
        <>
          {" — "}
          <span style={{ color: "#0F2229", fontWeight: 700 }}>{programTitle}</span>
          {" launches in "}
          <span style={{ color: "#FF6130", fontWeight: 700 }}>
            {d} {d === 1 ? "day" : "days"}
          </span>
        </>
      );
    } else {
      suffix = (
        <>
          {" — "}
          <span style={{ color: "#0F2229", fontWeight: 700 }}>{programTitle}</span>
          {" is published"}
        </>
      );
    }
  }
  // Drafting / awaiting-signatures / completed / none → no suffix.
  // Those states are addressed in the Pulse + Active Program cards
  // below; the greeting stays clean.

  return (
    <div className="mb-8">
      <p
        className="text-2xl md:text-3xl font-headline tracking-tight leading-tight"
        style={{ color: "#475569", letterSpacing: "-0.02em" }}
      >
        {greeting}, <span style={{ color: "#0F2229", fontWeight: 700 }}>{firstName}</span>
        {suffix}
      </p>
    </div>
  );
}
