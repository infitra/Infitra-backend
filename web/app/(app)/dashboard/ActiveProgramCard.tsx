import Link from "next/link";
import { PrimaryActionPill } from "./PrimaryActionPill";

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
  /** This-week deltas — populated by the loader for active programs. */
  earningsCentsThisWeek?: number;
  newMembersThisWeek?: number;
  sessionsDoneThisWeek?: number;
  /** Next upcoming session linked to this program (any host). */
  nextSession?: {
    id: string;
    title: string;
    startTime: string;
    imageUrl: string | null;
  } | null;
  /** First-buyer-just-landed milestone (drives the P4 insight). */
  firstBuyerAt?: string | null;
  /** Most recent session that was scheduled but never went live. */
  missedSession?: {
    id: string;
    title: string;
    startTime: string;
  } | null;
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
  /**
   * Layout density. "hero" = full treatment (banner + insights + next
   * session pill + multiple actions). "compact" = used when 2+ active
   * programs are on the dashboard at once; smaller banner, single
   * inline insights line, compact next session, single primary CTA.
   * Defaults to "hero".
   */
  density?: "hero" | "compact";
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

/**
 * Hour-precision relative time. Returns "in 2h", "in 45m", "now", or
 * day-level granularity ("today", "tomorrow", "in 5 days") for events
 * further out. The hour-precision branch only fires within 24h —
 * that's where urgency lives.
 */
function formatRelative(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "past";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "now";
  if (totalMin < 60) return `in ${totalMin}m`;
  const totalHours = Math.round(totalMin / 60);
  if (totalHours < 24) return `in ${totalHours}h`;
  // Day-level beyond 24h — calendar-day arithmetic, not 24h chunks
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return `in ${diffDays} days`;
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000);
}

function firstName(name: string | null | undefined): string {
  if (!name) return "your collaborator";
  return name.split(" ")[0] || name;
}

function formatNextSessionTime(iso: string): { day: string; time: string; relative: string } {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  let dayLabel: string;
  if (diffDays === 0) dayLabel = "Today";
  else if (diffDays === 1) dayLabel = "Tomorrow";
  else if (diffDays > 1 && diffDays < 7)
    dayLabel = d.toLocaleDateString("en-GB", { weekday: "long" });
  else dayLabel = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  // Use hour-precision for the relative cue when the session is within 24h —
  // "in 2h" lands harder than "today" when there's actually time pressure.
  return { day: dayLabel, time, relative: formatRelative(iso) };
}

// ─── Insight system ──────────────────────────────────────────
//
// Every program card asks `programInsight()` what to say. The cascade
// is ordered by urgency — first match wins. The function is pure: it
// takes a Program + Partner and returns a tone, an interpretive line,
// and a contextual primary action. The card is dumb — it just renders
// what the insight says.
//
// Tone palette (re-used from existing "Live" badge vocabulary):
//   urgent       — red, pulsing dot. Time-bound action.
//   opportunity  — orange, solid dot. Action unlocks growth.
//   blocked      — orange, solid dot. Waiting on someone external.
//   cruise       — cyan, no dot. Healthy default.

type InsightTone = "urgent" | "opportunity" | "blocked" | "cruise";

interface PrimaryAction {
  label: string;
  /** Either navigate (href) or perform an action ("copy-link"). */
  kind: "navigate" | "copy-link";
  href: string;
}

interface Insight {
  tone: InsightTone;
  message: string;
  primary: PrimaryAction;
  /** Secondary chips shown in addition to the primary. The card always
   * includes "View contract" for stages that have a contract; this
   * lets specific insights demote the *previous* default primary
   * (e.g. "Open challenge space") to a chip when an action overrides
   * it. */
  demoted?: { label: string; href: string }[];
}

function programInsight(program: Program, partner: Partner | null): Insight {
  const partnerName = firstName(partner?.name);
  const enrolled = program.enrolledCount ?? 0;
  const workspaceHref = `/dashboard/collaborate/${program.id}`;
  const publicHref = `/challenges/${program.id}`;
  const contractHref = `/dashboard/collaborate/${program.id}/contract`;
  const spaceHref = program.spaceId
    ? `/communities/challenge/${program.spaceId}`
    : publicHref;

  // ── LIVE cascade ──────────────────────────────────────────
  if (program.stage === "published-live") {
    const minsToNext = program.nextSession
      ? Math.round(
          (new Date(program.nextSession.startTime).getTime() - Date.now()) /
            60000,
        )
      : null;

    // L1 — going live in <15min. Even for 0-buyer programs, the host
    // might want to enter to cancel/test, so this stays at the top.
    if (minsToNext !== null && minsToNext > 0 && minsToNext < 15) {
      return {
        tone: "urgent",
        message: `Going live in ${minsToNext} min`,
        primary: { label: "Go live", kind: "navigate", href: `/dashboard/sessions/${program.nextSession!.id}` },
        demoted: [{ label: "Open challenge space", href: spaceHref }],
      };
    }

    // L4 — 0 enrolled is the *biggest* problem when it's true. Missed
    // sessions and upcoming sessions are downstream of this — without
    // buyers, neither matters yet. Surface it before time-based rules.
    if (enrolled === 0) {
      return {
        tone: "opportunity",
        message: "No participants yet — invite people to start momentum",
        primary: { label: "Invite participants", kind: "copy-link", href: publicHref },
        demoted: [{ label: "Open challenge space", href: spaceHref }],
      };
    }

    // L3 — missed session, only meaningful with actual participants
    if (program.missedSession) {
      return {
        tone: "urgent",
        message: `You missed ${program.missedSession.title} — reschedule it`,
        primary: { label: "Reschedule", kind: "navigate", href: `/dashboard/sessions/${program.missedSession.id}` },
        demoted: [{ label: "Open challenge space", href: spaceHref }],
      };
    }

    // L2 — session in <24h
    if (minsToNext !== null && minsToNext > 0 && minsToNext < 24 * 60) {
      const rel = formatRelative(program.nextSession!.startTime);
      return {
        tone: "urgent",
        message: `Next session ${rel} — you're set`,
        primary: { label: "Prepare session", kind: "navigate", href: `/dashboard/sessions/${program.nextSession!.id}` },
        demoted: [{ label: "Open challenge space", href: spaceHref }],
      };
    }

    // P4 — first buyer landed in last 24h (also fires for live, since
    // pre-launch becomes live the moment the start date passes)
    const hoursSinceFirstBuyer = hoursSince(program.firstBuyerAt);
    if (
      hoursSinceFirstBuyer !== null &&
      hoursSinceFirstBuyer < 24
    ) {
      return {
        tone: "opportunity",
        message: "First buyer · the run is real now",
        primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
      };
    }

    // L5 — 1+ enrolled but no session yet this week
    if ((program.sessionsDoneThisWeek ?? 0) === 0) {
      return {
        tone: "opportunity",
        message: `${enrolled} enrolled · kick this week off`,
        primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
      };
    }

    // L6 — default running
    const sessions = program.sessionsDoneThisWeek ?? 0;
    return {
      tone: "cruise",
      message: `${enrolled} enrolled · ${sessions} session${sessions === 1 ? "" : "s"} this week`,
      primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
    };
  }

  // ── PRE-LAUNCH cascade ────────────────────────────────────
  if (program.stage === "published-pre-launch") {
    const dToLaunch = daysUntil(program.startDate);
    const hoursSinceFirstBuyer = hoursSince(program.firstBuyerAt);

    // P4 — first buyer in last 24h takes the moment
    if (
      enrolled >= 1 &&
      hoursSinceFirstBuyer !== null &&
      hoursSinceFirstBuyer < 24
    ) {
      return {
        tone: "opportunity",
        message: "First buyer · the run is real now",
        primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
      };
    }

    // P1 — 0 enrolled, launches in <7 days
    if (enrolled === 0 && dToLaunch !== null && dToLaunch < 7) {
      return {
        tone: "opportunity",
        message: `Launches in ${dToLaunch} day${dToLaunch === 1 ? "" : "s"} — nobody's signed up yet`,
        primary: { label: "Share your page", kind: "copy-link", href: publicHref },
        demoted: [{ label: "Open public page", href: publicHref }],
      };
    }

    // P2 — has buyers, launches soon
    if (enrolled >= 1 && dToLaunch !== null) {
      return {
        tone: "cruise",
        message: `${enrolled} enrolled · launches in ${dToLaunch} day${dToLaunch === 1 ? "" : "s"}`,
        primary: { label: "Open public page", kind: "navigate", href: publicHref },
      };
    }

    // P3 — 0 enrolled, launches farther out
    return {
      tone: "opportunity",
      message: "Share early to build momentum before launch",
      primary: { label: "Open public page", kind: "navigate", href: publicHref },
    };
  }

  // ── DRAFTING cascade ──────────────────────────────────────
  // D1/D5 (stale invite/contract): we soft-pedal to "Open workspace" until
  // the dedicated nudge flows exist. The *insight line* still surfaces the
  // staleness so the user knows what they're walking into.
  if (program.stage === "drafting-solo") {
    return {
      tone: partner?.pendingInvite ? "blocked" : "blocked",
      message: partner?.pendingInvite
        ? `Waiting for ${partnerName} to accept`
        : "Waiting for your collaborator",
      primary: { label: "Open workspace", kind: "navigate", href: workspaceHref },
    };
  }

  if (program.stage === "drafting-jointly") {
    return {
      tone: "cruise",
      message: `Drafting together with ${partnerName}`,
      primary: { label: "Open workspace", kind: "navigate", href: workspaceHref },
    };
  }

  if (program.stage === "awaiting-signatures") {
    return {
      tone: "cruise",
      message: `Contract sent — waiting on ${partnerName}`,
      primary: { label: "Review contract", kind: "navigate", href: contractHref },
    };
  }

  // ── COMPLETED ─────────────────────────────────────────────
  if (program.stage === "completed") {
    if (enrolled === 0) {
      return {
        tone: "cruise",
        message: "Wrapped up · no buyers this run",
        // Aspirational: there's no summary page yet, /challenges/{id} is the
        // closest read-only "what was this" view.
        primary: { label: "View summary", kind: "navigate", href: publicHref },
      };
    }
    return {
      tone: "cruise",
      message: `Wrapped up · ${enrolled} completed`,
      primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
    };
  }

  // Fallback (shouldn't hit — exhaustive switch above)
  return {
    tone: "cruise",
    message: program.title || "Untitled",
    primary: { label: "Open challenge space", kind: "navigate", href: spaceHref },
  };
}

const TONE_COLOR: Record<InsightTone, string> = {
  urgent: "#ef4444",
  opportunity: "#FF6130",
  blocked: "#FF6130",
  cruise: "#0891b2",
};

function InsightLine({ insight }: { insight: Insight }) {
  const color = TONE_COLOR[insight.tone];
  const showDot = insight.tone !== "cruise";
  const pulse = insight.tone === "urgent";
  return (
    <div className="flex items-center gap-2 mb-3">
      {showDot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${pulse ? "animate-pulse" : ""}`}
          style={{ backgroundColor: color }}
        />
      )}
      <p
        className="text-sm md:text-[15px] font-headline"
        style={{ color, fontWeight: 700, letterSpacing: "-0.005em" }}
      >
        {insight.message}
      </p>
    </div>
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
      // Red is universal "broadcasting now" — recording dot, on-air
      // light. Same red as TopAlert's live banner so the dashboard
      // reads coherently across both surfaces.
      label: "Live",
      bg: "rgba(239,68,68,0.10)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.30)",
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

function ProgressBar({ percent, accent }: { percent: number; accent: string }) {
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: "rgba(15,34,41,0.06)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: accent,
        }}
      />
    </div>
  );
}

function NextSessionPill({
  session,
}: {
  session: { id: string; title: string; startTime: string; imageUrl: string | null };
}) {
  const t = formatNextSessionTime(session.startTime);
  return (
    <div
      className="flex items-center gap-3.5 p-2.5 pr-4 rounded-xl"
      style={{
        backgroundColor: "rgba(8,145,178,0.06)",
        border: "1px solid rgba(8,145,178,0.18)",
      }}
    >
      {/* Cover thumbnail when uploaded; fallback to play-icon tile */}
      {session.imageUrl ? (
        <img
          src={session.imageUrl}
          alt=""
          className="shrink-0 w-14 h-14 rounded-lg object-cover"
        />
      ) : (
        <span
          className="shrink-0 w-14 h-14 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(8,145,178,0.12)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M10 9 L10 15 L15.5 12 Z" fill="#0891b2" stroke="none" />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1">
        {/* Time / date — visually prominent, not buried in a meta line */}
        <p
          className="text-sm md:text-base font-headline tracking-tight"
          style={{ color: "#0891b2", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          <span className="text-[10px] uppercase tracking-widest mr-2" style={{ color: "#94a3b8", fontWeight: 700 }}>
            Next:
          </span>
          {t.day} · {t.time}
          <span
            className="ml-2 text-[10px] uppercase tracking-widest"
            style={{ color: "#94a3b8", fontWeight: 700 }}
          >
            ({t.relative})
          </span>
        </p>
        <p
          className="text-sm font-headline truncate mt-0.5"
          style={{ color: "#0F2229", fontWeight: 700 }}
        >
          {session.title}
        </p>
      </div>
    </div>
  );
}

function InsightsLine({ program }: { program: Program }) {
  const parts: string[] = [];
  if ((program.newMembersThisWeek ?? 0) > 0)
    parts.push(`+${program.newMembersThisWeek} new member${program.newMembersThisWeek === 1 ? "" : "s"}`);
  if ((program.earningsCentsThisWeek ?? 0) > 0)
    parts.push(`+${formatMoney(program.earningsCentsThisWeek!)}`);
  if ((program.sessionsDoneThisWeek ?? 0) > 0)
    parts.push(`${program.sessionsDoneThisWeek} session${program.sessionsDoneThisWeek === 1 ? "" : "s"} done`);

  if (parts.length === 0) return null;
  return (
    <p
      className="text-xs md:text-sm font-headline"
      style={{ color: "#475569", fontWeight: 600 }}
    >
      <span
        className="text-[10px] uppercase tracking-widest mr-2"
        style={{ color: "#0891b2", fontWeight: 700 }}
      >
        This week
      </span>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>}
          {p}
        </span>
      ))}
    </p>
  );
}

function CompactNextSession({
  session,
}: {
  session: { id: string; title: string; startTime: string; imageUrl: string | null };
}) {
  const t = formatNextSessionTime(session.startTime);
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
      style={{
        backgroundColor: "rgba(8,145,178,0.06)",
        border: "1px solid rgba(8,145,178,0.18)",
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0891b2"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M10 9 L10 15 L15.5 12 Z" fill="#0891b2" stroke="none" />
      </svg>
      <p
        className="text-xs font-headline truncate flex-1 min-w-0"
        style={{ color: "#0F2229", fontWeight: 700 }}
      >
        <span className="text-[9px] uppercase tracking-widest mr-1.5" style={{ color: "#94a3b8", fontWeight: 700 }}>
          Next:
        </span>
        <span style={{ color: "#0891b2" }}>{t.day} {t.time}</span>{" "}
        <span style={{ color: "#94a3b8", fontWeight: 600 }}>({t.relative})</span>{" "}
        <span style={{ color: "#64748b", fontWeight: 600 }}>· {session.title}</span>
      </p>
    </div>
  );
}

function StageContent({ program }: { program: Program }) {
  // Drafting / awaiting-signatures: the insight line carries the full
  // status. Showing a second descriptive line here was redundant — the
  // card now relies on the cascade for stage interpretation.
  if (
    program.stage === "drafting-solo" ||
    program.stage === "drafting-jointly" ||
    program.stage === "awaiting-signatures"
  ) {
    return null;
  }

  // Completed — short historical line (complementary to the insight)
  if (program.stage === "completed") {
    const parts: string[] = [];
    if (program.endDate) parts.push(`Ended ${formatDate(program.endDate)}`);
    if (program.enrolledCount !== undefined && program.enrolledCount > 0)
      parts.push(`${program.enrolledCount} participants`);
    if (program.earningsCents) parts.push(`${formatMoney(program.earningsCents)} earned`);
    if (parts.length === 0) return null;
    return (
      <p className="text-sm md:text-base" style={{ color: "#64748b" }}>
        {parts.join(" · ")}
      </p>
    );
  }

  // Published-pre-launch — launch date line. The "share" callout the
  // old version rendered for no-buyer state is now carried by the
  // insight line at the top of the card; we don't need it twice.
  if (program.stage === "published-pre-launch") {
    if (!program.startDate) return null;
    return (
      <p className="text-sm md:text-base" style={{ color: "#64748b" }}>
        Launches {formatDate(program.startDate)}
        {program.enrolledCount !== undefined && program.enrolledCount > 0 && (
          <>
            <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>
            {program.enrolledCount} enrolled
          </>
        )}
      </p>
    );
  }

  // Published-live — progress bar + insights + next session anchor
  if (program.stage === "published-live" && program.startDate && program.endDate) {
    const cw = currentWeek(program.startDate);
    const tw = totalWeeks(program.startDate, program.endDate);
    const percent = (cw / tw) * 100;
    return (
      <div className="space-y-4">
        {/* Week progress bar — visual journey */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <p
              className="text-[10px] uppercase tracking-widest font-headline"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              Week {cw} of {tw}
            </p>
            {program.enrolledCount !== undefined && (
              <p
                className="text-[10px] uppercase tracking-widest font-headline"
                style={{ color: "#94a3b8", fontWeight: 700 }}
              >
                {program.enrolledCount} enrolled
              </p>
            )}
          </div>
          <ProgressBar percent={percent} accent="#0891b2" />
        </div>

        {/* This-week insights — operational deltas */}
        <InsightsLine program={program} />

        {/* Next session anchor */}
        {program.nextSession && <NextSessionPill session={program.nextSession} />}
      </div>
    );
  }

  return null;
}

// ─── Primary destinations + secondary actions ───────────────

function showsContract(stage: ProgramStage): boolean {
  return (
    stage === "awaiting-signatures" ||
    stage === "published-pre-launch" ||
    stage === "published-live" ||
    stage === "completed"
  );
}

/**
 * Secondary actions — small pills for things that aren't the contextual
 * primary action. "View contract" is the canonical secondary; the cascade
 * may also demote the previous stage default (e.g. "Open challenge space")
 * to a chip when an action overrides it.
 *
 * Renders as a positioned sibling of the overlay link, so its clicks don't
 * route through the overlay even when nested deeply.
 */
function SecondaryActions({
  program,
  insight,
}: {
  program: Program;
  insight: Insight;
}) {
  const contractHref = `/dashboard/collaborate/${program.id}/contract`;
  const chips: { label: string; href: string }[] = [];
  if (insight.demoted) chips.push(...insight.demoted);
  if (showsContract(program.stage)) {
    chips.push({ label: "View contract", href: contractHref });
  }
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="text-[11px] uppercase tracking-widest font-headline px-3 py-1.5 rounded-full transition-colors hover:bg-[#0F2229]/[0.05]"
          style={{
            color: "#0891b2",
            border: "1px solid rgba(8,145,178,0.25)",
            fontWeight: 700,
            backgroundColor: "rgba(255,255,255,0.85)",
          }}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}

function hasSecondaryActions(program: Program, insight: Insight): boolean {
  return (insight.demoted?.length ?? 0) > 0 || showsContract(program.stage);
}

// ─── Main ────────────────────────────────────────────────────

export function ActiveProgramCard({ program, partner, user, density = "hero" }: Props) {
  if (!program) {
    return <EmptyState user={user} />;
  }

  const isHero = density === "hero";
  const insight = programInsight(program, partner);

  // Compact: smaller banner aspect, smaller title, single inline insight
  // line, compact next-session pill, single primary CTA. Used when 2+
  // active programs share the dashboard.
  if (!isHero) {
    return <CompactProgramCard program={program} partner={partner} insight={insight} />;
  }

  return (
    <article
      className="relative rounded-3xl overflow-hidden infitra-card-link transition-shadow hover:shadow-2xl"
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Cover banner — real product hero. */}
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
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.45) 0%, rgba(8,145,178,0.45) 100%), #0F2229",
            }}
          />
        )}
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
        {/* Decision layer — interpret the state, prime the action */}
        <InsightLine insight={insight} />

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
          <StageContent program={program} />
        </div>

        {/* Bottom row: contextual primary action. Pure visual when it's
            a navigate (overlay handles the click); a real button when
            it's a copy-link, since that intercepts the overlay. */}
        <PrimaryActionPill
          label={insight.primary.label}
          kind={insight.primary.kind}
          href={insight.primary.href}
        />
      </div>

      {/* Click overlay — covers the whole card. Renders before
          SecondaryActions in DOM order so the absolutely-positioned
          actions sit on top regardless of z-index. For copy-link
          primaries the overlay still routes to a sensible passive
          destination (the same URL, here = the public page); the
          real action is the button above. */}
      <Link
        href={insight.primary.href}
        aria-label={insight.primary.label}
        className="absolute inset-0"
      >
        <span className="sr-only">{insight.primary.label}</span>
      </Link>

      {/* Secondary actions — sibling of the overlay, positioned over
          the bottom-right corner. Independent click target. */}
      {hasSecondaryActions(program, insight) && (
        <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8">
          <SecondaryActions program={program} insight={insight} />
        </div>
      )}
    </article>
  );
}

// ─── Compact (used when 2+ active programs share the dashboard) ────

function CompactProgramCard({
  program,
  partner,
  insight,
}: {
  program: Program;
  partner: Partner | null;
  insight: Insight;
}) {
  const isLive = program.stage === "published-live";
  const cw = isLive && program.startDate ? currentWeek(program.startDate) : null;
  const tw =
    isLive && program.startDate && program.endDate
      ? totalWeeks(program.startDate, program.endDate)
      : null;
  const percent = cw && tw ? (cw / tw) * 100 : 0;

  return (
    <article
      className="relative rounded-2xl overflow-hidden infitra-card-link flex flex-col transition-shadow hover:shadow-2xl"
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Cover banner — slimmer than hero (5:1) */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{ aspectRatio: "5 / 1", backgroundColor: "#0F2229" }}
      >
        {program.imageUrl ? (
          <img
            src={program.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,97,48,0.45) 0%, rgba(8,145,178,0.45) 100%), #0F2229",
            }}
          />
        )}
        <div
          className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(15,34,41,0.35) 0%, rgba(15,34,41,0) 100%)",
          }}
        />
        <div className="absolute top-3 right-3 z-10">
          <StageBadge stage={program.stage} />
        </div>
      </div>

      {/* Content — flex column so the action sits at the bottom */}
      <div className="flex-1 flex flex-col p-5">
        <InsightLine insight={insight} />

        <h2
          className="text-lg md:text-xl font-headline tracking-tight"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {program.title || "Untitled"}
        </h2>

        {partner && (
          <div className="flex items-center gap-2 mt-2">
            {partner.avatar ? (
              <img
                src={partner.avatar}
                alt=""
                className="w-5 h-5 rounded-full object-cover"
                style={{ border: "1px solid #FFFFFF" }}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(8,145,178,0.18)" }}
              >
                <span className="text-[9px] font-headline" style={{ color: "#0891b2", fontWeight: 700 }}>
                  {partner.name[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <span className="text-xs" style={{ color: "#475569" }}>
              with{" "}
              <span style={{ color: "#0F2229", fontWeight: 700 }}>{partner.name}</span>
            </span>
          </div>
        )}

        {/* Progress + insights */}
        {isLive && cw && tw ? (
          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <p
                className="text-[10px] uppercase tracking-widest font-headline"
                style={{ color: "#94a3b8", fontWeight: 700 }}
              >
                Week {cw} of {tw}
              </p>
              {program.enrolledCount !== undefined && (
                <p
                  className="text-[10px] uppercase tracking-widest font-headline"
                  style={{ color: "#94a3b8", fontWeight: 700 }}
                >
                  {program.enrolledCount} enrolled
                </p>
              )}
            </div>
            <ProgressBar percent={percent} accent="#0891b2" />
          </div>
        ) : program.startDate ? (
          <p className="text-xs mt-3" style={{ color: "#64748b" }}>
            Launches {formatDate(program.startDate)}
            {program.enrolledCount !== undefined && program.enrolledCount > 0 && (
              <>
                <span className="mx-2" style={{ color: "#94a3b8" }}>·</span>
                {program.enrolledCount} enrolled
              </>
            )}
          </p>
        ) : null}

        <div className="mt-3">
          <InsightsLine program={program} />
        </div>

        {/* Next session — compact one-liner */}
        {program.nextSession && (
          <div className="mt-3">
            <CompactNextSession session={program.nextSession} />
          </div>
        )}

        {/* Spacer + bottom row: contextual primary action.
            SecondaryActions render below as a positioned sibling of
            the overlay link (see end of article). */}
        <div className="flex-1" />
        <div className="mt-4">
          <PrimaryActionPill
            label={insight.primary.label}
            kind={insight.primary.kind}
            href={insight.primary.href}
          />
        </div>
      </div>

      {/* Click overlay — see hero variant for rationale. */}
      <Link
        href={insight.primary.href}
        aria-label={insight.primary.label}
        className="absolute inset-0"
      >
        <span className="sr-only">{insight.primary.label}</span>
      </Link>

      {hasSecondaryActions(program, insight) && (
        <div className="absolute bottom-5 right-5">
          <SecondaryActions program={program} insight={insight} />
        </div>
      )}
    </article>
  );
}
