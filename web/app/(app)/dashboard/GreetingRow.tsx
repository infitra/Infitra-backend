/**
 * Greeting row — top of the pilot dashboard.
 *
 * Avatar inline with the greeting text so the dashboard reads as
 * "this is your home" rather than "a status page". No card, no big
 * stats grid — just enough personal anchor:
 *
 *   [Avatar]  Morning, Yves
 *             Passionate Trainer focused on longevity!
 *             ─── Week 2 of Strong Together with Mia
 *
 * Lifecycle-aware: program reference only appears for live and
 * pre-launch states (where there's something specific to anchor on);
 * the drafting and completed states keep the line clean — those
 * stages are addressed by the Active Program card directly below.
 */

interface Props {
  name: string;
  avatarUrl?: string | null;
  tagline?: string | null;
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
  avatarUrl,
  tagline,
  programTitle,
  partnerName,
  startDate,
  stage,
}: Props) {
  const greeting = timeOfDayGreeting();
  const firstName = name.split(" ")[0] || name;
  const initial = firstName[0]?.toUpperCase() ?? "?";

  let programLine: React.ReactNode = null;
  if (stage === "published-live" && programTitle && startDate) {
    const wn = weekNumber(startDate);
    programLine = (
      <>
        Week <span style={{ color: "#0F2229", fontWeight: 700 }}>{wn}</span> of{" "}
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
      programLine = (
        <>
          <span style={{ color: "#0F2229", fontWeight: 700 }}>{programTitle}</span> launches in{" "}
          <span style={{ color: "#FF6130", fontWeight: 700 }}>
            {d} {d === 1 ? "day" : "days"}
          </span>
        </>
      );
    } else {
      programLine = (
        <>
          <span style={{ color: "#0F2229", fontWeight: 700 }}>{programTitle}</span> is published
        </>
      );
    }
  }

  return (
    <div className="mb-8 flex items-start gap-4">
      {/* Avatar — the personal anchor */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full object-cover"
          style={{
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 4px 12px rgba(15,34,41,0.10)",
          }}
        />
      ) : (
        <div
          className="shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,97,48,0.18)",
            border: "2px solid rgba(255,255,255,0.85)",
            boxShadow: "0 4px 12px rgba(15,34,41,0.10)",
          }}
        >
          <span className="text-lg font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>
            {initial}
          </span>
        </div>
      )}

      {/* Text block */}
      <div className="min-w-0 flex-1">
        <p
          className="text-2xl md:text-3xl font-headline tracking-tight leading-tight"
          style={{ color: "#475569", letterSpacing: "-0.02em" }}
        >
          {greeting},{" "}
          <span style={{ color: "#0F2229", fontWeight: 700 }}>{firstName}</span>
        </p>
        {tagline ? (
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {tagline}
          </p>
        ) : null}
        {programLine ? (
          <p className="text-sm md:text-base mt-2" style={{ color: "#475569" }}>
            <span className="mr-2" style={{ color: "rgba(8,145,178,0.55)" }}>
              ───
            </span>
            {programLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
