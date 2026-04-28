import Link from "next/link";

/**
 * Active Program Card — the central hero of the pilot dashboard.
 *
 * Visual design borrows from the section-4 mockup on the landing
 * page: cover image as a real banner inside the card, then title +
 * partner-with-parity + meta + actions below. Brand continuity from
 * the public landing through to the creator's home.
 *
 * Stage-aware actions — each lifecycle stage gets the buttons that
 * actually make sense for that stage. Critically, "Open workspace"
 * is NOT shown for published stages: workspace is for drafting, not
 * for managing a live program. Once published, the workspace link
 * disappears from the dashboard. (The workspace itself still has its
 * own lifecycle-aware affordances; that's polished separately.)
 *
 *   drafting-solo:       Open workspace
 *   drafting-jointly:    Open workspace
 *   awaiting-signatures: Review contract
 *   published-pre-launch: Open public page · View contract
 *   published-live:      Open challenge space · View contract
 *   completed:           Open challenge space · View contract
 *
 * Empty state (no program): replaces the banner with the avatar-
 * parity scene from the create page — your avatar + a dashed `+`
 * placeholder for the partner-to-be.
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
  return Math.max(
    1,
    Math.floor((t.getTime() - s.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
  );
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
        <div className="flex items-center -space-x-3 shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="w-14 h-14 rounded-full object-cover relative z-10"
              style={{
                border: "3px solid #FFFFFF",
                boxShadow: "0 4px 12px rgba(255,97,48,0.18)",
              }}
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
              <span
                className="text-base font-headline"
                style={{ color: "#FF6130", fontWeight: 700 }}
              >
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF6130"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
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

// ─── Stage badge ─────────────────────────────────────────────

function StageBadge({ stage }: { stage: ProgramStage }) {
  const config: Record<
    ProgramStage,
    { label: string; bg: string; color: string; border: string; pulse?: boolean }
  > = {
    "drafting-solo": {
      label: "Awaiting partner",
      bg: "rgba(255,97,48,0.10)",
      color: "#FF6130",
      border: "rgba(255,97,48,0.30)",
    },
    "drafting-jointly": {
      label: "Drafting",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.30)",
    },
    "awaiting-signatures": {
      label: "Awaiting signatures",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.30)",
    },
    "published-pre-launch": {
      label: "Pre-launch",
      bg: "rgba(8,145,178,0.10)",
      color: "#0891b2",
      border: "rgba(8,145,178,0.30)",
    },
    "published-live": {
      label: "Live",
      bg: "rgba(21,128,61,0.12)",
      color: "#15803d",
      border: "rgba(21,128,61,0.35)",
      pulse: true,
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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-headline backdrop-blur-sm"
      style={{
        color: c.color,
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        fontWeight: 700,
      }}
    >
      {c.pulse ? (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: c.color }}
        />
      ) : null}
      {c.label}
    </span>
  );
}

// ─── Meta line ───────────────────────────────────────────────

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

  if (
    (program.stage === "published-live" || program.stage === "published-pre-launch") &&
    program.enrolledCount !== undefined
  ) {
    parts.push(`${program.enrolledCount} enrolled`);
  }
  if (
    (program.stage === "published-live" || program.stage === "completed") &&
    program.earningsCents
  ) {
    parts.push(`${formatMoney(program.earningsCents)} earned`);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-sm md:text-base" style={{ color: "#64748b" }}>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="mx-2" style={{ color: "#94a3b8" }}>
              ·
            </span>
          )}
          {p}
        </span>
      ))}
    </p>
  );
}

// ─── Actions ─────────────────────────────────────────────────

function StageActions({ program }: { program: Program }) {
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
  const spaceHref = program.spaceId
    ? `/communities/challenge/${program.spaceId}`
    : publicHref;

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
      // No challenge space yet for a pre-launch program — the public
      // sales page is the right destination for sharing.
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={publicHref} className={orange} style={orangeStyle}>
            Open public page
          </Link>
          <Link href={contractHref} className={cyan} style={cyanStyle}>
            View contract
          </Link>
        </div>
      );
    case "published-live":
      // Live programs go to the challenge space (where buyers live);
      // workspace is intentionally NOT shown — published programs
      // shouldn't be "re-drafted" from the dashboard.
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={spaceHref} className={orange} style={orangeStyle}>
            Open challenge space
          </Link>
          <Link href={contractHref} className={cyan} style={cyanStyle}>
            View contract
          </Link>
        </div>
      );
    case "completed":
      return (
        <div className="flex flex-wrap gap-2">
          <Link href={spaceHref} className={cyan} style={cyanStyle}>
            Open challenge space
          </Link>
          <Link href={contractHref} className={cyan} style={cyanStyle}>
            View contract
          </Link>
        </div>
      );
  }
}

// ─── Main ────────────────────────────────────────────────────

export function ActiveProgramCard({ program, partner, user }: Props) {
  if (!program) {
    return <EmptyState user={user} />;
  }

  return (
    <div
      className="rounded-3xl overflow-hidden infitra-card"
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Cover banner — real product hero, not a thumbnail. Same DNA
          as the section-4 landing mockup. */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "4 / 1", backgroundColor: "#0F2229" }}
      >
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // Branded gradient placeholder when no cover yet
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.45) 0%, rgba(8,145,178,0.45) 100%), #0F2229",
            }}
          />
        )}
        {/* Soft fade so the stage badge has contrast */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,34,41,0.35) 0%, rgba(15,34,41,0) 100%)",
          }}
        />
        <div className="absolute top-4 right-4 z-10">
          <StageBadge stage={program.stage} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <h2
          className="text-2xl md:text-3xl font-headline tracking-tight"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.025em" }}
        >
          {program.title || "Untitled"}
        </h2>

        {partner && (
          <div className="flex items-center gap-2 mt-3">
            {partner.avatar ? (
              <img
                src={partner.avatar}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
                style={{
                  border: "1.5px solid #FFFFFF",
                  opacity: partner.pendingInvite ? 0.5 : 1,
                }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  border: "1.5px solid #FFFFFF",
                  backgroundColor: "rgba(8,145,178,0.18)",
                  opacity: partner.pendingInvite ? 0.5 : 1,
                }}
              >
                <span
                  className="text-[10px] font-headline"
                  style={{ color: "#0891b2", fontWeight: 700 }}
                >
                  {partner.name[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <span
              className="text-sm md:text-base"
              style={{
                color: partner.pendingInvite ? "#94a3b8" : "#475569",
                fontWeight: 600,
              }}
            >
              with{" "}
              <span
                style={{
                  color: partner.pendingInvite ? "#94a3b8" : "#0F2229",
                  fontWeight: 700,
                }}
              >
                {partner.name}
              </span>
              {partner.pendingInvite && (
                <span
                  className="ml-2 text-[10px] uppercase tracking-widest"
                  style={{ color: "#FF6130", fontWeight: 700 }}
                >
                  · invite pending
                </span>
              )}
            </span>
          </div>
        )}

        <div className="mt-5 mb-6">
          <StageMetaLine program={program} />
        </div>

        <StageActions program={program} />
      </div>
    </div>
  );
}
