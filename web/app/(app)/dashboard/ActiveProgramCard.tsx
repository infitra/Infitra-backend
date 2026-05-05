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
}

interface Partner {
  name: string;
  avatar: string | null;
  pendingInvite: boolean;
}

interface UserProfile {
  name: string;
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
  /** "navigate" routes (overlay link handles the click); "share" copies
   * the public-page URL to clipboard with a "Link copied" affordance. */
  kind: "navigate" | "share";
  href: string;
}

interface Insight {
  tone: InsightTone;
  message: string;
  primary: PrimaryAction;
}

/**
 * Card-home href — where clicking the bulk of the card always goes.
 * Decoupled from `insight.primary` so the card has a stable passive
 * destination regardless of which decision the cascade is offering.
 *
 * The challenge space is persistent through every published stage
 * (pre-launch, live, completed), so it's the canonical home once a
 * program is published.
 */
function cardHomeHref(program: Program): string {
  if (program.spaceId) return `/communities/challenge/${program.spaceId}`;
  // Drafting / awaiting-signatures don't have a space yet — workspace is home.
  return `/dashboard/collaborate/${program.id}`;
}

function programInsight(program: Program, partner: Partner | null): Insight {
  const partnerName = firstName(partner?.name);
  const enrolled = program.enrolledCount ?? 0;
  const workspaceHref = `/dashboard/collaborate/${program.id}`;
  const publicHref = `/challenges/${program.id}`;
  const contractHref = `/dashboard/collaborate/${program.id}/contract`;
  const home = cardHomeHref(program);

  // ── LIVE ──────────────────────────────────────────────────
  if (program.stage === "published-live") {
    const minsToNext = program.nextSession
      ? Math.round(
          (new Date(program.nextSession.startTime).getTime() - Date.now()) /
            60000,
        )
      : null;

    if (minsToNext !== null && minsToNext > 0 && minsToNext < 15) {
      return {
        tone: "urgent",
        message: `Going live in ${minsToNext} min`,
        primary: { label: "Go live", kind: "navigate", href: `/dashboard/sessions/${program.nextSession!.id}` },
      };
    }

    if (minsToNext !== null && minsToNext > 0 && minsToNext < 24 * 60) {
      const rel = formatRelative(program.nextSession!.startTime);
      return {
        tone: "urgent",
        message: `Next session ${rel} — you're set`,
        primary: { label: "Prepare session", kind: "navigate", href: `/dashboard/sessions/${program.nextSession!.id}` },
      };
    }

    if (enrolled === 0) {
      return {
        tone: "opportunity",
        message: "No participants yet — share to find your first members",
        primary: { label: "Share the program", kind: "share", href: publicHref },
      };
    }

    const sessions = program.sessionsDoneThisWeek ?? 0;
    return {
      tone: "cruise",
      message: `${enrolled} enrolled · ${sessions} session${sessions === 1 ? "" : "s"} this week`,
      primary: { label: "Open challenge space", kind: "navigate", href: home },
    };
  }

  // ── PRE-LAUNCH ────────────────────────────────────────────
  if (program.stage === "published-pre-launch") {
    const dToLaunch = daysUntil(program.startDate);
    const launchPart =
      dToLaunch !== null ? `launches in ${dToLaunch} day${dToLaunch === 1 ? "" : "s"}` : "launching soon";

    if (enrolled === 0) {
      return {
        tone: "opportunity",
        message: `Launches in ${dToLaunch ?? "?"} day${dToLaunch === 1 ? "" : "s"} — share to find your first members`,
        primary: { label: "Share the program", kind: "share", href: publicHref },
      };
    }

    return {
      tone: "cruise",
      message: `${enrolled} enrolled · ${launchPart}`,
      primary: { label: "Share the program", kind: "share", href: publicHref },
    };
  }

  // ── DRAFTING / AWAITING ───────────────────────────────────
  if (program.stage === "drafting-solo") {
    return {
      tone: "blocked",
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
  return {
    tone: "cruise",
    message: enrolled > 0 ? `Wrapped up · ${enrolled} completed` : "Wrapped up",
    primary: { label: "Open challenge space", kind: "navigate", href: home },
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

// ─── Cover-chip composition ──────────────────────────────────
//
// The banner does triple duty: program image, the people involved
// (avatars + first names), and a single status chip that carries the
// stage and a tiny meta-cue (week count for live, launch date for
// pre-launch, end date for completed, partner-pending state for
// drafting). One chip, on the cover. Borrowed from the landing page
// "What you can build" mockup — the whole point is restraint.

interface StatusChipConfig {
  label: string;
  pulse: boolean;
}

function statusChipFor(program: Program): StatusChipConfig {
  switch (program.stage) {
    case "published-live": {
      const cw = currentWeek(program.startDate);
      const tw = totalWeeks(program.startDate, program.endDate);
      return { label: tw > 0 ? `Live · Week ${cw} of ${tw}` : "Live", pulse: true };
    }
    case "published-pre-launch": {
      const dToLaunch = daysUntil(program.startDate);
      if (dToLaunch === null) return { label: "Pre-launch", pulse: false };
      if (dToLaunch === 0) return { label: "Pre-launch · Launches today", pulse: false };
      if (dToLaunch === 1) return { label: "Pre-launch · Launches tomorrow", pulse: false };
      return { label: `Pre-launch · Launches in ${dToLaunch} days`, pulse: false };
    }
    case "drafting-solo":
      return { label: "Drafting · Solo", pulse: false };
    case "drafting-jointly":
      return { label: "Drafting · Together", pulse: false };
    case "awaiting-signatures":
      return { label: "Awaiting signatures", pulse: false };
    case "completed":
      return {
        label: program.endDate
          ? `Wrapped up · Ended ${formatDate(program.endDate)}`
          : "Wrapped up",
        pulse: false,
      };
  }
}

function StatusChip({ program }: { program: Program }) {
  const c = statusChipFor(program);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-headline backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(15,34,41,0.85)",
        color: "#9CF0FF",
        fontWeight: 700,
      }}
    >
      {c.pulse && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "#9CF0FF" }}
        />
      )}
      {c.label}
    </span>
  );
}

/**
 * Avatars + first names of the people involved in this program. Sits
 * bottom-left on the cover, behind a gradient for legibility. Adds
 * the human note that makes a program card feel like a relationship,
 * not a record.
 */
function CreatorRow({
  user,
  partner,
  density,
}: {
  user: UserProfile;
  partner: Partner | null;
  density: "hero" | "compact";
}) {
  const size = density === "hero" ? "w-7 h-7" : "w-6 h-6";
  const text = density === "hero" ? "text-sm" : "text-xs";
  const renderAvatar = (
    avatar: string | null,
    initial: string,
    dim: boolean,
  ) => (
    <span
      className={`${size} rounded-full overflow-hidden inline-flex items-center justify-center shrink-0`}
      style={{
        border: "1.5px solid #FFFFFF",
        backgroundColor: avatar ? "transparent" : "rgba(255,97,48,0.20)",
        opacity: dim ? 0.55 : 1,
      }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-headline" style={{ color: "#FFFFFF", fontWeight: 700 }}>
          {initial}
        </span>
      )}
    </span>
  );
  return (
    <div className="flex items-center gap-2">
      {renderAvatar(user.avatar, user.initial, false)}
      {partner && renderAvatar(
        partner.avatar,
        partner.name[0]?.toUpperCase() ?? "?",
        partner.pendingInvite,
      )}
      <span
        className={`${text} font-headline truncate`}
        style={{ color: "#FFFFFF", fontWeight: 700, textShadow: "0 1px 2px rgba(15,34,41,0.5)" }}
      >
        {firstName(user.name)}
        {partner && (
          <>
            <span className="opacity-60"> &amp; </span>
            <span style={{ opacity: partner.pendingInvite ? 0.6 : 1 }}>
              {firstName(partner.name)}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

// ─── Editorial moment pill ───────────────────────────────────
//
// One component for both kinds of "what's next" body — sessions and
// launch dates. Cover image is the lead, time-as-headline, title
// underneath. When there's no image, falls back to a typed icon
// tile (play for sessions, calendar for launch).

function MomentPill({
  imageUrl,
  iconKind,
  label,
  headline,
  relative,
  title,
  accent,
}: {
  imageUrl: string | null;
  iconKind: "session" | "launch";
  /** Eyebrow label — uppercase, e.g. "NEXT" or "LAUNCHES" */
  label: string;
  /** Big headline — e.g. "Thu 19:38" or "Mon 31 May" */
  headline: string;
  /** Cue in parens — e.g. "in 2h" / "in 5 days" */
  relative: string;
  /** Optional descriptive title under the headline */
  title?: string;
  accent?: string;
}) {
  const a = accent ?? "#0891b2";
  return (
    <div
      className="flex items-center gap-3.5 p-2.5 pr-4 rounded-xl"
      style={{
        backgroundColor: `${a}10`,
        border: `1px solid ${a}30`,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="shrink-0 w-14 h-14 rounded-lg object-cover"
        />
      ) : (
        <span
          className="shrink-0 w-14 h-14 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${a}20` }}
        >
          {iconKind === "session" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M10 9 L10 15 L15.5 12 Z" fill={a} stroke="none" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="8" y1="3" x2="8" y2="7" />
              <line x1="16" y1="3" x2="16" y2="7" />
            </svg>
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm md:text-base font-headline tracking-tight"
          style={{ color: a, fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          <span className="text-[10px] uppercase tracking-widest mr-2" style={{ color: "#94a3b8", fontWeight: 700 }}>
            {label}
          </span>
          {headline}
          <span
            className="ml-2 text-[10px] uppercase tracking-widest"
            style={{ color: "#94a3b8", fontWeight: 700 }}
          >
            ({relative})
          </span>
        </p>
        {title && (
          <p
            className="text-sm font-headline truncate mt-0.5"
            style={{ color: "#0F2229", fontWeight: 700 }}
          >
            {title}
          </p>
        )}
      </div>
    </div>
  );
}

function NextSessionMoment({
  session,
  isUrgent,
}: {
  session: { id: string; title: string; startTime: string; imageUrl: string | null };
  isUrgent: boolean;
}) {
  const t = formatNextSessionTime(session.startTime);
  return (
    <MomentPill
      imageUrl={session.imageUrl}
      iconKind="session"
      label="Next"
      headline={`${t.day} ${t.time}`}
      relative={t.relative}
      title={session.title}
      accent={isUrgent ? "#ef4444" : "#0891b2"}
    />
  );
}

function LaunchMoment({
  startDate,
  imageUrl,
}: {
  startDate: string;
  imageUrl: string | null;
}) {
  const d = new Date(startDate + "T00:00:00");
  const headline = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const relative = formatRelative(d.toISOString());
  return (
    <MomentPill
      imageUrl={imageUrl}
      iconKind="launch"
      label="Launches"
      headline={headline}
      relative={relative}
      accent="#FF6130"
    />
  );
}

/**
 * Editorial body. One of:
 *   - the next session (live or pre-launch with a scheduled session)
 *   - the launch date (pre-launch with no session yet)
 *   - nothing (drafting, awaiting-signatures, completed)
 */
function MomentBlock({ program }: { program: Program }) {
  if (program.nextSession) {
    const minsToNext = Math.round(
      (new Date(program.nextSession.startTime).getTime() - Date.now()) / 60000,
    );
    return (
      <NextSessionMoment
        session={program.nextSession}
        isUrgent={minsToNext > 0 && minsToNext < 24 * 60}
      />
    );
  }
  if (program.stage === "published-pre-launch" && program.startDate) {
    return <LaunchMoment startDate={program.startDate} imageUrl={program.imageUrl} />;
  }
  return null;
}

// ─── Secondary actions (View contract chip) ──────────────────

function showsContract(stage: ProgramStage): boolean {
  return (
    stage === "awaiting-signatures" ||
    stage === "published-pre-launch" ||
    stage === "published-live" ||
    stage === "completed"
  );
}

/**
 * The only secondary chip that survives the simplification: "View
 * contract" for stages where a contract exists. Card click handles
 * "Open challenge space" / "Open workspace" — chips are reserved for
 * destinations that aren't the program's home.
 *
 * Renders as a positioned sibling of the overlay link, so its clicks
 * don't route through the overlay.
 */
function SecondaryActions({ program }: { program: Program }) {
  if (!showsContract(program.stage)) return null;
  const contractHref = `/dashboard/collaborate/${program.id}/contract`;
  return (
    <Link
      href={contractHref}
      className="text-[11px] uppercase tracking-widest font-headline px-3 py-1.5 rounded-full transition-colors hover:bg-[#0F2229]/[0.05]"
      style={{
        color: "#0891b2",
        border: "1px solid rgba(8,145,178,0.25)",
        fontWeight: 700,
        backgroundColor: "rgba(255,255,255,0.85)",
      }}
    >
      View contract
    </Link>
  );
}

// ─── Main ────────────────────────────────────────────────────

export function ActiveProgramCard({ program, partner, user, density = "hero" }: Props) {
  if (!program) {
    return <EmptyState user={user} />;
  }

  const isHero = density === "hero";
  const insight = programInsight(program, partner);
  const home = cardHomeHref(program);

  // Density knobs — same shape, only size changes.
  const radius = isHero ? "rounded-3xl" : "rounded-2xl";
  const aspect = isHero ? "4 / 1" : "5 / 1";
  const padding = isHero ? "p-6 md:p-10" : "p-5";
  const titleSize = isHero ? "text-2xl md:text-4xl" : "text-lg md:text-xl";
  const titleSpacing = isHero ? "-0.025em" : "-0.02em";
  const chipPosition = isHero ? "top-4 right-4" : "top-3 right-3";
  const peoplePosition = isHero ? "bottom-4 left-4" : "bottom-3 left-3";
  const secondaryPosition = isHero ? "bottom-6 md:bottom-10 right-6 md:right-10" : "bottom-5 right-5";

  return (
    <article
      className={`relative ${radius} overflow-hidden infitra-card-link transition-shadow hover:shadow-2xl flex flex-col`}
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Cover — image, people (avatars + first names), status chip.
          One block, three jobs. Borrowed from the landing-page mockup. */}
      <div
        className="relative w-full overflow-hidden shrink-0"
        style={{ aspectRatio: aspect, backgroundColor: "#0F2229" }}
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
        {/* Bottom gradient — legibility for the people row */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(15,34,41,0.65) 0%, rgba(15,34,41,0) 100%)",
          }}
        />
        <div className={`absolute ${chipPosition} z-10`}>
          <StatusChip program={program} />
        </div>
        <div className={`absolute ${peoplePosition} z-10`}>
          <CreatorRow user={user} partner={partner} density={density} />
        </div>
      </div>

      {/* Body — insight, title, optional editorial moment, footer. */}
      <div className={`flex-1 flex flex-col ${padding}`}>
        <InsightLine insight={insight} />

        <h2
          className={`${titleSize} font-headline tracking-tight`}
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: titleSpacing }}
        >
          {program.title || "Untitled"}
        </h2>

        <div className="mt-5">
          <MomentBlock program={program} />
        </div>

        <div className="flex-1" />

        <div className="mt-6">
          <PrimaryActionPill
            label={insight.primary.label}
            kind={insight.primary.kind}
            href={insight.primary.href}
          />
        </div>
      </div>

      {/* Card-home overlay — the bulk of the card always routes to the
          program's home (challenge space, or workspace for drafting).
          The primary action button sits above for copy-link cases. */}
      <Link
        href={home}
        aria-label="Open program"
        className="absolute inset-0"
      >
        <span className="sr-only">Open program</span>
      </Link>

      {showsContract(program.stage) && (
        <div className={`absolute ${secondaryPosition}`}>
          <SecondaryActions program={program} />
        </div>
      )}
    </article>
  );
}
