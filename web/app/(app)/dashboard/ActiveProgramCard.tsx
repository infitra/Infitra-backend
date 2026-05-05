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
  /** Next upcoming session — derived from `sessions` for convenience. */
  nextSession?: ProgramSession | null;
  /** Full session list for the program, ordered by start_time ascending.
   * Powers the hero-density horizontal session row. */
  sessions?: ProgramSession[];
}

interface ProgramSession {
  id: string;
  title: string;
  startTime: string;
  imageUrl: string | null;
  status: string;
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

// Color discipline:
//   red    — urgency (live, time-bound). Pulsing dot.
//   cyan   — information. Default for everything else (opportunity,
//            blocked, cruise — collapsed to one tone).
//   orange — action-only. Reserved for buttons, never insight text.
const TONE_COLOR: Record<InsightTone, string> = {
  urgent: "#ef4444",
  opportunity: "#0891b2",
  blocked: "#0891b2",
  cruise: "#0891b2",
};

function InsightLine({ insight }: { insight: Insight }) {
  const color = TONE_COLOR[insight.tone];
  const pulse = insight.tone === "urgent";
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${pulse ? "animate-pulse" : ""}`}
        style={{ backgroundColor: color }}
      />
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

// ─── Status chip ─────────────────────────────────────────────
//
// One chip on the cover top-right. Red dot+text for "Live" (matches
// the broadcasting semantic), cyan for everything else (information
// tone). The chip carries the stage AND a tiny meta-cue inline —
// week count for live, launch countdown for pre-launch, end date
// for completed, drafting flavor for drafting.

interface StatusChipConfig {
  label: string;
  /** "live" → red, pulsing. "info" → cyan, static. */
  variant: "live" | "info";
}

function statusChipFor(program: Program): StatusChipConfig {
  switch (program.stage) {
    case "published-live": {
      const cw = currentWeek(program.startDate);
      const tw = totalWeeks(program.startDate, program.endDate);
      return { label: tw > 0 ? `Live · Week ${cw} of ${tw}` : "Live", variant: "live" };
    }
    case "published-pre-launch": {
      const dToLaunch = daysUntil(program.startDate);
      if (dToLaunch === null) return { label: "Pre-launch", variant: "info" };
      if (dToLaunch === 0) return { label: "Pre-launch · Launches today", variant: "info" };
      if (dToLaunch === 1) return { label: "Pre-launch · Launches tomorrow", variant: "info" };
      return { label: `Pre-launch · Launches in ${dToLaunch} days`, variant: "info" };
    }
    case "drafting-solo":
      return { label: "Drafting · Solo", variant: "info" };
    case "drafting-jointly":
      return { label: "Drafting · Together", variant: "info" };
    case "awaiting-signatures":
      return { label: "Awaiting signatures", variant: "info" };
    case "completed":
      return {
        label: program.endDate
          ? `Wrapped up · Ended ${formatDate(program.endDate)}`
          : "Wrapped up",
        variant: "info",
      };
  }
}

function StatusChip({ program }: { program: Program }) {
  const c = statusChipFor(program);
  const accent = c.variant === "live" ? "#ef4444" : "#9CF0FF";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-headline backdrop-blur-sm"
      style={{
        backgroundColor: "rgba(15,34,41,0.85)",
        color: accent,
        fontWeight: 700,
      }}
    >
      {c.variant === "live" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: accent }}
        />
      )}
      {c.label}
    </span>
  );
}

// ─── Parties row — borrowed from the landing-page mockup ─────
//
// Two boxes side-by-side, brand-tinted (orange for owner, cyan for
// cohost). Avatar + first name + role label. The relationship is
// the program — this surface gives it the weight it deserves.
//
// For drafting-solo with a pending invite, the cohost box is
// rendered at half opacity with a "PENDING" role label, the same
// dim treatment we used to apply on the cover-row avatars.

function PersonBox({
  avatar,
  initial,
  name,
  role,
  accent,
  dim = false,
}: {
  avatar: string | null;
  initial: string;
  name: string;
  role: string;
  accent: "orange" | "cyan";
  dim?: boolean;
}) {
  const color = accent === "orange" ? "#FF6130" : "#0891b2";
  const bg = accent === "orange" ? "rgba(255,97,48,0.06)" : "rgba(8,145,178,0.06)";
  const border = accent === "orange" ? "rgba(255,97,48,0.20)" : "rgba(8,145,178,0.20)";
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl min-w-0"
      style={{ backgroundColor: bg, border: `1px solid ${border}`, opacity: dim ? 0.55 : 1 }}
    >
      <span
        className="shrink-0 w-10 h-10 rounded-full overflow-hidden inline-flex items-center justify-center"
        style={{ border: `1.5px solid ${color}40`, backgroundColor: avatar ? "transparent" : `${color}20` }}
      >
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-headline" style={{ color, fontWeight: 700 }}>
            {initial}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-headline truncate" style={{ color: "#0F2229", fontWeight: 700 }}>
          {firstName(name)}
        </p>
        <p
          className="text-[10px] uppercase tracking-widest font-headline"
          style={{ color, fontWeight: 700 }}
        >
          {role}
        </p>
      </div>
    </div>
  );
}

function PartiesRow({
  user,
  partner,
  isOwner,
}: {
  user: UserProfile;
  partner: Partner | null;
  /** True when the viewer is the program owner. Determines which side
   * gets the orange "OWNER" treatment. */
  isOwner: boolean;
}) {
  // Single-creator program (no partner) — show only the owner box.
  if (!partner) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <PersonBox
          avatar={user.avatar}
          initial={user.initial}
          name={user.name}
          role="OWNER"
          accent="orange"
        />
      </div>
    );
  }
  const userBox = (
    <PersonBox
      avatar={user.avatar}
      initial={user.initial}
      name={user.name}
      role={isOwner ? "OWNER" : "COHOST"}
      accent={isOwner ? "orange" : "cyan"}
    />
  );
  const partnerBox = (
    <PersonBox
      avatar={partner.avatar}
      initial={partner.name[0]?.toUpperCase() ?? "?"}
      name={partner.name}
      role={partner.pendingInvite ? "PENDING" : isOwner ? "COHOST" : "OWNER"}
      accent={isOwner ? "cyan" : "orange"}
      dim={partner.pendingInvite}
    />
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      {isOwner ? userBox : partnerBox}
      {isOwner ? partnerBox : userBox}
    </div>
  );
}

// ─── Editorial moment pill ───────────────────────────────────
//
// The "what's next" body block. Cover-image-led (4:3 aspect, like
// the session cards in the landing-page mockup), with a week eyebrow,
// session title, time row, and a small host attribution.
//
// Used for sessions; a tighter "launch date" variant covers
// pre-launch programs that don't have any scheduled sessions yet.

function weekOfSession(programStart: string | null, sessionStart: string): number | null {
  if (!programStart) return null;
  const s = new Date(programStart);
  s.setHours(0, 0, 0, 0);
  const ss = new Date(sessionStart);
  ss.setHours(0, 0, 0, 0);
  const days = Math.floor((ss.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return null;
  return Math.floor(days / 7) + 1;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
}

function HostAvatars({
  user,
  partner,
}: {
  user: UserProfile;
  partner: Partner | null;
}) {
  const avatarRing = (avatar: string | null, initial: string, color: string) => (
    <span
      className="w-5 h-5 rounded-full overflow-hidden inline-flex items-center justify-center"
      style={{
        border: "1.5px solid #FFFFFF",
        backgroundColor: avatar ? "transparent" : `${color}20`,
      }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[9px] font-headline" style={{ color, fontWeight: 700 }}>
          {initial}
        </span>
      )}
    </span>
  );
  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center -space-x-1">
        {avatarRing(user.avatar, user.initial, "#FF6130")}
        {partner && !partner.pendingInvite &&
          avatarRing(partner.avatar, partner.name[0]?.toUpperCase() ?? "?", "#0891b2")}
      </span>
      <span className="text-[10px] uppercase tracking-widest font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>
        {partner && !partner.pendingInvite
          ? `${firstName(user.name)} & ${firstName(partner.name)}`
          : firstName(user.name)}
      </span>
    </div>
  );
}

function NextSessionMoment({
  session,
  programStart,
  isUrgent,
  user,
  partner,
}: {
  session: ProgramSession;
  programStart: string | null;
  isUrgent: boolean;
  user: UserProfile;
  partner: Partner | null;
}) {
  const t = formatNextSessionTime(session.startTime);
  const week = weekOfSession(programStart, session.startTime);
  const accent = isUrgent ? "#ef4444" : "#0891b2";
  return (
    <div
      className="flex items-stretch gap-4 p-3 rounded-2xl"
      style={{
        backgroundColor: `${accent}08`,
        border: `1px solid ${accent}25`,
      }}
    >
      <div
        className="shrink-0 rounded-xl overflow-hidden relative bg-[#0F2229]"
        style={{ width: 120, aspectRatio: "4 / 3" }}
      >
        {session.imageUrl ? (
          <img src={session.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}45 0%, #0F2229 100%)` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none">
              <path d="M10 8 L10 16 L17 12 Z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
        <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: accent, fontWeight: 700 }}>
          {week ? `Week ${week} · ${dayLabel(session.startTime)}` : `Next · ${dayLabel(session.startTime)}`}
        </p>
        <p
          className="text-base md:text-lg font-headline tracking-tight truncate"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {session.title}
        </p>
        <p className="text-xs md:text-sm" style={{ color: "#475569", fontWeight: 600 }}>
          {t.day} {t.time} <span style={{ color: "#94a3b8" }}>· {t.relative}</span>
        </p>
        <div className="mt-1">
          <HostAvatars user={user} partner={partner} />
        </div>
      </div>
    </div>
  );
}

function LaunchMoment({
  startDate,
  imageUrl,
  user,
  partner,
}: {
  startDate: string;
  imageUrl: string | null;
  user: UserProfile;
  partner: Partner | null;
}) {
  const d = new Date(startDate + "T00:00:00");
  const headline = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const relative = formatRelative(d.toISOString());
  const accent = "#0891b2";
  return (
    <div
      className="flex items-stretch gap-4 p-3 rounded-2xl"
      style={{
        backgroundColor: `${accent}08`,
        border: `1px solid ${accent}25`,
      }}
    >
      <div
        className="shrink-0 rounded-xl overflow-hidden relative bg-[#0F2229]"
        style={{ width: 120, aspectRatio: "4 / 3" }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}45 0%, #0F2229 100%)` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.8}>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="8" y1="3" x2="8" y2="7" />
              <line x1="16" y1="3" x2="16" y2="7" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
        <p className="text-[10px] uppercase tracking-widest font-headline" style={{ color: accent, fontWeight: 700 }}>
          Launches
        </p>
        <p
          className="text-base md:text-lg font-headline tracking-tight truncate"
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {headline}
        </p>
        <p className="text-xs md:text-sm" style={{ color: "#475569", fontWeight: 600 }}>
          <span style={{ color: "#94a3b8" }}>{relative}</span>
        </p>
        <div className="mt-1">
          <HostAvatars user={user} partner={partner} />
        </div>
      </div>
    </div>
  );
}

/**
 * Small thumbnail card for the "other sessions" row in hero density.
 * Cover image (4:3) with status overlay, week eyebrow, title clipped.
 * Click opens the session detail page.
 */
function OtherSessionThumb({
  session,
  programStart,
}: {
  session: ProgramSession;
  programStart: string | null;
}) {
  const week = weekOfSession(programStart, session.startTime);
  const isPast =
    session.status === "ended" || new Date(session.startTime).getTime() < Date.now();
  const isLive = session.status === "live";
  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className="shrink-0 block rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        width: 120,
        backgroundColor: "rgba(255,255,255,0.65)",
        border: "1px solid rgba(15,34,41,0.08)",
      }}
    >
      <div
        className="relative bg-[#0F2229] overflow-hidden"
        style={{ aspectRatio: "4 / 3" }}
      >
        {session.imageUrl ? (
          <img
            src={session.imageUrl}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover ${isPast ? "grayscale opacity-70" : ""}`}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0891b2]/30 to-[#0F2229]" />
        )}
        {isPast && !isLive && (
          <span
            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full"
            style={{ backgroundColor: "rgba(15,34,41,0.7)" }}
            aria-label="Done"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {isLive && (
          <span
            className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-headline"
            style={{ backgroundColor: "rgba(15,34,41,0.85)", color: "#ef4444", fontWeight: 700 }}
          >
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: "#ef4444" }} />
            Live
          </span>
        )}
      </div>
      <div className="p-2">
        <p className="text-[9px] uppercase tracking-widest font-headline" style={{ color: "#94a3b8", fontWeight: 700 }}>
          {week ? `Week ${week} · ${dayLabel(session.startTime)}` : dayLabel(session.startTime)}
        </p>
        <p
          className="text-xs font-headline mt-0.5 line-clamp-2"
          style={{ color: isPast ? "#94a3b8" : "#0F2229", fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.25 }}
        >
          {session.title}
        </p>
      </div>
    </Link>
  );
}

function SessionScroller({
  program,
  user,
  partner,
}: {
  program: Program;
  user: UserProfile;
  partner: Partner | null;
}) {
  const sessions = program.sessions ?? [];
  if (sessions.length === 0) {
    // No sessions yet — fall back to launch-date moment for pre-launch.
    if (program.stage === "published-pre-launch" && program.startDate) {
      return <LaunchMoment startDate={program.startDate} imageUrl={program.imageUrl} user={user} partner={partner} />;
    }
    return null;
  }

  const nextIdx = sessions.findIndex(
    (s) =>
      s.status === "published" && new Date(s.startTime).getTime() > Date.now(),
  );
  const next = nextIdx >= 0 ? sessions[nextIdx] : sessions[0];
  const others = sessions.filter((s) => s.id !== next.id);
  const minsToNext =
    (new Date(next.startTime).getTime() - Date.now()) / 60000;
  const isUrgent = minsToNext > 0 && minsToNext < 24 * 60;

  return (
    <div className="space-y-3">
      <NextSessionMoment session={next} programStart={program.startDate} isUrgent={isUrgent} user={user} partner={partner} />
      {others.length > 0 && (
        <div className="-mx-1 px-1 overflow-x-auto">
          <div className="flex items-stretch gap-2 min-w-min pb-1">
            {others.map((s) => (
              <OtherSessionThumb
                key={s.id}
                session={s}
                programStart={program.startDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Editorial body — picks one of three shapes depending on density and
 * available data:
 *   - hero with sessions → SessionScroller (next pinned + scrollable rest)
 *   - compact OR no scroller → single moment pill (next session OR launch date)
 *   - drafting / awaiting / completed → null (parties row carries the body)
 */
function MomentBlock({
  program,
  density,
  user,
  partner,
}: {
  program: Program;
  density: "hero" | "compact";
  user: UserProfile;
  partner: Partner | null;
}) {
  const hasSessions = (program.sessions?.length ?? 0) > 0;

  if (density === "hero" && hasSessions) {
    return <SessionScroller program={program} user={user} partner={partner} />;
  }

  if (program.nextSession) {
    const minsToNext =
      (new Date(program.nextSession.startTime).getTime() - Date.now()) / 60000;
    const moreSessions = (program.sessions?.length ?? 0) - 1;
    return (
      <div className="space-y-2">
        <NextSessionMoment
          session={program.nextSession}
          programStart={program.startDate}
          isUrgent={minsToNext > 0 && minsToNext < 24 * 60}
          user={user}
          partner={partner}
        />
        {moreSessions > 0 && program.spaceId && (
          <Link
            href={`/communities/challenge/${program.spaceId}`}
            className="block text-[11px] uppercase tracking-widest font-headline px-1 hover:text-[#0F2229] transition-colors"
            style={{ color: "#94a3b8", fontWeight: 700 }}
          >
            +{moreSessions} more session{moreSessions === 1 ? "" : "s"} →
          </Link>
        )}
      </div>
    );
  }

  if (program.stage === "published-pre-launch" && program.startDate) {
    return <LaunchMoment startDate={program.startDate} imageUrl={program.imageUrl} user={user} partner={partner} />;
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
  const homeLabel =
    program.stage === "drafting-solo" ||
    program.stage === "drafting-jointly" ||
    program.stage === "awaiting-signatures"
      ? "Open workspace"
      : "Open challenge space";
  // The contextual action is "real" (different from card home) when its
  // href differs from `home`. When it matches, we render only the home
  // button — no need for two buttons that go to the same place.
  const showContextual = insight.primary.href !== home;

  // Density knobs — same shape, only size changes.
  const radius = isHero ? "rounded-3xl" : "rounded-2xl";
  const aspect = isHero ? "4 / 1" : "16 / 9";
  const padding = isHero ? "p-6 md:p-10" : "p-5";
  const titleSize = isHero ? "text-2xl md:text-4xl" : "text-lg md:text-xl";
  const titleSpacing = isHero ? "-0.025em" : "-0.02em";
  const chipPosition = isHero ? "top-4 right-4" : "top-3 right-3";

  return (
    <article
      className={`relative ${radius} overflow-hidden infitra-card-link transition-shadow flex flex-col`}
      style={{ border: "1px solid rgba(15,34,41,0.10)" }}
    >
      {/* Cover — image + a single status chip. Cleanly editorial.
          People moved into the body as a dedicated parties row. */}
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
        <div className={`absolute ${chipPosition} z-10`}>
          <StatusChip program={program} />
        </div>
      </div>

      {/* Body — insight, title, parties, editorial moment. */}
      <div className={`flex-1 flex flex-col ${padding}`}>
        <InsightLine insight={insight} />

        <h2
          className={`${titleSize} font-headline tracking-tight`}
          style={{ color: "#0F2229", fontWeight: 700, letterSpacing: titleSpacing }}
        >
          {program.title || "Untitled"}
        </h2>

        <div className="mt-5">
          <PartiesRow user={user} partner={partner} isOwner={program.isOwner} />
        </div>

        <div className="mt-5">
          <MomentBlock program={program} density={density} user={user} partner={partner} />
        </div>

        <div className="flex-1" />

        {/* Footer — explicit buttons. No whole-card overlay. The home
            button is always present; the contextual action sits to its
            right when the cascade picks something different. */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {showContextual ? (
              <>
                <PrimaryActionPill
                  label={insight.primary.label}
                  kind={insight.primary.kind}
                  href={insight.primary.href}
                  variant="filled"
                />
                <PrimaryActionPill
                  label={homeLabel}
                  kind="navigate"
                  href={home}
                  variant="outlined"
                />
              </>
            ) : (
              <PrimaryActionPill
                label={homeLabel}
                kind="navigate"
                href={home}
                variant="filled"
              />
            )}
          </div>
          {showsContract(program.stage) && <SecondaryActions program={program} />}
        </div>
      </div>
    </article>
  );
}
