import Link from "next/link";

/**
 * Active Program Card — the central hero of the pilot dashboard.
 *
 * One creator → one active joint challenge during the pilot. This
 * card is THE focal point of the dashboard: cover thumbnail + title
 * + partner with parity + stage-specific status + 1-3 stage-aware
 * action buttons.
 *
 * Stages it handles:
 *   - drafting-solo:           partner invited, hasn't accepted yet
 *   - drafting-jointly:        both creators in the workspace
 *   - awaiting-signatures:     contract locked, signatures pending
 *   - published-pre-launch:    published, before start_date
 *   - published-live:          between start_date and end_date
 *   - completed:               past end_date
 *
 * Empty state (no program at all): replaces the card with a soft
 * "Start your first collaboration" hero featuring the user's
 * avatar + a dashed `+` placeholder for the partner-to-be — the
 * same visual scene used on /dashboard/create. Brand continuity,
 * and the empty state is itself a teaching moment.
 */

export type ProgramStage =
  | "drafting-solo"
  | "drafting-jointly"
  | "awaiting-signatures"
  | "published-pre-launch"
  | "published-live"
  | "completed";

interface Program {
  id: string;
  title: string;
  imageUrl: string | null;
  stage: ProgramStage;
  startDate: string | null;
  endDate: string | null;
  isOwner: boolean;
  spaceId?: string | null;
  // Optional metrics for live programs (Bundle 2 will populate)
  enrolledCount?: number;
  earningsCents?: number;
}

interface Partner {
  name: string;
  avatar: string | null;
  pendingInvite: boolean;
}

interface UserProfile {
  avatar: string | null;
  initial: string;
}

interface Props {
  program: Program | null;
  partner: Partner | null;
  user: UserProfile;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function totalWeeks(startIso: string | null, endIso: string | null): number {
  if (!startIso || !endIso) return 0;
  const s = new Date(startIso);
  const e = new Date(endIso);
  const days = Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.ceil(days / 7));
}

function currentWeek(startIso: string | null): number {
  if (!startIso) return 1;
  const s = new Date(startIso);
  s.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((t.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

// ─── Empty state ─────────────────────────────────────────────

function EmptyState({ user }: { user: UserProfile }) {
  return (
    <div
      className="rounded-3xl p-8 md:p-10 infitra-card"
      style={{ border: "1px solid rgba(255,97,48,0.20)" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.25em] font-headline mb-4"
        style={{ color: "#FF6130", fontWeight: 700 }}
      >
        Start your first collaboration
      </p>

      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar parity scene — your avatar + dashed partner placeholder */}
        <div className="flex items-center -space-x-3 shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-14 h-14 rounded-full object-cover relative z-10"
              style={{ border: "3px solid #FFFFFF", boxShadow: "0 4px 12px rgba(255,97,48,0.18)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center relative z-10"
              style={{
                border: "3px solid #FFFFFF",
                backgroundColor: "rgba(255,97,48,0.18)",
                boxShadow: "0 4px 12px rgba(255,97,48,0.18)",
              }}
            >
              <span className="text-base font-headline" style={{ color: "#FF6130", fontWeight: 700 }}>
                {user.initial}
              </span>
            </div>
          )}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              border: "3px dashed rgba(255,97,48,0.45)",
              backgroundColor: "rgba(255,97,48,0.04)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6130" strokeWidth={2.2} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl md:text-3xl font-headline tracking-tight mb-2"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Build a program with another expert.
          </h2>
          <p className="text-sm md:text-base mb-5" style={{ color: "#64748b" }}>
            Co-create one live program with a complementary creator, sell it as
            one product, split revenue cleanly. Pilot is 5 pairs in DACH.
          </p>
          <Link
            href="/dashboard/create"
            className="inline-block px-6 py-3 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: "#FF6130",
              fontWeight: 700,
              boxShadow:
                "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            Invite a creator →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Stage-specific content ──────────────────────────────────

function StageBadge({ stage }: { stage: ProgramStage }) {
  const config: Record<ProgramStage, { label: string; bg: string; color: string; border: string }> = {
    "drafting-solo": {
      label: "Awaiting partner",
      bg: "rgba(255,97,48,0.10)",
      color: "#FF6130",
      border: "rgba(255,97,48,0.25)",
    },
    "drafting-jointly": {
      label: "Drafting",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.25)",
    },
    "awaiting-signatures": {
      label: "Awaiting signatures",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.25)",
    },
    "published-pre-launch": {
      label: "Pre-launch",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.25)",
    },
    "published-live": {
      label: "Live",
      bg: "rgba(21,128,61,0.10)",
      color: "#15803d",
      border: "rgba(21,128,61,0.25)",
    },
    completed: {
      label: "Completed",
      bg: "rgba(15,34,41,0.06)",
      color: "#475569",
      border: "rgba(15,34,41,0.12)",
    },
  };
  const c = config[stage];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-headline"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}`, fontWeight: 700 }}
    >
      {stage === "published-live" && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: c.color }}
        />
      )}
      {c.label}
    </span>
  );
}

function StageMetaLine({ program }: { program: Program }) {
  const parts: string[] = [];

  if (program.stage === "published-live" && program.startDate && program.endDate) {
    const cw = currentWeek(program.startDate);
    const tw = totalWeeks(program.startDate, program.endDate);
    parts.push(`Week ${cw} of ${tw}`);
  } else if (program.stage === "published-pre-launch" && program.startDate) {
    parts.push(`Launches ${formatDate(program.startDate)}`);
  } else if (program.stage === "completed" && program.endDate) {
    parts.push(`Ended ${formatDate(program.endDate)}`);
  } else if (program.stage === "drafting-solo") {
    parts.push("Waiting for your collaborator to accept");
  } else if (program.stage === "drafting-jointly") {
    parts.push("Drafting together in the workspace");
  } else if (program.stage === "awaiting-signatures") {
    parts.push("Contract locked, signatures pending");
  }

  if (program.stage === "published-live" || program.stage === "published-pre-launch") {
    if (program.enrolledCount !== undefined) {
      parts.push(`${program.enrolledCount} enrolled`);
    }
  }
  if ((program.stage === "published-live" || program.stage === "completed") && program.earningsCents) {
    parts.push(`${formatMoney(program.earningsCents)} earned`);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-sm" style={{ color: "#64748b" }}>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>}
          {p}
        </span>
      ))}
    </p>
  );
}

function StageActions({ program }: { program: Program }) {
  // Map each stage to its 1-3 action buttons. Primary action first,
  // secondaries after.
  const orange =
    "px-5 py-2.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02]";
  const orangeStyle: React.CSSProperties = {
    backgroundColor: "#FF6130",
    fontWeight: 700,
    boxShadow:
      "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
  };
  const cyan =
    "px-5 py-2.5 rounded-full text-sm font-headline transition-transform hover:scale-[1.02]";
  const cyanStyle: React.CSSProperties = {
    color: "#0891b2",
    border: "1.5px solid #9CF0FF",
    backgroundColor: "rgba(156,240,255,0.08)",
    fontWeight: 700,
  };

  const workspaceHref = `/dashboard/collaborate/${program.id}`;
  const publicHref = `/challenges/${program.id}`;
  const contractHref = `/dashboard/collaborate/${program.id}/contract`;

  switch (program.stage) {
    case "drafting-solo":
    case "drafting-jointly":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={workspaceHref} className={orange} style={orangeStyle}>
            Open workspace
          </Link>
        </div>
      );
    case "awaiting-signatures":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={workspaceHref} className={orange} style={orangeStyle}>
            Review contract
          </Link>
        </div>
      );
    case "published-pre-launch":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={publicHref} className={orange} style={orangeStyle}>
            Open public page
          </Link>
          <Link href={workspaceHref} className={cyan} style={cyanStyle}>
            Open workspace
          </Link>
        </div>
      );
    case "published-live":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={publicHref} className={orange} style={orangeStyle}>
            Open public page
          </Link>
          <Link href={workspaceHref} className={cyan} style={cyanStyle}>
            Open workspace
          </Link>
          <Link href={contractHref} className={cyan} style={cyanStyle}>
            View contract
          </Link>
        </div>
      );
    case "completed":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={publicHref} className={cyan} style={cyanStyle}>
            Open program
          </Link>
          <Link href={contractHref} className={cyan} style={cyanStyle}>
            View contract
          </Link>
        </div>
      );
  }
}

// ─── Main component ──────────────────────────────────────────

export function ActiveProgramCard({ program, partner, user }: Props) {
  if (!program) {
    return <EmptyState user={user} />;
  }

  return (
    <div
      className="rounded-3xl p-6 md:p-7 infitra-card"
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Header: cover thumbnail + title block + stage badge */}
      <div className="flex items-start gap-4 mb-5">
        {/* Cover thumbnail */}
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt=""
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shrink-0 flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.18) 0%, rgba(8,145,178,0.18) 100%)",
            }}
          >
            <span className="text-2xl font-headline" style={{ color: "#0F2229", fontWeight: 700 }}>
              {program.title?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}

        {/* Title + partner row + stage */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2
              className="text-xl md:text-2xl font-headline tracking-tight"
              style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {program.title || "Untitled"}
            </h2>
            <div className="shrink-0">
              <StageBadge stage={program.stage} />
            </div>
          </div>

          {/* Partner row — visual parity */}
          {partner && (
            <div className="flex items-center gap-2 mt-2">
              {partner.avatar ? (
                <img
                  src={partner.avatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                  style={{
                    border: "1.5px solid #FFFFFF",
                    opacity: partner.pendingInvite ? 0.5 : 1,
                  }}
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    border: "1.5px solid #FFFFFF",
                    backgroundColor: "rgba(8,145,178,0.18)",
                    opacity: partner.pendingInvite ? 0.5 : 1,
                  }}
                >
                  <span className="text-[10px] font-headline" style={{ color: "#0891b2", fontWeight: 700 }}>
                    {partner.name[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
              <span
                className="text-xs md:text-sm"
                style={{ color: partner.pendingInvite ? "#94a3b8" : "#475569", fontWeight: 600 }}
              >
                {partner.pendingInvite ? "with" : "with"}{" "}
                <span style={{ color: partner.pendingInvite ? "#94a3b8" : "#0F2229", fontWeight: 700 }}>
                  {partner.name}
                </span>
                {partner.pendingInvite && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-widest" style={{ color: "#FF6130", fontWeight: 700 }}>
                    · invite pending
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Meta line — stage-specific summary */}
      <div className="mb-5">
        <StageMetaLine program={program} />
      </div>

      {/* Action buttons */}
      <StageActions program={program} />
    </div>
  );
}
